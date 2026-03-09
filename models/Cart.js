/**
 * Cart Model
 * نموذج سلة التسوق - مناحل ريف وصاب
 */

const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'المنتج مطلوب']
    },
    quantity: {
        type: Number,
        required: [true, 'الكمية مطلوبة'],
        min: [1, 'الكمية يجب أن تكون على الأقل 1'],
        default: 1
    },
    price: {
        type: Number,
        required: [true, 'السعر مطلوب'],
        min: [0, 'السعر يجب أن يكون موجباً']
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const CartSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'العميل مطلوب'],
        unique: true
    },
    
    items: [CartItemSchema],
    
    // تواريخ
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ساعة
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
CartSchema.index({ customer: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual لحساب المجموع الفرعي
CartSchema.virtual('subtotal').get(function() {
    return this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
});

// Virtual لحساب المجموع الكلي
CartSchema.virtual('total').get(function() {
    return this.subtotal;
});

// Virtual لحساب عدد العناصر
CartSchema.virtual('itemCount').get(function() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
});

// إضافة منتج للسلة
CartSchema.methods.addItem = function(productId, quantity = 1, price) {
    const existingItem = this.items.find(
        item => item.product.toString() === productId.toString()
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
        if (price) existingItem.price = price;
    } else {
        this.items.push({
            product: productId,
            quantity: quantity,
            price: price
        });
    }
    
    this.updatedAt = Date.now();
    return this.save();
};

// تحديث كمية منتج
CartSchema.methods.updateItemQuantity = function(productId, quantity) {
    const item = this.items.find(
        item => item.product.toString() === productId.toString()
    );
    
    if (item) {
        if (quantity <= 0) {
            this.removeItem(productId);
        } else {
            item.quantity = quantity;
            this.updatedAt = Date.now();
        }
    }
    
    return this.save();
};

// إزالة منتج من السلة
CartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(
        item => item.product.toString() !== productId.toString()
    );
    this.updatedAt = Date.now();
    return this.save();
};

// تفريغ السلة
CartSchema.methods.clear = function() {
    this.items = [];
    this.updatedAt = Date.now();
    return this.save();
};

// التحقق من انتهاء صلاحية السلة
CartSchema.methods.isExpired = function() {
    return new Date() > this.expiresAt;
};

// تمديد صلاحية السلة
CartSchema.methods.extendExpiry = function(hours = 24) {
    this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    return this.save();
};

// Pre-save middleware
CartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;













