/**
 * Pre-Order Controller
 * Controller للطلبات المسبقة والتوصيل الجماعي
 */

const Order = require('../models/Order');
const GroupDelivery = require('../models/GroupDelivery');
const Customer = require('../models/Customer');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * إنشاء طلب مسبق
 */
exports.createPreOrder = catchAsync(async (req, res, next) => {
    const { customer, items, total, paymentMethod, shipping, harvestSeason, expectedDeliveryDate } = req.body;

    // التحقق من المنتجات
    const Product = require('../models/Product');
    for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
            return next(new AppError(`المنتج ${item.product} غير موجود`, 404));
        }
    }

    // إنشاء رقم طلب مسبق
    const orderId = `PRE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // حساب المبالغ
    const grandTotal = total + (shipping || 0);
    let paymentData = {
        paidAmount: 0,
        remainingAmount: grandTotal,
        paymentStatus: 'pending',
        payments: []
    };

    if (paymentMethod === 'half') {
        const halfAmount = Math.ceil(grandTotal / 2);
        paymentData.paidAmount = halfAmount;
        paymentData.remainingAmount = grandTotal - halfAmount;
        paymentData.paymentStatus = 'partial';
        paymentData.payments.push({
            amount: halfAmount,
            paidAt: new Date(),
            method: 'cash',
            notes: 'دفع النصف الأول للطلب المسبق'
        });
    } else if (paymentMethod === 'full') {
        paymentData.paidAmount = grandTotal;
        paymentData.remainingAmount = 0;
        paymentData.paymentStatus = 'paid';
        paymentData.payments.push({
            amount: grandTotal,
            paidAt: new Date(),
            method: 'cash',
            notes: 'دفع كامل للطلب المسبق'
        });
    }

    const order = new Order({
        orderId,
        customer,
        items,
        total,
        shipping: shipping || 0,
        paymentMethod: paymentMethod || 'half',
        payment: paymentData,
        orderType: 'preorder',
        preOrder: {
            harvestSeason: harvestSeason || `موسم ${new Date().getFullYear() + 1}`,
            expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
            isHarvested: false
        },
        status: 'pending',
        statusHistory: [{
            status: 'pending',
            changedAt: new Date(),
            notes: 'تم إنشاء طلب مسبق'
        }]
    });

    await order.save();

    res.status(201).json({
        success: true,
        message: 'تم إنشاء الطلب المسبق بنجاح',
        order
    });
});

/**
 * إنشاء توصيل جماعي
 */
exports.createGroupDelivery = catchAsync(async (req, res, next) => {
    const { country, region, city, deliveryDate, route, orderIds, notes } = req.body;

    if (!country || !region || !deliveryDate) {
        return next(new AppError('الدولة والمنطقة وتاريخ التوصيل مطلوبة', 400));
    }

    const groupId = `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const groupDelivery = new GroupDelivery({
        groupId,
        country,
        region,
        city: city || region,
        deliveryDate: new Date(deliveryDate),
        route: {
            from: route?.from || 'الحديدة',
            to: route?.to || region,
            description: route?.description || `${route?.from || 'الحديدة'} -> ${route?.to || region}`
        },
        orders: orderIds || [],
        status: 'pending',
        totalOrders: orderIds ? orderIds.length : 0,
        notes: notes || ''
    });

    await groupDelivery.save();

    // ربط الطلبات بالتوصيل الجماعي
    if (orderIds && orderIds.length > 0) {
        await Order.updateMany(
            { _id: { $in: orderIds } },
            {
                $set: {
                    'groupDelivery.groupId': groupDelivery._id,
                    'groupDelivery.deliveryRoute': groupDelivery.route.description,
                    'groupDelivery.deliveryDate': groupDelivery.deliveryDate
                }
            }
        );
    }

    res.status(201).json({
        success: true,
        message: 'تم إنشاء التوصيل الجماعي بنجاح',
        groupDelivery
    });
});

/**
 * الحصول على التوصيلات الجماعية حسب المنطقة
 */
