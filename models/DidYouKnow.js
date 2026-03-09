/**
 * Did You Know Model
 * نموذج "هل تعلم؟"
 */

const mongoose = require('mongoose');

const DidYouKnowSchema = new mongoose.Schema({
    text: { 
        type: String, 
        required: [true, 'النص مطلوب'],
        trim: true,
        maxlength: [1000, 'النص لا يمكن أن يكون أطول من 1000 حرف']
    },
    active: { 
        type: Boolean, 
        default: true 
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
DidYouKnowSchema.index({ active: 1 });
DidYouKnowSchema.index({ createdAt: -1 });
DidYouKnowSchema.index({ text: 'text' });

// Pre-save middleware
DidYouKnowSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get random active item
DidYouKnowSchema.statics.getRandom = async function() {
    const count = await this.countDocuments({ active: true });
    if (count === 0) return null;
    
    const random = Math.floor(Math.random() * count);
    return this.findOne({ active: true }).skip(random);
};

// Static method to get all active items
DidYouKnowSchema.statics.getActive = async function() {
    return this.find({ active: true }).sort({ createdAt: -1 });
};

const DidYouKnow = mongoose.model('DidYouKnow', DidYouKnowSchema);

module.exports = DidYouKnow;











