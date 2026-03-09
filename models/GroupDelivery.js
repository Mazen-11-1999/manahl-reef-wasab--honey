/**
 * Group Delivery Model
 * نموذج التوصيل الجماعي - مناحل ريف وصاب
 */

const mongoose = require('mongoose');

const GroupDeliverySchema = new mongoose.Schema({
    groupId: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    deliveryDate: {
        type: Date,
        required: true
    },
    route: {
        from: {
            type: String,
            required: true,
            trim: true // مثل: "الحديدة"
        },
        to: {
            type: String,
            required: true,
            trim: true // مثل: "صنعاء"
        },
        description: {
            type: String,
            trim: true // مثل: "الحديدة -> صنعاء"
        }
    },
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalWeight: {
        type: Number,
        default: 0
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000
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
GroupDeliverySchema.index({ country: 1, region: 1 });
GroupDeliverySchema.index({ deliveryDate: 1 });
GroupDeliverySchema.index({ status: 1 });
GroupDeliverySchema.index({ 'route.from': 1, 'route.to': 1 });
GroupDeliverySchema.index({ createdAt: -1 });

// Virtual
GroupDeliverySchema.virtual('ordersCount').get(function() {
    return this.orders ? this.orders.length : 0;
});

// Methods
GroupDeliverySchema.methods.addOrder = function(orderId) {
    if (!this.orders.includes(orderId)) {
        this.orders.push(orderId);
        this.totalOrders = this.orders.length;
    }
    return this.save();
};

GroupDeliverySchema.methods.removeOrder = function(orderId) {
    this.orders = this.orders.filter(id => id.toString() !== orderId.toString());
    this.totalOrders = this.orders.length;
    return this.save();
};

GroupDeliverySchema.methods.updateStatus = function(newStatus, notes = '') {
    this.status = newStatus;
    if (notes) {
        this.notes = (this.notes ? this.notes + '\n' : '') + notes;
    }
    return this.save();
};

// Pre-save middleware
GroupDeliverySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // تحديث عدد الطلبات تلقائياً
    if (this.orders) {
        this.totalOrders = this.orders.length;
    }
    
    // إنشاء وصف المسار إذا لم يكن موجوداً
    if (this.route && this.route.from && this.route.to && !this.route.description) {
        this.route.description = `${this.route.from} -> ${this.route.to}`;
    }
    
    next();
});

const GroupDelivery = mongoose.model('GroupDelivery', GroupDeliverySchema);

module.exports = GroupDelivery;










