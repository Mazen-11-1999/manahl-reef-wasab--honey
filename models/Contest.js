/**
 * Contest Model
 * نموذج المسابقة - محدث لدعم أنواع المسابقات المتقدمة
 */

const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'اسم المسابقة مطلوب'],
        trim: true,
        maxlength: [200, 'اسم المسابقة لا يمكن أن يكون أطول من 200 حرف']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'الوصف لا يمكن أن يكون أطول من 2000 حرف']
    },
    // نوع المسابقة
    type: {
        type: String,
        enum: ['questions', 'purchase', 'multi-requirement', 'random'],
        default: 'random',
        required: true
    },
    // الجائزة (للتوافق مع الكود القديم)
    prize: {
        type: String,
        trim: true,
        maxlength: [500, 'وصف الجائزة لا يمكن أن يكون أطول من 500 حرف']
    },
    // تفاصيل الجائزة (للأنواع الجديدة)
    prizeDetails: {
        name: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        image: {
            type: String,
            trim: true
        },
        value: {
            type: String,
            trim: true
        }
    },
    // الأسئلة (لنوع questions و multi-requirement)
    questions: [{
        question: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['multiple-choice', 'text', 'true-false'],
            default: 'multiple-choice'
        },
        options: [{
            text: String,
            isCorrect: Boolean
        }],
        correctAnswer: {
            type: String,
            trim: true
        },
        points: {
            type: Number,
            default: 1
        }
    }],
    // الشروط (لنوع multi-requirement)
    requirements: {
        followSocial: {
            enabled: {
                type: Boolean,
                default: false
            },
            socialLinks: [{
                platform: {
                    type: String,
                    enum: ['facebook', 'tiktok', 'instagram', 'twitter', 'youtube', 'snapchat']
                },
                url: {
                    type: String,
                    trim: true
                },
                verificationCode: {
                    type: String,
                    trim: true
                }
            }]
        },
        shareWhatsApp: {
            enabled: {
                type: Boolean,
                default: false
            },
            requiredShares: {
                type: Number,
                default: 3
            },
            shareMessage: {
                type: String,
                trim: true
            }
        },
        answerQuestions: {
            enabled: {
                type: Boolean,
                default: false
            },
            minCorrectAnswers: {
                type: Number,
                default: 1
            }
        }
    },
    // المشاركون مع تفاصيل إضافية
    participants: [{
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        name: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        answers: [{
            questionId: mongoose.Schema.Types.ObjectId,
            answer: String,
            isCorrect: Boolean,
            points: Number
        }],
        totalPoints: {
            type: Number,
            default: 0
        },
        requirementsStatus: {
            followSocial: {
                verified: {
                    type: Boolean,
                    default: false
                },
                verifiedAt: Date,
                verificationProof: [{
                    platform: String,
                    screenshot: String,
                    verifiedAt: Date
                }]
            },
            shareWhatsApp: {
                verified: {
                    type: Boolean,
                    default: false
                },
                sharesCount: {
                    type: Number,
                    default: 0
                },
                sharesProof: [{
                    screenshot: String,
                    sharedAt: Date
                }]
            },
            answerQuestions: {
                verified: {
                    type: Boolean,
                    default: false
                },
                correctAnswers: {
                    type: Number,
                    default: 0
                }
            }
        },
        isEligible: {
            type: Boolean,
            default: false
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // المشاركون (للتوافق مع الكود القديم)
    oldParticipants: [{
        type: String,
        trim: true
    }],
    // الفائزون
    winners: [{
        participantId: {
            type: mongoose.Schema.Types.ObjectId
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        prize: {
            type: String,
            trim: true
        },
        prizeDetails: {
            name: String,
            description: String,
            image: String,
            value: String
        },
        date: {
            type: Date,
            default: Date.now
        },
        announced: {
            type: Boolean,
            default: false
        },
        announcementMessage: {
            type: String,
            trim: true
        }
    }],
    // عدد الفائزين في السحب (للسحب اليدوي أو التلقائي)
    winnersCount: {
        type: Number,
        default: 1,
        min: [1, 'الحد الأدنى لفائز واحد'],
        max: [50, 'الحد الأقصى 50 فائز']
    },
    startDate: {
        type: Date,
        required: [true, 'تاريخ البداية مطلوب']
    },
    endDate: {
        type: Date,
        required: [true, 'تاريخ النهاية مطلوب'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
        }
    },
    drawDate: {
        type: Date
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'completed', 'cancelled', 'drawing'],
        default: 'active' 
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
ContestSchema.index({ status: 1 });
ContestSchema.index({ startDate: 1 });
ContestSchema.index({ endDate: 1 });
ContestSchema.index({ type: 1 });
ContestSchema.index({ name: 'text', description: 'text' });

// Virtual for isActive
ContestSchema.virtual('isActive').get(function() {
    const now = new Date();
    return this.status === 'active' && 
           this.startDate <= now && 
           this.endDate >= now;
});

// Virtual for eligible participants count
ContestSchema.virtual('eligibleCount').get(function() {
    return this.participants.filter(p => p.isEligible).length;
});

// Pre-save middleware
ContestSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to add participant
ContestSchema.methods.addParticipant = function(participantData) {
    // التحقق من عدم وجود مشارك بنفس customerId أو phone
    const existingIndex = this.participants.findIndex(
        p => (p.customerId && p.customerId.toString() === participantData.customerId?.toString()) ||
            (p.phone === participantData.phone && participantData.phone)
    );
    
    if (existingIndex === -1) {
        this.participants.push({
            customerId: participantData.customerId,
            name: participantData.name,
            phone: participantData.phone,
            answers: participantData.answers || [],
            totalPoints: participantData.totalPoints || 0,
            requirementsStatus: participantData.requirementsStatus || {
                followSocial: { verified: false, verificationProof: [] },
                shareWhatsApp: { verified: false, sharesCount: 0, sharesProof: [] },
                answerQuestions: { verified: false, correctAnswers: 0 }
            },
            isEligible: participantData.isEligible || false,
            joinedAt: new Date()
        });
    } else {
        // تحديث المشارك الموجود
        const existing = this.participants[existingIndex];
        if (participantData.answers) {
            existing.answers = participantData.answers;
            existing.totalPoints = participantData.answers.reduce((sum, a) => sum + (a.points || 0), 0);
        }
        if (participantData.requirementsStatus) {
            existing.requirementsStatus = { ...existing.requirementsStatus, ...participantData.requirementsStatus };
        }
    }
    return this.save();
};

// Method to check if participant meets all requirements
ContestSchema.methods.checkParticipantEligibility = function(participantIndex) {
    const participant = this.participants[participantIndex];
    if (!participant) return false;

    let eligible = true;
    const reasons = [];

    // التحقق من متابعة الحسابات
    if (this.requirements.followSocial?.enabled) {
        const requiredPlatforms = this.requirements.followSocial.socialLinks.map(l => l.platform);
        const verifiedPlatforms = participant.requirementsStatus.followSocial?.verificationProof?.map(p => p.platform) || [];
        const allVerified = requiredPlatforms.every(platform => verifiedPlatforms.includes(platform));
        if (!allVerified) {
            eligible = false;
            reasons.push(`لم يتم متابعة جميع الحسابات المطلوبة`);
        }
    }

    // التحقق من المشاركة على واتساب
    if (this.requirements.shareWhatsApp?.enabled) {
        const sharesCount = participant.requirementsStatus.shareWhatsApp?.sharesCount || 0;
        if (sharesCount < this.requirements.shareWhatsApp.requiredShares) {
            eligible = false;
            reasons.push(`لم يتم مشاركة المسابقة مع ${this.requirements.shareWhatsApp.requiredShares} أشخاص (المشاركات الحالية: ${sharesCount})`);
        }
    }

    // التحقق من الإجابات الصحيحة
    if (this.requirements.answerQuestions?.enabled || this.type === 'questions') {
        const correctAnswers = participant.requirementsStatus.answerQuestions?.correctAnswers || 
                              participant.answers.filter(a => a.isCorrect).length;
        const minRequired = this.requirements.answerQuestions?.minCorrectAnswers || this.questions.length;
        if (correctAnswers < minRequired) {
            eligible = false;
            reasons.push(`لم يتم الإجابة على جميع الأسئلة بشكل صحيح (الإجابات الصحيحة: ${correctAnswers}/${minRequired})`);
        }
    }

    participant.isEligible = eligible;
    return { eligible, reasons };
};

// Method to add winner
ContestSchema.methods.addWinner = function(winnerData) {
    this.winners.push({
        participantId: winnerData.participantId,
        name: winnerData.name,
        phone: winnerData.phone,
        prize: winnerData.prize || this.prize,
        prizeDetails: winnerData.prizeDetails || this.prizeDetails,
        date: new Date(),
        announced: winnerData.announced || false,
        announcementMessage: winnerData.announcementMessage
    });
    return this.save();
};

// Method to draw random winner from eligible participants
ContestSchema.methods.drawWinner = function(count = 1) {
    const eligibleParticipants = this.participants.filter(p => p.isEligible);
    
    if (eligibleParticipants.length === 0) {
        throw new Error('لا يوجد مشاركون مؤهلون للسحب');
    }

    const winners = [];
    const selectedIndices = new Set();

    for (let i = 0; i < Math.min(count, eligibleParticipants.length); i++) {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
        } while (selectedIndices.has(randomIndex));
        
        selectedIndices.add(randomIndex);
        const participant = eligibleParticipants[randomIndex];
        
        winners.push({
            participantId: participant._id,
            name: participant.name,
            phone: participant.phone,
            prize: this.prize,
            prizeDetails: this.prizeDetails
        });
    }

    // إضافة الفائزين
    winners.forEach(winner => {
        this.addWinner(winner);
    });

    this.drawDate = new Date();
    this.status = 'completed';
    return this.save();
};

const Contest = mongoose.model('Contest', ContestSchema);

module.exports = Contest;
