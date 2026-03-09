/**
 * Story Model
 * نموذج الحالات والإعلانات - مناحل ريف وصاب
 */

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    text: {
        type: String,
        required: [true, 'نص التعليق مطلوب'],
        trim: true,
        maxlength: [500, 'التعليق لا يمكن أن يكون أطول من 500 حرف']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const StorySchema = new mongoose.Schema({
    // نوع المحتوى
    type: {
        type: String,
        enum: ['story', 'ad'],
        required: [true, 'نوع المحتوى مطلوب'],
        default: 'story'
    },
    
    // المحتوى
    media: {
        type: {
            type: String,
            enum: ['image', 'video'],
            required: [true, 'نوع الوسائط مطلوب']
        },
        url: {
            type: String,
            required: [true, 'رابط الوسائط مطلوب']
        },
        thumbnail: {
            type: String // للفيديو
        }
    },
    
    // النص/التعليق من المالك
    caption: {
        type: String,
        trim: true,
        maxlength: [1000, 'النص لا يمكن أن يكون أطول من 1000 حرف']
    },
    
    // الإعجابات
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // التعليقات
    comments: [CommentSchema],
    
    // الإحصائيات
    views: {
        type: Number,
        default: 0
    },
    
    // الحالة
    status: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    },
    
    // تاريخ انتهاء (للحالات)
    expiresAt: {
        type: Date,
        default: function() {
            // الحالات تنتهي بعد 24 ساعة
            if (this.type === 'story') {
                const date = new Date();
                date.setHours(date.getHours() + 24);
                return date;
            }
            return null;
        }
    },
    
    // تاريخ البدء (للإعلانات)
    startDate: {
        type: Date,
        default: Date.now
    },
    
    // تاريخ النهاية (للإعلانات)
    endDate: {
        type: Date
    },
    
    // الموقع (للإعلانات)
    position: {
        type: String,
        enum: ['banner', 'popup', 'sidebar', 'story'],
        default: 'story'
    },
    
    // رابط الإعلان (اختياري)
    link: {
        type: String,
        trim: true
    },
    
    // منشئ المحتوى
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
StorySchema.index({ type: 1, status: 1 });
StorySchema.index({ expiresAt: 1 });
StorySchema.index({ startDate: 1, endDate: 1 });
StorySchema.index({ createdAt: -1 });

// Virtual for likes count
StorySchema.virtual('likesCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Virtual for comments count
StorySchema.virtual('commentsCount').get(function() {
    return this.comments ? this.comments.length : 0;
});

// Virtual for isExpired
StorySchema.virtual('isExpired').get(function() {
    if (this.type === 'story' && this.expiresAt) {
        return new Date() > this.expiresAt;
    }
    if (this.type === 'ad' && this.endDate) {
        return new Date() > this.endDate;
    }
    return false;
});

// Pre-save middleware
StorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // تحديث الحالة بناءً على تاريخ الانتهاء
    if (this.isExpired) {
        this.status = 'expired';
    }
    
    next();
});

// Method to add like
StorySchema.methods.addLike = function(userId, customerId) {
    const existingLike = this.likes.find(like => 
        (like.user && like.user.toString() === userId?.toString()) ||
        (like.customer && like.customer.toString() === customerId?.toString())
    );
    
    if (!existingLike) {
        this.likes.push({
            user: userId,
            customer: customerId,
            createdAt: new Date()
        });
        return this.save();
    }
    return Promise.resolve(this);
};

// Method to remove like
StorySchema.methods.removeLike = function(userId, customerId) {
    this.likes = this.likes.filter(like => 
        !((like.user && like.user.toString() === userId?.toString()) ||
          (like.customer && like.customer.toString() === customerId?.toString()))
    );
    return this.save();
};

// Method to add comment
StorySchema.methods.addComment = function(userId, customerId, text) {
    this.comments.push({
        user: userId,
        customer: customerId,
        text: text,
        createdAt: new Date()
    });
    return this.save();
};

// Method to remove comment
StorySchema.methods.removeComment = function(commentId) {
    this.comments = this.comments.filter(comment => 
        comment._id.toString() !== commentId.toString()
    );
    return this.save();
};

// Method to increment views
StorySchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Static method to get active stories
StorySchema.statics.getActiveStories = function() {
    return this.find({
        type: 'story',
        status: 'active',
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
        ]
    })
    .populate('createdBy', 'username')
    .populate('likes.user', 'username')
    .populate('likes.customer', 'profile.firstName profile.lastName')
    .populate('comments.user', 'username')
    .populate('comments.customer', 'profile.firstName profile.lastName')
    .sort({ createdAt: -1 });
};

// Static method to get active ads
StorySchema.statics.getActiveAds = function(position = null) {
    const now = new Date();
    const query = {
        type: 'ad',
        status: 'active',
        startDate: { $lte: now },
        $or: [
            { endDate: { $gte: now } },
            { endDate: null }
        ]
    };
    
    if (position) {
        query.position = position;
    }
    
    return this.find(query)
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 });
};

const Story = mongoose.model('Story', StorySchema);

module.exports = Story;









