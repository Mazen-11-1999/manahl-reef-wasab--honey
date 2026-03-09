/**
 * Order Controller
 * Controller لإدارة الطلبات مع الإشعارات
 */

const Order = require('../models/Order');
const Customer = require('../models/Customer');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * إضافة المشتري إلى مسابقات الشراء التلقائي
 */
async function addToPurchaseContests(order) {
    try {
        const Contest = require('../models/Contest');
        const now = new Date();

        // البحث عن مسابقات الشراء النشطة
        const purchaseContests = await Contest.find({
            type: 'purchase',
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        if (purchaseContests.length === 0) {
            return; // لا توجد مسابقات شراء نشطة
        }

        // إضافة المشتري لكل مسابقة
        for (const contest of purchaseContests) {
            // التحقق من عدم وجود المشتري مسبقاً
            const existingParticipant = contest.participants.find(
                p => (p.customerId && order.customer._id && p.customerId.toString() === order.customer._id.toString()) ||
                    (p.phone === order.customer.phone)
            );

            if (!existingParticipant) {
                await contest.addParticipant({
                    customerId: order.customer._id || null,
                    name: order.customer.name,
                    phone: order.customer.phone,
                    isEligible: true, // مؤهل مباشرة لأنه اشترى
                    requirementsStatus: {
                        followSocial: { verified: false, verificationProof: [] },
                        shareWhatsApp: { verified: false, sharesCount: 0, sharesProof: [] },
                        answerQuestions: { verified: false, correctAnswers: 0 }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error adding to purchase contests:', error);
        // لا نرمي خطأ حتى لا يؤثر على عملية الطلب
    }
}

/**
 * إنشاء طلب جديد
 */
exports.createOrder = catchAsync(async (req, res, next) => {
    const { orderId, customer, items, total, paymentMethod, shipping } = req.body;

    // التحقق من وجود المنتجات
    const Product = require('../models/Product');
    for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
            return next(new AppError(`المنتج ${item.product} غير موجود`, 404));
        }
        if (product.stock < item.quantity) {
            return next(new AppError(`الكمية المتاحة من ${product.name} غير كافية`, 400));
        }
    }

    // إنشاء رقم طلب تلقائي إذا لم يتم توفيره
    let finalOrderId = orderId;
    if (!finalOrderId) {
        finalOrderId = `RW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    // حساب المبالغ حسب طريقة الدفع
    const grandTotal = total + (shipping || 0);
    let paymentData = {
        paidAmount: 0,
        remainingAmount: grandTotal,
        paymentStatus: 'pending',
        payments: []
    };

    if (paymentMethod === 'full') {
        // الدفع الكامل
        paymentData.paidAmount = grandTotal;
        paymentData.remainingAmount = 0;
        paymentData.paymentStatus = 'paid';
        paymentData.payments.push({
            amount: grandTotal,
            paidAt: new Date(),
            method: 'cash',
            notes: 'دفع كامل عند إنشاء الطلب'
        });
    } else if (paymentMethod === 'half') {
        // الدفع النصفي
        const halfAmount = Math.ceil(grandTotal / 2);
        paymentData.paidAmount = halfAmount;
        paymentData.remainingAmount = grandTotal - halfAmount;
        paymentData.paymentStatus = 'partial';
        paymentData.payments.push({
            amount: halfAmount,
            paidAt: new Date(),
            method: 'cash',
            notes: 'دفع النصف الأول عند إنشاء الطلب'
        });
    } else {
        // الدفع عند الاستلام
        paymentData.paidAmount = 0;
        paymentData.remainingAmount = grandTotal;
        paymentData.paymentStatus = 'pending';
    }

    // إنشاء الطلب (ربط المستخدم إذا كان مسجلاً)
    const orderData = {
        orderId: finalOrderId,
        customer,
        items,
        total,
        shipping: shipping || 0,
        paymentMethod: paymentMethod || 'delivery',
        payment: paymentData,
        status: 'pending',
        statusHistory: [{
            status: 'pending',
            changedAt: new Date(),
            notes: 'تم إنشاء الطلب'
        }]
    };
    if (req.user && req.user._id) {
        orderData.user = req.user._id;
    }
    const order = new Order(orderData);

    await order.save();

    // البحث عن Customer إذا كان موجوداً
    let customerDoc = null;
    if (customer.phone) {
        customerDoc = await Customer.findOne({ phone: customer.phone });
    }

    // الحصول على المشرف الأول للإشعارات
    const adminUser = await User.findOne({ role: 'admin' });

    // إرسال الإشعارات
    if (customerDoc && adminUser) {
        await notificationService.notifyOrderCreated(order, customerDoc, adminUser);
    } else if (adminUser) {
        // إشعار للمشرف فقط
        await notificationService.sendNotification(
            adminUser._id,
            null,
            order._id,
            'order_created',
            `طلب جديد #${order.orderId}`,
            `طلب جديد من ${customer.name}`,
            {
                customerEmail: customer.email,
                customerPhone: customer.phone
            }
        );
    }

    // إضافة المشتري إلى مسابقات الشراء عند الدفع الكامل مباشرة
    if (paymentMethod === 'full' && paymentData.paymentStatus === 'paid') {
        if (customerDoc) {
            order.customer._id = customerDoc._id;
        }
        await addToPurchaseContests(order);
    }

    res.status(201).json({
        success: true,
        message: 'تم إنشاء الطلب بنجاح',
        order
    });
});

/**
 * تحديث حالة الطلب
 */
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        return next(new AppError('الطلب غير موجود', 404));
    }

    const oldStatus = order.status;
    order.status = status;
    
    // إضافة للسجل
    order.statusHistory.push({
        status: status,
        changedAt: new Date(),
        changedBy: req.user ? req.user.username : 'system',
        notes: notes || `تم تغيير الحالة من ${oldStatus} إلى ${status}`
    });

    await order.save();

    // البحث عن Customer
    let customerDoc = null;
    if (order.customer.phone) {
        customerDoc = await Customer.findOne({ phone: order.customer.phone });
    }

    // إرسال إشعارات
    if (customerDoc && req.user) {
        await notificationService.notifyOrderStatusChanged(order, customerDoc, req.user, status);
    }

    // إضافة المشتري إلى مسابقات الشراء عند اكتمال الطلب
    if (status === 'completed') {
        // محاولة الحصول على customerId من customerDoc
        if (customerDoc) {
            order.customer._id = customerDoc._id;
        }
        await addToPurchaseContests(order);
    }

    res.status(200).json({
        success: true,
        message: 'تم تحديث حالة الطلب بنجاح',
        order
    });
});

/**
 * تحديث الطلب
 */
exports.updateOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;

    const order = await Order.findById(id);
    if (!order) {
        return next(new AppError('الطلب غير موجود', 404));
    }

    // تحديث الحقول المسموحة
    if (updateData.shipping !== undefined) {
        order.shipping = updateData.shipping;
    }
    if (updateData.shippingAgreed !== undefined) {
        order.shippingAgreed = updateData.shippingAgreed;
    }
    if (updateData.shippingNotes !== undefined) {
        order.shippingNotes = updateData.shippingNotes;
    }

    // إعادة حساب المبالغ إذا تغير الشحن
    if (updateData.shipping !== undefined) {
        const grandTotal = order.total + order.shipping;
        if (order.payment) {
            order.payment.remainingAmount = Math.max(0, grandTotal - (order.payment.paidAmount || 0));
        }
    }

    await order.save();

    res.status(200).json({
        success: true,
        message: 'تم تحديث الطلب بنجاح',
        order
    });
});

