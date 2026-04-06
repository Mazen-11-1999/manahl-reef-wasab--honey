/**
 * Story Model
 * نموذج الحالات والإعلانات - مناحل ريف وصاب
 */

const mongoose = require('mongoose');

const CommentLikeSchema = new mongoose.Schema(
    {
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
    },
    { _id: false }
);

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
    /** رد على تعليق رئيسي فقط (لا رد على رد) */
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    text: {
        type: String,
        required: [true, 'نص التعليق مطلوب'],
        trim: true,
        maxlength: [500, 'التعليق لا يمكن أن يكون أطول من 500 حرف']
    },
    likes: {
        type: [CommentLikeSchema],
        default: []
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

// Method to add comment (اختياري: رد على تعليق رئيسي)
StorySchema.methods.addComment = function(userId, customerId, text, parentCommentId) {
    const payload = {
        user: userId,
        customer: customerId,
        text: String(text).trim(),
        createdAt: new Date(),
        likes: []
    };

    if (parentCommentId) {
        const parent = this.comments.id(parentCommentId);
        if (!parent) {
            return Promise.reject(new Error('التعليق الأصل غير موجود'));
        }
        if (parent.parentComment) {
            return Promise.reject(new Error('يمكن الرد فقط على التعليق الرئيسي'));
        }
        payload.parentComment = parent._id;
    }

    this.comments.push(payload);
    return this.save();
};

/** تبديل إعجاب على تعليق */
StorySchema.methods.toggleCommentLike = function(commentId, userId, customerId) {
    const comment = this.comments.id(commentId);
    if (!comment) {
        return Promise.reject(new Error('التعليق غير موجود'));
    }
    if (!comment.likes) comment.likes = [];
    const uid = userId && userId.toString();
    const cid = customerId && customerId.toString();
    const idx = comment.likes.findIndex((l) => {
        if (uid && l.user && l.user.toString() === uid) return true;
        if (cid && l.customer && l.customer.toString() === cid) return true;
        return false;
    });
    if (idx >= 0) {
        comment.likes.splice(idx, 1);
    } else {
        comment.likes.push({
            user: userId,
            customer: customerId || undefined,
            createdAt: new Date()
        });
    }
    return this.save();
};

// Method to remove comment (يحذف الردود المرتبطة)
StorySchema.methods.removeComment = function(commentId) {
    const idStr = commentId.toString();
    const toRemove = new Set([idStr]);
    this.comments.forEach((c) => {
        if (c.parentComment && c.parentComment.toString() === idStr) {
            toRemove.add(c._id.toString());
        }
    });
    this.comments = this.comments.filter((c) => !toRemove.has(c._id.toString()));
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
    .populate('createdBy', 'username badgeType role')
    .populate('likes.user', 'username')
    .populate('likes.customer', 'profile.firstName profile.lastName')
    .populate({
        path: 'comments',
        populate: [
            { path: 'user', select: 'username badgeType role' },
            { path: 'customer', select: 'profile.firstName profile.lastName' },
            { path: 'likes.user', select: 'username' }
        ]
    })
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









