/**
 * Order Model
 * نموذج الطلب
 */

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: { 
        type: String, 
        unique: true,
        required: [true, 'رقم الطلب مطلوب'],
        trim: true
    },
    /** ربط الطلب بالمستخدم إذا كان مسجلاً عند إنشاء الطلب (لحساب عدد المشتريات والشارات) */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customer: {
        name: {
            type: String,
            required: [true, 'اسم العميل مطلوب'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'رقم الهاتف مطلوب'],
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        city: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true,
            default: ''
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'الملاحظات لا يمكن أن تكون أطول من 500 حرف']
        },
        country: {
            type: String,
            trim: true,
            default: 'اليمن'
        },
        region: {
            type: String,
            trim: true // مثل: صنعاء، الحديدة، الرياض، جدة، نيويورك
        },
        location: {
            latitude: {
                type: Number
            },
            longitude: {
                type: Number
            }
        }
    },
    items: [{
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'السعر لا يمكن أن يكون سالباً']
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'الكمية يجب أن تكون على الأقل 1']
        }
    }],
    total: {
        type: Number,
        required: true,
        min: [0, 'المجموع لا يمكن أن يكون سالباً']
    },
    shipping: { 
        type: Number, 
        default: 0,
        min: [0, 'تكلفة الشحن لا يمكن أن تكون سالبة']
    },
    shippingAgreed: {
        type: Boolean,
        default: false
    },
    shippingNotes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    currency: {
        type: String,
        enum: ['YER', 'SAR'],
        default: 'YER'
    },
    paymentMethod: {
        type: String,
        enum: ['half', 'full', 'delivery', 'cash', 'bank_transfer', 'card', 'other'],
        default: 'delivery'
    },
    // معلومات الدفع
    payment: {
        paidAmount: {
            type: Number,
            default: 0,
            min: [0, 'المبلغ المدفوع لا يمكن أن يكون سالباً']
        },
        remainingAmount: {
            type: Number,
            default: 0,
            min: [0, 'المبلغ المتبقي لا يمكن أن يكون سالباً']
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partial', 'paid', 'completed'],
            default: 'pending'
        },
        payments: [{
            amount: {
                type: Number,
                required: true,
                min: [0, 'المبلغ لا يمكن أن يكون سالباً']
            },
            paidAt: {
                type: Date,
                default: Date.now
            },
            method: {
                type: String,
                enum: ['cash', 'bank_transfer', 'card', 'other'],
                default: 'cash'
            },
            notes: {
                type: String,
                trim: true
            }
        }]
    },
    // نوع الطلب
    orderType: {
        type: String,
        enum: ['normal', 'preorder'],
        default: 'normal'
    },
    // للطلبات المسبقة
    preOrder: {
        harvestSeason: {
            type: String, // مثل: "موسم 2025"
            trim: true
        },
        expectedDeliveryDate: {
            type: Date
        },
        isHarvested: {
            type: Boolean,
            default: false
        },
        harvestedAt: {
            type: Date
        }
    },
    // التوصيل الجماعي
    groupDelivery: {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GroupDelivery'
        },
        deliveryRoute: {
            type: String,
            trim: true // مثل: "الحديدة -> صنعاء"
        },
        deliveryDate: {
            type: Date
        }
    },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'paid', 'ready_to_ship', 'shipped', 'delivered', 'completed', 'cancelled'],
        default: 'pending' 
    },
    shippingReceipt: {
        url: {
            type: String,
            trim: true
        },
        uploadedAt: {
            type: Date
        }
    },
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        changedAt: { 
            type: Date, 
            default: Date.now 
        },
        changedBy: {
            type: String,
            trim: true
        },
        notes: {
            type: String,
            trim: true
        }
    }],
    whatsappMessage: {
        type: String,
        trim: true
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
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'customer.name': 'text' });
OrderSchema.index({ 'customer.country': 1, 'customer.region': 1 });
OrderSchema.index({ orderType: 1 });
OrderSchema.index({ 'preOrder.expectedDeliveryDate': 1 });
OrderSchema.index({ 'groupDelivery.groupId': 1 });
OrderSchema.index({ user: 1 });

// Virtual for total with shipping
OrderSchema.virtual('grandTotal').get(function() {
    return this.total + (this.shipping || 0);
});

// Pre-save middleware to update updatedAt and calculate payment amounts
OrderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // حساب المبالغ المدفوعة والمتبقية
    if (this.payment && this.payment.payments) {
        const totalPaid = this.payment.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        this.payment.paidAmount = totalPaid;
        this.payment.remainingAmount = Math.max(0, (this.total + (this.shipping || 0)) - totalPaid);
        
        // تحديث حالة الدفع
        if (totalPaid === 0) {
            this.payment.paymentStatus = 'pending';
        } else if (totalPaid >= (this.total + (this.shipping || 0))) {
            this.payment.paymentStatus = 'completed';
        } else {
            this.payment.paymentStatus = 'partial';
        }
    } else if (this.paymentMethod === 'full') {
        // إذا كان الدفع كامل، يتم اعتباره مكتمل عند الإنشاء
        if (!this.payment) this.payment = {};
        this.payment.paidAmount = this.total + (this.shipping || 0);
        this.payment.remainingAmount = 0;
        this.payment.paymentStatus = 'paid';
    } else if (this.paymentMethod === 'half') {
        // إذا كان الدفع النصفي، يتم حساب النصف
        if (!this.payment) this.payment = {};
        const halfAmount = Math.ceil((this.total + (this.shipping || 0)) / 2);
        this.payment.paidAmount = halfAmount;
        this.payment.remainingAmount = (this.total + (this.shipping || 0)) - halfAmount;
        this.payment.paymentStatus = 'partial';
    } else if (this.paymentMethod === 'delivery') {
        // الدفع عند الاستلام
        if (!this.payment) this.payment = {};
        this.payment.paidAmount = 0;
        this.payment.remainingAmount = this.total + (this.shipping || 0);
        this.payment.paymentStatus = 'pending';
    }
    
    // Add status to history if it changed
    if (this.isModified('status') && this.statusHistory) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            changedBy: this.customer?.name || 'System'
        });
    }
    
    next();
});

// Method to update status
OrderSchema.methods.updateStatus = function(newStatus, changedBy, notes) {
    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy: changedBy || 'System',
        notes: notes || ''
    });
    return this.save();
};

// Method to add shipping receipt
OrderSchema.methods.addShippingReceipt = function(receiptUrl) {
    this.shippingReceipt = {
        url: receiptUrl,
        uploadedAt: new Date()
    };
    return this.save();
};

// Method to add payment
OrderSchema.methods.addPayment = function(amount, method = 'cash', notes = '') {
    if (!this.payment) {
        this.payment = {
            paidAmount: 0,
            remainingAmount: this.total + (this.shipping || 0),
            paymentStatus: 'pending',
            payments: []
        };
    }
    
    this.payment.payments.push({
        amount,
        paidAt: new Date(),
        method,
        notes
    });
    
    return this.save();
};

// Static method to generate order ID
OrderSchema.statics.generateOrderId = function() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `ORD-${timestamp}-${random}`;
};

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;


