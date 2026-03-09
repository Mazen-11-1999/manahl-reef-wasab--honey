/**
 * Cart Controller
 * Controller لإدارة سلة التسوق
 */

const Cart = require('../models/Cart');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * الحصول على السلة
 */
exports.getCart = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    let cart = await Cart.findOne({ customer: customer._id })
        .populate('items.product', 'name image price oldPrice stock status');
    
    // إنشاء سلة جديدة إذا لم تكن موجودة
    if (!cart) {
        cart = await Cart.create({ customer: customer._id });
    }
    
    // التحقق من انتهاء الصلاحية
    if (cart.isExpired()) {
        await cart.extendExpiry();
    }
    
    res.status(200).json({
        success: true,
        cart: {
            ...cart.toObject(),
            subtotal: cart.subtotal,
            total: cart.total,
            itemCount: cart.itemCount
        }
    });
});

/**
 * إضافة منتج للسلة
 */
exports.addItem = catchAsync(async (req, res, next) => {
    const { productId, quantity = 1 } = req.body;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    // التحقق من وجود المنتج
    const product = await Product.findById(productId);
    
    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }
    
    if (product.status !== 'active') {
        return next(new AppError('المنتج غير متاح', 400));
    }
    
    if (product.stock < quantity) {
        return next(new AppError('الكمية المتاحة غير كافية', 400));
    }
    
    // الحصول على السلة أو إنشاؤها
    let cart = await Cart.findOne({ customer: customer._id });
    
    if (!cart) {
        cart = await Cart.create({ customer: customer._id });
    }
    
    // إضافة المنتج
    await cart.addItem(productId, quantity, product.price);
    
    await cart.populate('items.product', 'name image price oldPrice stock');
    
    res.status(200).json({
        success: true,
        message: 'تم إضافة المنتج للسلة',
        cart: {
            ...cart.toObject(),
            subtotal: cart.subtotal,
            total: cart.total,
            itemCount: cart.itemCount
        }
    });
});

/**
 * تحديث كمية منتج في السلة
 */
exports.updateItem = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const cart = await Cart.findOne({ customer: customer._id });
    
    if (!cart) {
        return next(new AppError('السلة غير موجودة', 404));
    }
    
    // التحقق من المخزون
    const product = await Product.findById(productId);
    
    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }
    
    if (product.stock < quantity) {
        return next(new AppError('الكمية المتاحة غير كافية', 400));
    }
    
    await cart.updateItemQuantity(productId, quantity);
    
    await cart.populate('items.product', 'name image price oldPrice stock');
    
    res.status(200).json({
        success: true,
        message: 'تم تحديث الكمية',
        cart: {
            ...cart.toObject(),
            subtotal: cart.subtotal,
            total: cart.total,
            itemCount: cart.itemCount
        }
    });
});

/**
 * إزالة منتج من السلة
 */
exports.removeItem = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const cart = await Cart.findOne({ customer: customer._id });
    
    if (!cart) {
        return next(new AppError('السلة غير موجودة', 404));
    }
    
    await cart.removeItem(productId);
    
    await cart.populate('items.product', 'name image price oldPrice stock');
    
    res.status(200).json({
        success: true,
        message: 'تم إزالة المنتج من السلة',
        cart: {
            ...cart.toObject(),
            subtotal: cart.subtotal,
            total: cart.total,
            itemCount: cart.itemCount
        }
    });
});

/**
 * تفريغ السلة
 */
exports.clearCart = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const cart = await Cart.findOne({ customer: customer._id });
    
    if (!cart) {
        return next(new AppError('السلة غير موجودة', 404));
    }
    
    await cart.clear();
    
    res.status(200).json({
        success: true,
        message: 'تم تفريغ السلة'
    });
});