/**
 * رفع سند الشحن
 */
exports.uploadShippingReceipt = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!req.file) {
        return next(new AppError('يرجى رفع صورة سند الشحن', 400));
    }

    const order = await Order.findById(id);
    if (!order) {
        return next(new AppError('الطلب غير موجود', 404));
    }

    const receiptUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    order.shippingReceipt = {
        url: receiptUrl,
        uploadedAt: new Date()
    };

    // تحديث الحالة إلى shipped إذا لم تكن
    if (order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'completed') {
        order.status = 'shipped';
        order.statusHistory.push({
            status: 'shipped',
            changedAt: new Date(),
            changedBy: req.user ? req.user.username : 'system',
            notes: 'تم رفع سند الشحن'
        });
    }

    await order.save();

    // البحث عن Customer
    let customerDoc = null;
    if (order.customer.phone) {
        customerDoc = await Customer.findOne({ phone: order.customer.phone });
    }

    // إرسال إشعارات
    if (customerDoc && req.user) {
        await notificationService.notifyShippingReceiptUploaded(order, customerDoc, req.user, receiptUrl);
    }

    res.status(200).json({
        success: true,
        message: 'تم رفع سند الشحن بنجاح',
        order,
        receiptUrl
    });
});

/**
 * الحصول على طلب
 */