exports.getGroupDeliveriesByRegion = catchAsync(async (req, res, next) => {
    const { country, region, status } = req.query;

    let query = {};
    if (country) query.country = country;
    if (region) query.region = region;
    if (status) query.status = status;

    const groupDeliveries = await GroupDelivery.find(query)
        .populate('orders')
        .sort({ deliveryDate: 1 });

    res.status(200).json({
        success: true,
        data: groupDeliveries,
        count: groupDeliveries.length
    });
});

/**
 * الحصول على توصيل جماعي واحد
 */
exports.getGroupDelivery = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const groupDelivery = await GroupDelivery.findById(id)
        .populate('orders');

    if (!groupDelivery) {
        return next(new AppError('التوصيل الجماعي غير موجود', 404));
    }

    res.status(200).json({
        success: true,
        data: groupDelivery
    });
});

/**
 * تحديث حالة التوصيل الجماعي
 */
exports.updateGroupDeliveryStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const groupDelivery = await GroupDelivery.findById(id);
    if (!groupDelivery) {
        return next(new AppError('التوصيل الجماعي غير موجود', 404));
    }

    await groupDelivery.updateStatus(status, notes);

    res.status(200).json({
        success: true,
        message: 'تم تحديث حالة التوصيل الجماعي بنجاح',
        data: groupDelivery
    });
});

/**
 * إضافة طلب لتوصيل جماعي
 */
exports.addOrderToGroup = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { orderId } = req.body;

    const groupDelivery = await GroupDelivery.findById(id);
    if (!groupDelivery) {
        return next(new AppError('التوصيل الجماعي غير موجود', 404));
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new AppError('الطلب غير موجود', 404));
    }

    await groupDelivery.addOrder(orderId);

    // ربط الطلب بالتوصيل الجماعي
    order.groupDelivery = {
        groupId: groupDelivery._id,
        deliveryRoute: groupDelivery.route.description,
        deliveryDate: groupDelivery.deliveryDate
    };
    await order.save();

    res.status(200).json({
        success: true,
        message: 'تم إضافة الطلب للتوصيل الجماعي بنجاح',
        data: groupDelivery
    });
});

/**
 * إزالة طلب من توصيل جماعي
 */
exports.removeOrderFromGroup = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { orderId } = req.body;

    const groupDelivery = await GroupDelivery.findById(id);
    if (!groupDelivery) {
        return next(new AppError('التوصيل الجماعي غير موجود', 404));
    }

    await groupDelivery.removeOrder(orderId);

    // إزالة ربط الطلب بالتوصيل الجماعي
    const order = await Order.findById(orderId);
    if (order) {
        order.groupDelivery = undefined;
        await order.save();
    }

    res.status(200).json({
        success: true,
        message: 'تم إزالة الطلب من التوصيل الجماعي بنجاح',
        data: groupDelivery
    });
});

/**
 * الحصول على الطلبات المسبقة
 */
exports.getPreOrders = catchAsync(async (req, res, next) => {
    const { harvestSeason, isHarvested } = req.query;

    let query = { orderType: 'preorder' };
    if (harvestSeason) query['preOrder.harvestSeason'] = harvestSeason;
    if (isHarvested !== undefined) query['preOrder.isHarvested'] = isHarvested === 'true';

    const preOrders = await Order.find(query)
        .sort({ 'preOrder.expectedDeliveryDate': 1 });

    res.status(200).json({
        success: true,
        data: preOrders,
        count: preOrders.length
    });
});

/**
 * تحديث حالة الحصاد للطلب المسبق
 */
exports.markAsHarvested = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
        return next(new AppError('الطلب غير موجود', 404));
    }

    if (order.orderType !== 'preorder') {
        return next(new AppError('هذا الطلب ليس طلباً مسبقاً', 400));
    }

    order.preOrder.isHarvested = true;
    order.preOrder.harvestedAt = new Date();
    order.status = 'ready_to_ship';
    
    order.statusHistory.push({
        status: 'ready_to_ship',
        changedAt: new Date(),
        changedBy: req.user?.username || 'admin',
        notes: 'تم حصاد المنتج - جاهز للشحن'
    });

    await order.save();

    res.status(200).json({
        success: true,
        message: 'تم تحديث حالة الحصاد بنجاح',
        order
    });
});