exports.getOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const order = await Order.findById(id)
        .populate('items.product', 'name image price');

    if (!order) {
        return next(new AppError('الطلب غير موجود', 404));
    }

    res.status(200).json({
        success: true,
        order
    });
});

/**
 * الحصول على طلب برقم الطلب (للتتبع)
 */
exports.getOrderByOrderId = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId })
        .populate('items.product', 'name image price');

    if (!order) {
        return next(new AppError('الطلب غير موجود', 404));
    }

    res.status(200).json({
        success: true,
        order
    });
});

/**
 * الحصول على جميع الطلبات
 */
// حد أقصى للطلبات في استجابة واحدة (لتحمل الأحمال الكبيرة دون استعلامات ثقيلة)
const MAX_ORDERS_LIMIT = 1000;

exports.getOrders = catchAsync(async (req, res, next) => {
    const { status, customerPhone, startDate, endDate, page = 1, limit = 20, sort } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (customerPhone) query['customer.phone'] = customerPhone;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    let sortOption = { createdAt: -1 };
    if (sort) {
        const [field, order] = sort.split('-');
        sortOption = { [field]: order === 'asc' ? 1 : -1 };
    }
    
    const limitNum = Math.min(parseInt(limit, 10) || 20, MAX_ORDERS_LIMIT);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * limitNum;
    
    const orders = await Order.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum);
    
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
        success: true,
        data: orders,
        orders,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    });
});

/**
 * إضافة دفعة للطلب
 */
exports.addPayment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { amount, method = 'cash', notes = '' } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        return next(new AppError('الطلب غير موجود', 404));
    }

    const grandTotal = order.total + (order.shipping || 0);
    const currentPaid = order.payment?.paidAmount || 0;
    const newPaid = currentPaid + amount;

    if (newPaid > grandTotal) {
        return next(new AppError('المبلغ المدفوع يتجاوز المبلغ الإجمالي', 400));
    }

    // إضافة الدفعة
    await order.addPayment(amount, method, notes);

    // تحديث حالة الطلب إذا تم الدفع بالكامل
    if (newPaid >= grandTotal && order.status === 'pending') {
        await order.updateStatus('paid', req.user?.username || 'admin', 'تم الدفع بالكامل');
    }

    // إعادة تحميل الطلب
    const updatedOrder = await Order.findById(id);

    // إضافة المشتري إلى مسابقات الشراء عند الدفع الكامل
    if (newPaid >= grandTotal) {
        // البحث عن Customer
        let customerDoc = null;
        if (updatedOrder.customer.phone) {
            customerDoc = await Customer.findOne({ phone: updatedOrder.customer.phone });
        }
        
        if (customerDoc) {
            updatedOrder.customer._id = customerDoc._id;
        }
        
        await addToPurchaseContests(updatedOrder);
    }

    res.status(200).json({
        success: true,
        message: 'تم إضافة الدفعة بنجاح',
        order: updatedOrder
    });
});










