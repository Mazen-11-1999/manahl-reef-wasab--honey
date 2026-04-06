/**
 * AI Assistant Service - Ultimate Version with Real Conversation Patterns
 * خدمة المساعد الذكي "ريف" - نسخة شاملة مع احتمالات حقيقية للمحادثة
 */

const Product = require('../models/Product');
const logger = require('../utils/logger');

class AIAssistant {
    constructor() {
        this.name = 'مساعد مناحل ريف وصاب';
        this.greeting = 'مرحباً! أنا مساعد مناحل ريف وصاب، كيف يمكنني مساعدتك اليوم؟ 🍯';
        this.conversationState = new Map();
        this.gameState = new Map();
        
        // احتمالات حقيقية للمحادثة
        this.conversationPatterns = {
            // أنواع الألم والمشاكل الصحية
            painPatterns: [
                'صداع', 'ألم رأس', 'شقيقة', 'migraine', 'headache',
                'ألم ظهر', 'ظهر يؤلمني', 'back pain', 'آلام الظهر',
                'ألم مفاصل', 'مفاصل تؤلمني', 'joint pain', 'روماتيزم',
                'ألم معدة', 'معدة تؤلمني', 'stomach pain', 'آلام البطن',
                'ألم حلق', 'حلق يؤلمني', 'sore throat', 'التهاب حلق',
                'ألم أسنان', 'أسنان تؤلمني', 'toothache', 'آلام الأسنان'
            ],
            
            // مشاكل النوم والراحة
            sleepPatterns: [
                'أرق', 'صعوبة نوم', 'insomnia', 'can\'t sleep',
                'نوم خفيف', 'نوم غير عميق', 'light sleep',
                'استيقاظ كثير', 'أستيقظ ليلاً', 'wake up at night',
                'كوابيس', 'أحلام مزعجة', 'nightmares',
                'نعاس', 'نوم نهار', 'sleepy', 'daytime sleep'
            ],
            
            // مشاكل الهضم والمعدة
            digestionPatterns: [
                'غازات', 'انتفاخ', 'gas', 'bloating',
                'إمساك', 'صعوبة إخراج', 'constipation',
                'إسهال', 'مغص', 'diarrhea', 'stomach cramps',
                'حموضة', 'حرقة معدة', 'acidity', 'heartburn',
                'عسر هضم', 'صعوبة هضم', 'indigestion'
            ],
            
            // مشاكل الطاقة والحيوية
            energyPatterns: [
                'إرهاق', 'تعب', 'exhausted', 'tired', 'fatigue',
                'خمول', 'كسل', 'lethargic', 'lazy',
                'لا طاقة', 'ضعف', 'no energy', 'weak',
                'إجهاد', 'إعياء', 'burnout', 'worn out'
            ],
            
            // مشاكل الجلد والبشرة
            skinPatterns: [
                'حبوب', 'بثور', 'acne', 'pimples',
                'جفاف بشره', 'بشره جافه', 'dry skin',
                'حساسية جلد', 'طفح جلدي', 'skin allergy', 'rash',
                'بشرة دهنية', 'بشرة مشاكل', 'oily skin', 'skin problems'
            ],
            
            // مشاكل التنفس والصدر
            breathingPatterns: [
                'سعال', 'كحة', 'cough', 'persistent cough',
                'ضيق نفس', 'صعوبة تنفس', 'shortness of breath',
                'ربو', 'حساسية صدر', 'asthma', 'chest allergy',
                'زكام', 'رشح', 'cold', 'runny nose',
                'احتقان', 'انسداد أنف', 'congestion', 'stuffy nose'
            ],
            
            // مشاكل نفسية وعقلية
            mentalPatterns: [
                'توتر', 'قلق', 'stress', 'anxiety',
                'ضغط نفسي', 'عصبية', 'nervous', 'tension',
                'اكتئاب', 'حزن', 'depression', 'sadness',
                'ذاكرة ضعيفة', 'نسيان', 'memory problems', 'forgetfulness',
                'صعوبة تركيز', 'عدم تركيز', 'focus problems', 'concentration issues'
            ],
            
            // مشاكل خاصة بالنساء
            womenPatterns: [
                'دورة شهرية', 'طمث', 'menstrual', 'period',
                'آلام الدورة', 'تقلصات', 'period pain', 'cramps',
                'حمل', 'pregnancy', 'حامل',
                'رضاعة', 'رضاعة طبيعية', 'breastfeeding'
            ],
            
            // مشاكل الأطفال
            childrenPatterns: [
                'طفل مريض', 'أبناء مرضى', 'sick child',
                'نمو بطيء', 'تأخر نمو', 'slow growth',
                'ضعف مناعة', 'مناعة طفل', 'weak immunity',
                'مشاكل تغذية', 'أكل سيء', 'feeding problems'
            ],
            
            // مشاكل مزمنة
            chronicPatterns: [
                'سكري', 'سكر مرتفع', 'diabetes', 'high sugar',
                'ضغط دم', 'ضغط مرتفع', 'blood pressure', 'high blood pressure',
                'كوليسترول', 'دهون', 'cholesterol', 'fats',
                'قلب', 'مشاكل قلب', 'heart problems',
                'كلى', 'مشاكل كلى', 'kidney problems'
            ]
        };
        
        // احتمالات الألعاب والترفيه
        this.gamePatterns = [
            'لعبة', 'لعب', 'game', 'play',
            'اختبار', 'quiz', 'test',
            'تحدي', 'challenge', 'مسابقة', 'competition',
            'جمع', 'collect', 'جامع',
            'تسلية', 'ترفيه', 'fun', 'entertainment',
            'مسلية', 'ممتعة', 'interesting', 'amusing'
        ];
        
        // احتمالات الأسئلة والاستفسارات
        this.questionPatterns = [
            'ما هو', 'what is', 'ماذا',
            'كيف', 'how', 'هل',
            'لماذا', 'why', 'متى',
            'أين', 'where', 'كم',
            'من', 'who', 'أي'
        ];
        
        // احتمالات الشكر والوداع
        this.socialPatterns = [
            'شكرا', 'مشكور', 'thanks', 'thank you',
            'مع السلامة', 'وداعا', 'goodbye', 'bye',
            'أهلا', 'مرحبا', 'hello', 'hi',
            'صباح الخير', 'مساء الخير', 'good morning', 'good evening'
        ];
    }

    /**
     * تحليل نص المستخدم وتقديم توصية ذكية
     */
    async analyzeUserMessage(message, userId = null) {
        try {
            const lowerMessage = message.toLowerCase();
            
            // حفظ المحادثة للمستخدم
            if (userId) {
                this.updateConversationState(userId, message);
            }

            const chipReply = this.matchSuggestionChip(message);
            if (chipReply) {
                return chipReply;
            }

            if (this.isKnowMeQuestion(lowerMessage)) {
                return this.getKnowMeResponse();
            }

            if (this.isHoneyBenefitsForAllConditionsRequest(lowerMessage)) {
                return {
                    success: true,
                    message: this.getHoneyBenefitsOverviewMessage(),
                    suggestions: [
                        'عندي سعال جاف',
                        'إرهاق وضعف',
                        'مشاكل في الهضم',
                        'صف حالتك لأقترح منتجاً من المتجر'
                    ]
                };
            }

            if (userId) {
                const gs = this.gameState.get(userId);
                if (gs && gs.currentGame === 'quiz' && this.shouldExitQuizForChat(message)) {
                    this.gameState.delete(userId);
                } else {
                    const gs2 = this.gameState.get(userId);
                    if (gs2 && gs2.currentGame) {
                        const low = String(message).toLowerCase();
                        if (gs2.currentGame === 'quiz' && (low === 'اختبار' || low === 'quiz' || low === 'اختبار جديد')) {
                            return this.startQuizGame(userId);
                        }
                        return this.continueGame(message, userId);
                    }
                }
            }
            
            // التحقق من نوع الاستفسار
            const inquiryType = this.detectInquiryType(lowerMessage);
            
            if (inquiryType === 'greeting') {
                return this.getGreetingResponse();
            }
            
            if (inquiryType === 'game') {
                return this.handleGameRequest(message, userId);
            }
            
            if (inquiryType === 'product_info') {
                return this.getProductInfoResponse(lowerMessage);
            }
            
            if (inquiryType === 'general') {
                return this.getGeneralResponse(message);
            }

            if (inquiryType === 'question') {
                return this.getQuestionResponse(lowerMessage, message);
            }
            
            // التحقق من الاستفسارات المتقدمة
            const advancedInquiry = this.detectAdvancedInquiry(lowerMessage);
            if (advancedInquiry) {
                return this.getAdvancedResponse(advancedInquiry, message, userId);
            }
            
            // تحليل الأعراض والحالات
            const symptoms = this.extractSymptoms(lowerMessage);
            
            if (symptoms.length === 0) {
                return this.askForClarification();
            }

            // البحث عن منتجات مناسبة
            const recommendations = await this.findProductRecommendations(symptoms);
            
            return this.formatSmartResponse(symptoms, recommendations, userId);
            
        } catch (error) {
            logger.error('Error in AI Assistant:', error);
            return {
                success: false,
                message: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.',
                suggestions: ['هل يمكنك توضيح حالتك أكثر؟', 'يمكنك التواصل معنا مباشرة للمساعدة']
            };
        }
    }

    /** إزالة أي شكل من أشكال الأكواد أو المقتطفات البرمجية من النص المعروض للمستخدم */
    stripTechnicalContent(s) {
        if (s == null || typeof s !== 'string') return s;
        let t = s;
        t = t.replace(/```[\w-]*\n?[\s\S]*?```/g, ' ');
        t = t.replace(/`([^`\n]+)`/g, '$1');
        t = t.replace(/\n{3,}/g, '\n\n');
        return t.trim();
    }

    /** تنظيف عميق لكل السلاسل في استجابة الـ API (رسائل، اقتراحات، نصائح، أسماء منتجات إن لزم) */
    sanitizeResponse(data) {
        if (data == null) return data;
        if (typeof data === 'string') return this.stripTechnicalContent(data);
        if (Array.isArray(data)) {
            return data.map((item) => this.sanitizeResponse(item));
        }
        if (typeof data !== 'object') return data;
        const out = {};
        for (const [k, v] of Object.entries(data)) {
            out[k] = this.sanitizeResponse(v);
        }
        return out;
    }

    isKnowMeQuestion(lowerMessage) {
        const t = String(lowerMessage || '')
            .replace(/\s+/g, ' ')
            .trim();
        if (t.length > 80) return false;
        if (
            /هل\s*تعرف(ني|يني)|هل\s*تعرفيني|^تعرفني$|^بتعرفني$|تعرف\s+عليّ|do you know me/i.test(
                t
            )
        ) {
            return true;
        }
        if ((t.includes('تعرفني') || t.includes('تعرفيني')) && t.length < 50) return true;
        return false;
    }

    getKnowMeResponse() {
        return {
            success: true,
            message:
                'نعم — أنت ضيفنا العزيز في **مناحل ريف وصاب** 🍯\n\n' +
                'نسعد بوجودك معنا، ونتمنى أن تستمتع بعسلنا الطبيعي. تفضّل بزيارة المتجر واختيار ما يناسبك وذوقك.\n\n' +
                '✨ **هل تعلم؟** يمكنك أن تصبح **عضواً مميزاً** لدينا: عروض ومزايا خاصة للأعضاء. اسأل فريقنا عن التفاصيل، أو راجع صفحات العضوية والمتجر عند توفرها.',
            suggestions: [
                'أريد توصية عسل لحالتي',
                'ما مزايا العضوية المميزة؟',
                'عرض منتجات العسل',
                'لعب لعبة'
            ]
        };
    }

    /**
     * كشف نوع الاستفسار المتقدم
     */
    detectAdvancedInquiry(message) {
        // التحقق من أنواع الألم والمشاكل الصحية
        for (const pattern of this.conversationPatterns.painPatterns) {
            if (message.includes(pattern)) {
                return 'pain';
            }
        }
        
        // التحقق من مشاكل النوم
        for (const pattern of this.conversationPatterns.sleepPatterns) {
            if (message.includes(pattern)) {
                return 'sleep';
            }
        }
        
        // التحقق من مشاكل الهضم
        for (const pattern of this.conversationPatterns.digestionPatterns) {
            if (message.includes(pattern)) {
                return 'digestion';
            }
        }
        
        // التحقق من مشاكل الطاقة
        for (const pattern of this.conversationPatterns.energyPatterns) {
            if (message.includes(pattern)) {
                return 'energy';
            }
        }
        
        // التحقق من مشاكل الجلد
        for (const pattern of this.conversationPatterns.skinPatterns) {
            if (message.includes(pattern)) {
                return 'skin';
            }
        }
        
        // التحقق من مشاكل التنفس
        for (const pattern of this.conversationPatterns.breathingPatterns) {
            if (message.includes(pattern)) {
                return 'breathing';
            }
        }
        
        // التحقق من مشاكل نفسية
        for (const pattern of this.conversationPatterns.mentalPatterns) {
            if (message.includes(pattern)) {
                return 'mental';
            }
        }
        
        // التحقق من مشاكل النساء
        for (const pattern of this.conversationPatterns.womenPatterns) {
            if (message.includes(pattern)) {
                return 'women';
            }
        }
        
        // التحقق من مشاكل الأطفال
        for (const pattern of this.conversationPatterns.childrenPatterns) {
            if (message.includes(pattern)) {
                return 'children';
            }
        }
        
        // التحقق من مشاكل مزمنة
        for (const pattern of this.conversationPatterns.chronicPatterns) {
            if (message.includes(pattern)) {
                return 'chronic';
            }
        }
        
        return null;
    }
    
    /**
     * الحصول على رد متقدم
     */
    getAdvancedResponse(inquiryType, message, userId) {
        const responses = {
            'pain': {
                message: 'أفهم أنك تعاني من ألم. هل يمكنك توضيح نوع الألم ومكانه بالضبط؟\n\n💡 **معلومات مهمة:**\n- هل الألم حاد أم خفيف؟\n- هل الألم مستمر أم متقطع؟\n- هل هناك شيء يزيد الألم؟\n\n🍯 **العسل يمكن أن يساعد في:**\n- تخفيف الالتهابات\n- تقوية المناعة\n- تحسين الصحة العامة',
                suggestions: ['ألم في الرأس', 'ألم في الظهر', 'ألم في المعدة', 'ألم في المفاصل']
            },
            'sleep': {
                message: 'مشاكل النوم شائعة جداً! هل يمكنني معرفة نوع المشكلة بالضبط؟\n\n💡 **أسئلة مهمة:**\n- هل تواجه صعوبة في النوم أم في الاستمرار بالنوم؟\n- هل تستيقظ كثيراً ليلاً؟\n- هل تشعر بالقلق أو التوتر قبل النوم؟\n\n🍯 **العسل يساعد في:**\n- الاسترخاء والهدوء\n- تحسين جودة النوم\n- تقليل التوتر',
                suggestions: ['صعوبة في النوم', 'استيقاظ ليلاً', 'أرق', 'نعاس نهار']
            },
            'digestion': {
                message: 'مشاكل الهضم تؤثر على الحياة اليومية! ما نوع المشكلة التي تواجهها؟\n\n💡 **معلومات مهمة:**\n- هل تعاني من غازات أو انتفاخ؟\n- هل لديك إمساك أو إسهال؟\n- هل تشعر بحرقة في المعدة؟\n\n🍯 **العسل مفيد ل:**\n- تحسين عملية الهضم\n- معالجة مشاكل المعدة\n- توازن البكتيريا النافعة',
                suggestions: ['غازات وانتفاخ', 'إمساك', 'حموضة', 'عسر هضم']
            },
            'energy': {
                message: 'الإرهاق وضعف الطاقة من أكثر الشكايات شيوعاً! ما نوع التعب الذي تشعر به؟\n\n💡 **أسئلة مهمة:**\n- هل التعب من الشغل أم من مشكلة صحية؟\n- هل تشعر بالتعب طوال اليوم أم في أوقات معينة؟\n- هل لديك مشاكل في النوم؟\n\n🍯 **العسل يزيد من:**\n- الطاقة والحيوية\n- قوة الجسم\n- النشاط الذهني',
                suggestions: ['إرهاق شديد', 'ضعف عام', 'خمول', 'لا طاقة']
            },
            'skin': {
                message: 'مشاكل البشرة تؤثر على الثقة بالنفس! ما نوع المشكلة التي تواجهها؟\n\n💡 **معلومات مهمة:**\n- هل البشرة دهنية أم جافة؟\n- هل لديك حبوب أو بثور؟\n- هل هناك حساسية أو احمرار؟\n\n🍯 **العسل يساعد في:**\n- علاج حبوب الشباب\n- ترطيب البشرة\n- مكافحة البكتيريا',
                suggestions: ['حبوب وبثور', 'بشرة جافة', 'حساسية جلدية', 'بشرة دهنية']
            },
            'breathing': {
                message: 'مشاكل التنفس تحتاج اهتماماً فورياً! ما هي الأعراض التي تواجهها؟\n\n💡 **معلومات مهمة:**\n- هل لديك سعال جاف أم مع بلغم؟\n- هل تشعر بضيق في التنفس؟\n- هل لديك حساسية أو ربو؟\n\n🍯 **العسل مفيد ل:**\n- علاج السعال والتهاب الحلق\n- تقوية الجهاز التنفسي\n- تخفيف الحساسية',
                suggestions: ['سعال جاف', 'ضيق نفس', 'حساسية', 'زكام ورشح']
            },
            'mental': {
                message: 'الصحة النفسية مهمة جداً! ما نوع الضغط أو التوتر الذي تشعر به؟\n\n💡 **أسئلة مهمة:**\n- هل التوتر من الشغل أم الحياة الشخصية؟\n- هل تشعر بالقلق المستمر؟\n- هل لديك صعوبة في التركيز؟\n\n🍯 **العسل يساعد في:**\n- تهدئة الأعصاب\n- تحسين المزاج\n- زيادة التركيز والذاكرة',
                suggestions: ['توتر وقلق', 'ضغط نفسي', 'صعوبة تركيز', 'ذاكرة ضعيفة']
            },
            'women': {
                message: 'أفهم أنك بحاجة لمساعدة خاصة! ما نوع المشكلة التي تواجهها؟\n\n💡 **معلومات مهمة:**\n- هل المشكلة متعلقة بالدورة الشهرية؟\n- هل أنتِ حامل أو مرضع؟\n- هل هناك مشاكل هرمونية؟\n\n🍯 **العسل مفيد ل:**\n- تخفيف آلام الدورة الشهرية\n- زيادة الطاقة أثناء الحمل\n- تحسين الصحة العامة',
                suggestions: ['آلام الدورة', 'فترة حمل', 'رضاعة طبيعية', 'مشاكل هرمونية']
            },
            'children': {
                message: 'صحة الأطفال هي الأولوية! ما نوع المشكلة التي يعاني منها طفلك؟\n\n💡 **معلومات مهمة:**\n- كم عمر الطفل؟\n- هل لديه مشاكل في الأكل؟\n- هل يمرض كثيراً؟\n\n🍯 **العسل مفيد للأطفال في:**\n- تقوية المناعة\n- تحسين النمو\n- علاج السعال والبرد',
                suggestions: ['طفل مريض', 'ضعف مناعة', 'نمو بطيء', 'مشاكل تغذية']
            },
            'chronic': {
                message: 'المشاكل المزمنة تحتاج عناية خاصة! ما نوع المشكلة المزمنة التي تعاني منها؟\n\n💡 معلومات مهمة:\n- هل تتناول أدوية حالياً؟\n- هل المشكلة خاضعة للسيطرة؟\n- هل استشرت الطبيب مؤخراً؟\n\n🍯 العسل قد يكون دعماً غذائياً عاماً عند الاعتدال — وليس بديلاً عن العلاج.\n\n⚠️ مهم: استشر طبيبك قبل أي تغيير على نظامك أو أدويتك.',
                suggestions: ['سكري', 'ضغط دم', 'كوليسترول', 'مشاكل قلب']
            }
        };

        const base = responses[inquiryType];
        if (!base) {
            return this.getGeneralResponse(message);
        }

        const tips = this.getTipsForAdvancedCategory(inquiryType);
        const cleanMsg = String(base.message).replace(/\*\*/g, '');

        return {
            success: true,
            message:
                cleanMsg +
                (tips.length ? '\n\n📌 ستجد أسفل المحادثة نصائح عامة تعليمية قد تفيدك.' : ''),
            suggestions: base.suggestions,
            healthTips: tips
        };
    }

    /**
     * التعامل مع طلبات الألعاب
     */
    handleGameRequest(message, userId) {
        const gameState = this.gameState.get(userId) || { currentGame: null, score: 0 };
        
        if (message.includes('اختبار') || message.includes('quiz')) {
            return this.startQuizGame(userId);
        }
        
        if (message.includes('تحدي') || message.includes('challenge')) {
            return this.startChallengeGame(userId);
        }
        
        if (message.includes('جمع') || message.includes('collect')) {
            return this.startHoneyCollectorGame(userId);
        }
        
        if (gameState.currentGame) {
            return this.continueGame(message, userId);
        }
        
        return this.getGameMenu();
    }

    /**
     * قائمة الألعاب
     */
    getGameMenu() {
        return {
            success: true,
            message: '🎮 مرحباً في عالم الألعاب! اختر اللعبة التي تريدها:',
            gameMenu: true,
            games: [
                {
                    name: 'اختبار العسل',
                    description: 'اختبر معرفتك بأنواع العسل وفوائده',
                    icon: '🧠',
                    command: 'اختبار'
                },
                {
                    name: 'تحدي الأسبوع',
                    description: 'تحدي يومي مع أسئلة متنوعة',
                    icon: '🏆',
                    command: 'تحدي'
                },
                {
                    name: 'جامع العسل',
                    description: 'اجمع أنواع العسل الصحيحة',
                    icon: '🍯',
                    command: 'جمع'
                }
            ],
            suggestions: ['اختبار', 'تحدي', 'جمع', 'العودة للمساعدة']
        };
    }

    /** بذرة عشوائية قابلة للتكرار (لخلط مختلف لكل مستخدم/جلسة) */
    mulberry32(seed) {
        let a = seed >>> 0;
        return function next() {
            let t = (a += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    hashString(s) {
        let h = 2166136261;
        const str = String(s);
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    shuffleArray(arr, rng) {
        const a = arr.slice();
        const rand = typeof rng === 'function' ? rng : Math.random;
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            const t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }

    /**
     * يعيد نسخة من السؤال بترتيب خيارات عشوائي ومؤشر الإجابة الصحيحة محدّث
     */
    shuffleQuestionOptions(raw, rng) {
        const n = raw.options.length;
        const order = this.shuffleArray(
            Array.from({ length: n }, (_, i) => i),
            rng
        );
        const newOptions = order.map((i) => raw.options[i]);
        const newCorrect = order.indexOf(raw.correct);
        return {
            question: raw.question,
            options: newOptions,
            correct: newCorrect,
            explanation: raw.explanation
        };
    }

    /**
     * بنك أسئلة الاختبار — تُخلط ترتيب الأسئلة والخيارات في كل جلسة/إعادة
     */
    getQuizQuestions() {
        return [
            {
                question: 'أي نوع من العسل أفضل لعلاج السعال؟',
                options: ['عسل السدر', 'عسل السمر', 'عسل الزهور'],
                correct: 1,
                explanation: 'عسل السمر مفيد جداً للسعال ومشاكل الصدر'
            },
            {
                question: 'ما هو العسل الذي يزيد الطاقة ويعالج الأنيميا؟',
                options: ['عسل الزهور', 'عسل السدر', 'عسل الحبة السوداء'],
                correct: 1,
                explanation: 'عسل السدر غني بالحديد ويزيد الطاقة'
            },
            {
                question: 'أي عسل يساعد على تحسين الهضم؟',
                options: ['عسل السمر', 'عسل الزهور', 'عسل السدر'],
                correct: 1,
                explanation: 'عسل الزهور ممتاز للهضم وصحة المعدة'
            },
            {
                question: 'أي عسل يُذكر غالباً لدعم المناعة والحيوية العامة؟',
                options: ['عسل السمر فقط', 'عسل السدر', 'عسل صناعي'],
                correct: 1,
                explanation: 'عسل السدر شائع كخيار غني ومذكور في السياقات التقليدية للتغذية العامة.'
            },
            {
                question: 'للاسترخاء وتهدئة الحلق مع مشروب دافئ، ما الخيار الأنسب غالباً؟',
                options: ['عسل بارد مباشرة من الثلاجة', 'عسل طبيعي معتدل مع ماء دافئ', 'تجنب العسل تماماً'],
                correct: 1,
                explanation: 'العسل الطبيعي مع سوائل دافئة يُستخدم تقليدياً لراحة الحلق — باعتدال.'
            },
            {
                question: 'كم يُنصح عادة بتخزين العسل الطبيعي في المنزل؟',
                options: ['في مكان رطب وساخن', 'في مكان جاف وبارد بعيداً عن الشمس المباشرة', 'في الفريزر فقط'],
                correct: 1,
                explanation: 'البرودة المعتدلة والجفاف يحافظان على جودة العسل أطول فترة.'
            },
            {
                question: 'ما الذي يميّز العسل الطبيعي غالباً عن المغشوش؟',
                options: ['رائحة كيميائية قوية جداً دائماً', 'تنوع بسيط في الذوق واللزوجة حسب النبات والمنطقة', 'لون واحد مطابق لكل الدفعات دائماً'],
                correct: 1,
                explanation: 'العسل الطبيعي يختلف قليلاً بين المواسم والمناطق، بعكس المنتج الموحّد تماماً.'
            },
            {
                question: 'متى يُفضّل استشارة مختص قبل الاعتماد على العسل كمساعد غذائي؟',
                options: ['فقط عند السفر', 'عند الحمل أو الرضاعة أو مرض السكري أو حساسية معروفة', 'لا حاجة أبداً'],
                correct: 1,
                explanation: 'بعض الحالات تحتاج مراجعة مهنية قبل زيادة السكريات أو المنتجات الطبيعية.'
            },
            {
                question: 'ما فائدة العسل مع الليمون الدافئ غالباً في الأعراض الخفيفة للحلق؟',
                options: ['يزيد الجفاف دائماً', 'قد يساعد على الراحة الموضعية مع السوائل — باعتدال', 'يستبدل الدواء دائماً'],
                correct: 1,
                explanation: 'المشروبات الدافئة المعتدلة تُستخدم تقليدياً للراحة — وليست بديلاً عن العلاج عند الحاجة.'
            },
            {
                question: 'أي عبارة تصف أفضل طريقة لاستخدام العسل مع الشاي؟',
                options: ['إضافته للماء المغلي مباشرة فور الغليان', 'إضافته بعد تبريد المشروب قليلاً حتى لا تُفقد بعض الخصائص', 'يُمنع مع أي مشروب ساخن'],
                correct: 1,
                explanation: 'الحرارة الشديدة جداً قد تؤثر على بعض مكونات العسل؛ التبريد الخفيف أفضل غالباً.'
            },
            {
                question: 'ما دور العسل في وصفات الطاقة التقليدية غالباً؟',
                options: ['مصدر سكريات سريعة مع مذاق طبيعي — باعتدال', 'بديل بروتين كامل', 'خالي من السعرات'],
                correct: 0,
                explanation: 'العسل يمدّ بالطاقة السريعة ويُستخدم بحصص معتدلة ضمن نظام متوازن.'
            }
        ];
    }

    /**
     * السؤال التالي: ترتيب مختلف في كل جولة، وبذرة تختلف بمستخدم الجلسة وعدد الإجابات
     */
    drawNextQuizQuestion(userId, previousQ) {
        const state = this.gameState.get(userId);
        const pool = this.getQuizQuestions();
        const uidKey = userId != null ? userId : 'anon';

        if (!state.quizDeck || !state.quizDeck.length) {
            const quizSalt = (this.hashString(String(uidKey)) ^ (Date.now() >>> 0)) >>> 0;
            state.quizSalt = quizSalt;
            state.quizDeck = this.shuffleArray([...pool], this.mulberry32(quizSalt));
            const cur = state.currentQuestion;
            if (cur && cur.question) {
                const idx = state.quizDeck.findIndex((r) => r.question === cur.question);
                state.quizDeckPos = idx >= 0 ? idx : 0;
            } else {
                state.quizDeckPos = 0;
            }
        }

        let deck = state.quizDeck;
        const len = deck.length;

        let pos = state.quizDeckPos + 1;
        if (pos >= len) {
            pos = 0;
            const wrapSeed =
                (state.quizSalt ^
                    (state.questionsAnswered * 31) ^
                    (Date.now() & 0xffffff) ^
                    this.hashString(String(uidKey) + '-round')) >>>
                0;
            deck = this.shuffleArray([...pool], this.mulberry32(wrapSeed));
            state.quizDeck = deck;
        }
        state.quizDeckPos = pos;

        let raw = deck[pos];
        let guard = 0;
        while (len > 1 && raw.question === previousQ.question && guard < len) {
            pos = (pos + 1) % len;
            if (pos === 0) {
                const wrapSeed =
                    (state.quizSalt ^ state.questionsAnswered ^ 0x9e3779b9) >>> 0;
                deck = this.shuffleArray([...pool], this.mulberry32(wrapSeed));
                state.quizDeck = deck;
            }
            state.quizDeckPos = pos;
            raw = deck[pos];
            guard += 1;
        }

        const optSeed =
            (state.quizSalt ^ pos ^ state.questionsAnswered * 7919 ^ this.hashString(String(uidKey))) >>> 0;
        const out = this.shuffleQuestionOptions(raw, this.mulberry32(optSeed));
        this.gameState.set(userId, state);
        return out;
    }

    /**
     * تشجيع مخصص حسب الأداء والخيار
     */
    buildQuizEncouragement(isCorrect, streak, chosenLabel, q, choiceIdx) {
        const rightLabel = q.options[q.correct];
        if (isCorrect) {
            if (streak >= 5) {
                return `🏆 أسطورة العسل! ${streak} إجابات صحيحة متتالية — أنت تتقن الموضوع فعلاً!`;
            }
            if (streak >= 3) {
                return `⭐ ممتاز جداً! سلسلة ${streak} إجابات صحيحة — واصل!`;
            }
            if (streak === 2) {
                return `🔥 أحسنت! إجابتان صحيحتان على التوالي — ذكاء وتركيز!`;
            }
            return `✅ أحسنت! اختيارك «${chosenLabel}» صحيح — أحسنت التمييز بين أنواع العسل.`;
        }
        if (choiceIdx < 0) {
            return '💡 لم أتعرّف على إجابة واضحة. جرّب كتابة 1 أو 2 أو 3، أو انسخ اسم الخيار.';
        }
        return `💪 لا بأس — التعلم يأتي بالمحاولة! اخترت «${chosenLabel}» بينما الإجابة الأدق لهذا السؤال غالباً «${rightLabel}». في المرة القادمة ستكون أقرب!`;
    }

    /**
     * بدء لعبة الاختبار
     */
    startQuizGame(userId) {
        const uidKey = userId != null ? userId : 'anon';
        const quizSalt = (this.hashString(String(uidKey)) ^ (Date.now() >>> 0)) >>> 0;
        const deck = this.shuffleArray([...this.getQuizQuestions()], this.mulberry32(quizSalt));
        const optSeed = (quizSalt ^ 0xa5a5a5a5) >>> 0;
        const randomQuestion = this.shuffleQuestionOptions(deck[0], this.mulberry32(optSeed));

        this.gameState.set(userId, {
            currentGame: 'quiz',
            currentQuestion: randomQuestion,
            quizDeck: deck,
            quizDeckPos: 0,
            quizSalt,
            score: 0,
            streak: 0,
            correctCount: 0,
            wrongCount: 0,
            questionsAnswered: 0,
            mode: 'quiz'
        });

        return {
            success: true,
            message: 'اختبار العسل',
            gameType: 'quiz',
            question: randomQuestion.question,
            options: randomQuestion.options,
            suggestions: randomQuestion.options,
            gameStats: { score: 0, streak: 0, correctCount: 0, label: 'بداية اللعب' }
        };
    }

    /**
     * متابعة لعبة الاختبار (اختيار إجابة)
     */
    continueGame(message, userId) {
        const state = this.gameState.get(userId);
        if (!state || !state.currentGame) {
            return this.getGameMenu();
        }
        if (state.currentGame === 'quiz' || state.currentGame === 'challenge' || state.currentGame === 'collector') {
            return this.continueQuizGame(message, userId);
        }
        this.gameState.delete(userId);
        return this.getGameMenu();
    }

    /**
     * الخروج من الاختبار عندما يصف المستخدم أعراضاً بدل الإجابة
     */
    shouldExitQuizForChat(message) {
        const t = String(message).trim();
        if (t.length < 8) return false;
        if (/^[123١٢٣]\s*$/.test(t)) return false;
        if (/عندي|لدي|أعاني|ألم |سعال|هضم|تعب|إرهاق|لا أنام|منذ |يومين|أسبوع|شهور|صف حالتي|توصية منتج/.test(t)) {
            return true;
        }
        if (t.length > 55) return true;
        return false;
    }

    continueQuizGame(message, userId) {
        let state = this.gameState.get(userId);
        const q = state && state.currentQuestion;
        if (!q || !Array.isArray(q.options)) {
            this.gameState.delete(userId);
            return this.startQuizGame(userId);
        }

        const trimmed = String(message).trim();
        let choice = -1;
        const first = trimmed.charAt(0);
        if (first === '1' || first === '١') choice = 0;
        else if (first === '2' || first === '٢') choice = 1;
        else if (first === '3' || first === '٣') choice = 2;

        if (choice < 0) {
            for (let i = 0; i < q.options.length; i++) {
                if (trimmed.includes(q.options[i]) || q.options[i].includes(trimmed)) {
                    choice = i;
                    break;
                }
            }
        }

        const correctIdx = q.correct;
        const isCorrect = choice >= 0 && choice === correctIdx;
        const chosenLabel = choice >= 0 ? q.options[choice] : '';
        const explain = q.explanation || '';

        state.streak = state.streak || 0;
        state.score = state.score || 0;
        state.correctCount = state.correctCount || 0;
        state.wrongCount = state.wrongCount || 0;
        state.questionsAnswered = (state.questionsAnswered || 0) + 1;

        const nextQ = this.drawNextQuizQuestion(userId, q);

        if (isCorrect) {
            state.streak += 1;
            const bonus = Math.min(state.streak - 1, 6) * 5;
            const points = 10 + bonus;
            state.score += points;
            state.correctCount += 1;
            state.currentQuestion = nextQ;
            this.gameState.set(userId, state);

            const enc = this.buildQuizEncouragement(true, state.streak, chosenLabel, q, choice);
            const celebrate = state.streak >= 2 || state.score >= 25;
            const modeNote = state.mode === 'challenge' ? '\n\n🏆 وضع التحدي: كل إجابة صحيحة تقربك من لقب «خبير العسل»!' : '';

            return {
                success: true,
                message:
                    `${enc}${modeNote}\n\n+${points} نقطة — المجموع: **${state.score}** — سلسلة نجاح: **${state.streak}** 🔥\n\n📚 تذكير: ${explain}\n\n⬇️ سؤال جديد`,
                gameType: 'quiz',
                question: nextQ.question,
                options: nextQ.options,
                suggestions: nextQ.options.concat(['عندي سؤال عن حالتي', 'توقف عن الاختبار']),
                gameStats: {
                    score: state.score,
                    streak: state.streak,
                    correctCount: state.correctCount,
                    lastResult: 'correct',
                    label: `+${points} نقطة`
                },
                celebrate
            };
        }

        state.streak = 0;
        state.wrongCount += 1;
        state.currentQuestion = nextQ;
        this.gameState.set(userId, state);

        const enc = this.buildQuizEncouragement(false, 0, chosenLabel || 'غير واضح', q, choice);
        const gentle = state.wrongCount >= 2;

        return {
            success: true,
            message:
                `${enc}\n\n📚 ${explain}\n\nالمجموع ما زال: **${state.score}** نقطة — لا تيأس، السؤال التالي فرصة جديدة!\n\n⬇️ سؤال جديد`,
            gameType: 'quiz',
            question: nextQ.question,
            options: nextQ.options,
            suggestions: nextQ.options.concat(['مساعدتي في اختيار عسل', 'لعبة']),
            gameStats: {
                score: state.score,
                streak: 0,
                wrongCount: state.wrongCount,
                lastResult: 'wrong',
                label: 'حاول مجدداً'
            },
            celebrate: false,
            gentleEncourage: gentle
        };
    }

    startChallengeGame(userId) {
        const base = this.startQuizGame(userId);
        const st = this.gameState.get(userId);
        if (st) {
            st.mode = 'challenge';
            st.streak = 0;
            this.gameState.set(userId, st);
        }
        base.message = '🏆 **تحدي سريع!** جاوب بأسرع ما يمكن — النقاط والسلسلة تُحسب!\n\n' + base.message;
        if (base.gameStats) base.gameStats.label = 'تحدي';
        return base;
    }

    startHoneyCollectorGame(userId) {
        const base = this.startQuizGame(userId);
        const st = this.gameState.get(userId);
        if (st) {
            st.mode = 'collector';
            this.gameState.set(userId, st);
        }
        base.message = '🍯 **جامع العسل:** نفس أسئلة الاختبار مع تتبع نقاطك — اجمع أكبر عدد من الإجابات الصحيحة!\n\n' + base.message;
        if (base.gameStats) base.gameStats.label = 'جامع العسل';
        return base;
    }

    /**
     * أزرار الإرشاد السريعة من واجهة المحادثة
     */
    matchSuggestionChip(message) {
        const t = String(message).trim();
        const n = t.toLowerCase();

        if (/صف أعراضك|بالتفصيل/.test(n) && t.length < 120) {
            return {
                success: true,
                message:
                    'حسناً. اكتب باختصار: ماذا تشعر الآن، منذ متى، وهل تتناول أدوية أو لديك مرض مزمن؟\n\nمثال: «سعال جاف منذ أسبوع مع تعب خفيف».\n\nيمكنك أيضاً اختيار حالة من القائمة أعلى الصفحة ثم الضغط على «احصل على توصية».',
                suggestions: ['عندي سعال جاف', 'إرهاق وضعف', 'مشاكل في الهضم', 'اختبار']
            };
        }

        if (/اذكر المشكلة|المشكلة الرئيسية/.test(n) && t.length < 120) {
            return {
                success: true,
                message:
                    'ابدأ بجملة واحدة تصف أكثر ما يزعجك الآن، ثم أضف التفاصيل (الشدة، المدة، ما يخففها أو يزيدها).',
                suggestions: ['صداع متكرر', 'ألم معدة بعد الأكل', 'لا أنام جيداً', 'لعب لعبة']
            };
        }

        if (/اسأل عن منتج|منتج معين|سعر منتج/.test(n) && t.length < 120) {
            return {
                success: true,
                message:
                    'اكتب اسم المنتج أو نوع العسل (مثل: سدر، سمر، زهور، حبة سوداء). يمكنني توجيهك حسب ما هو متوفر في المتجر.',
                suggestions: ['عسل السدر', 'عسل السمر', 'عسل الزهور', 'عندي سعال وأريد اقتراحاً']
            };
        }

        if (/العودة للمساعدة|العودة للرئيسية/.test(n)) {
            return {
                success: true,
                message: `${this.greeting} صف حالتك بحرية أو اختر من القائمة أعلى الصفحة.`,
                suggestions: ['عندي إرهاق وضعف', 'سعال جاف', 'اختبار', 'لعبة']
            };
        }

        return null;
    }

    /**
     * طلب ملخص فوائد العسل حسب الحالات (سؤال عام)
     */
    isHoneyBenefitsForAllConditionsRequest(lowerMessage) {
        const n = String(lowerMessage || '');
        if (n.length > 220) return false;
        if (/فائدة العسل لعلاج كل حالة|فوائد العسل لكل حالة|فائدة العسل لكل الأمراض|فائدة العسل لكل الحالات/.test(n)) {
            return true;
        }
        if (/فائدة.*عسل.*(كل|جميع).*(حالة|حالات|أمراض|الحالات)/.test(n)) return true;
        if (/(ما|ما هي|اذكر|اعطني).*(فائدة|فوائد).*عسل.*(حالة|كل|شامل|مختلف)/.test(n)) return true;
        return false;
    }

    /**
     * ملخص إرشادي تعليمي — ليس تشخيصاً ولا وصف علاج
     */
    getHoneyBenefitsOverviewMessage() {
        return (
            '**تنبيه:** المعلومات تعليمية وتراعي الاستخدام التقليدي والشائع؛ لا تغني عن تشخيص أو علاج يحدده مختص. لا يُعطى العسل لرضع دون سنة تقريباً. مرضى السكري والحساسية من العسل يحتاجون توجيهاً طبياً.\n\n' +
            '**أنواع العسل وما يُذكر حولها غالباً (باختصار):**\n' +
            '• **عسل السدر:** يُذكر كدعم للطاقة والتغذية العامة؛ يُطابق كثيراً مع الإرهاق و«الحيوية» ضمن نظام متوازن.\n' +
            '• **عسل السمر:** يُذكر تقليدياً مع السعال ومشاكل الحلق والصدر — كدعم للراحة وليس بديلاً عن علاج.\n' +
            '• **عسل الزهور:** يُذكر غالباً مع الهضم الخفيف والانتفاخ كجزء من وجبات معتدلة.\n' +
            '• **عسل الحبة السوداء / المخلوط:** يُستخدم أحياناً كخيار غذائي داعم حسب المنتج ووصفه في المتجر.\n\n' +
            '**حسب نوع الشكوى (إرشاد عام):**\n' +
            '• **ألم / صداع / مفاصل:** دعم عام للراحة والالتهاب الخفيف — مع متابعة طبية إن استمر الألم.\n' +
            '• **نوم وأرق:** مشروب دافئ معتدل قد يساعد على الاسترخاء؛ ثبّت النوم والروتين.\n' +
            '• **هضم:** اعتدال في الوجبات؛ العسل كتحلية طبيعية قد يناسب بعض الأشخاص.\n' +
            '• **سعال وصدر:** سائل دافئ وتهوية؛ العسل يساعد أحياناً على راحة الحلق — راجع طبيباً عند حمى أو ضيق تنفس.\n' +
            '• **بشرة:** استخدامات موضعية أو غذائية عامة بحذر من الحساسية.\n' +
            '• **نساء / حمل / رضاعة:** يحتاج تقييماً فردياً مع مختص.\n' +
            '• **أطفال:** تجنب العسل للرضع؛ للأكبر سناً بحسب العمر والحالة.\n' +
            '• **أمراض مزمنة (سكري، ضغط، قلب، كلى):** الاعتدال إلزامي وأي تغيير يكون مع طبيبك.\n\n' +
            'للحصول على **اقتراح منتج** يناسب وصفك من متجرنا، اكتب أعراضك بجملة واضحة أو اختر من القائمة أعلى صفحة المساعد.'
        );
    }

    /**
     * أسئلة عامة (كيف، ما، هل) — ليست أعراضاً محددة
     */
    getQuestionResponse(lowerMessage, originalMessage) {
        if (this.isHoneyBenefitsForAllConditionsRequest(lowerMessage)) {
            return {
                success: true,
                message: this.getHoneyBenefitsOverviewMessage(),
                suggestions: ['عندي سعال جاف', 'إرهاق وضعف', 'مشاكل في الهضم', 'اختبار']
            };
        }

        if (/ما فائدة|فائدة العسل|لماذا العسل|هل العسل مفيد/.test(lowerMessage)) {
            return {
                success: true,
                message:
                    'العسل الطبيعي غذاء تقليدي غني بالسكريات البسيطة ومضادات أكسدة؛ يُستخدم أحياناً لتهدئة الحلق أو كجزء من نمط حياة متوازن. لا يعالج الأمراض وحده، والجرعة تعتمد على حالتك (مثلاً السكري يحتاج حذراً).\n\nصف عرضاً محدداً (سعال، إرهاق، هضم…) لأقترح نوعاً يناسب وصفك من منتجاتنا.',
                suggestions: ['عندي سعال جاف', 'إرهاق وضعف', 'مشاكل في الهضم', 'اختبار']
            };
        }

        if (/كيف أطلب|كيف الطلب|الشحن|التوصيل|الدفع/.test(lowerMessage)) {
            return {
                success: true,
                message:
                    'للطلب: تصفّح المنتجات، أضف للسلة، وأكمل من صفحة الدفع. لأي استفسار عن توفر أو توصيل، راجع صفحة المتجر أو تواصل معنا عبر واتساب إن وُجد.',
                suggestions: ['عندي سؤال عن منتج', 'عندي سعال جاف', 'لعب لعبة']
            };
        }

        return {
            success: true,
            message:
                'يمكنني مساعدتك عندما تصف أعراضك أو حالتك (مثلاً: سعال، أرق، إرهاق، اضطراب هضم)، أو تذكر منتجاً تريد معلومات عنه. جرّب أحد الخيارات أدناه.',
            suggestions: ['صف أعراضك بالتفصيل', 'عندي سعال جاف', 'اسأل عن منتج معين', 'اختبار']
        };
    }

    /**
     * استخراج الأعراض من نص المستخدم
     */
    extractSymptoms(message) {
        const symptoms = [];
        
        const symptomMap = {
            'أنيميا': {
                keywords: ['أنيميا', 'فقر دم', 'دم', 'anemia', 'blood', 'حديد', 'هيموجلوبين', 'خضرة', 'شحوب'],
                weight: 10,
                followUpQuestions: ['هل تعاني من تعب شديد؟', 'هل تشعر بالدوخة؟', 'هل لون وجهك شاحب؟']
            },
            'إرهاق': {
                keywords: ['إرهاق', 'تعب', 'إعياء', 'خمول', 'ضعف', 'كسل', 'لا حيوية', 'exhausted', 'tired', 'fatigue'],
                weight: 9,
                followUpQuestions: ['هل هذا الإرهاق من الشغل أم مرضي؟', 'كم مدة الإرهاق؟', 'هل تشعر بألم في العضلات؟']
            },
            'طاقة': {
                keywords: ['طاقة', 'نشاط', 'حيوية', 'قوة', 'energy', 'active', 'power', 'قوة بدنية'],
                weight: 8,
                followUpQuestions: ['هل تريد زيادة الطاقة للرياضة؟', 'هل تحتاج طاقة للدراسة؟']
            },
            'هضم': {
                keywords: ['هضم', 'معدة', 'عسر هضم', 'digestion', 'stomach', 'معدة', 'قولون', 'امعاء'],
                weight: 9,
                followUpQuestions: ['هل تعاني من غازات؟', 'هل تشعر بحرقة في المعدة؟', 'هل لديك إمساك؟']
            },
            'سعال': {
                keywords: ['سعال', 'كحة', 'صدر', 'تنفس', 'cough', 'chest', 'breathing', 'ربو', 'ربو'],
                weight: 10,
                followUpQuestions: ['هل السعال جاف أم مع بلغم؟', 'هل تشلم بضيق في التنفس؟', 'هل لديك حساسية؟']
            },
            'صدر': {
                keywords: ['صدر', 'تنفس', 'ربو', 'حساسية', 'chest', 'breathing', 'asthma', 'allergy'],
                weight: 9,
                followUpQuestions: ['هل لديك ربو؟', 'هل تشعر بضيق في الصدر؟']
            },
            'مناعة': {
                keywords: ['مناعة', 'جهاز مناعي', 'حماية', 'مرض', 'immunity', 'protection', 'defense', 'دفاع'],
                weight: 9,
                followUpQuestions: ['هل تمرض كثيراً؟', 'هل تريد تقوية مناعة الأطفال؟']
            },
            'بشرة': {
                keywords: ['بشرة', 'جمال', 'وجه', 'حبوب', 'بثور', 'skin', 'beauty', 'face', 'acne'],
                weight: 8,
                followUpQuestions: ['هل لديك حبوب الشباب؟', 'هل بشرتك جافة؟', 'هل تريد علاج للوجه؟']
            },
            'نوم': {
                keywords: ['نوم', 'أرق', 'راحة', 'sleep', 'insomnia', 'rest', 'relaxation'],
                weight: 8,
                followUpQuestions: ['هل لديك صعوبة في النوم؟', 'هل تستيقظ كثيراً ليلاً؟', 'هل تنام ساعات كافية؟']
            },
            'ذاكرة': {
                keywords: ['ذاكرة', 'تركيز', 'memory', 'focus', 'concentration', 'نسيان'],
                weight: 8,
                followUpQuestions: ['هل النسيان من الإرهاق؟', 'هل تواجه صعوبة في التركيز؟', 'هل تريد تحسين الذاكرة للدراسة؟']
            },
            'ضغط نفسي': {
                keywords: ['ضغط نفسي', 'توتر', 'قلق', 'stress', 'anxiety', 'tension', 'عصبية'],
                weight: 8,
                followUpQuestions: ['هل التوتر من الشغل؟', 'هل تشلم بالقلق المستمر؟', 'هل لديك مشاكل في النوم؟']
            }
        };

        for (const [symptom, data] of Object.entries(symptomMap)) {
            let found = false;
            let matchCount = 0;
            
            for (const keyword of data.keywords) {
                if (message.includes(keyword)) {
                    found = true;
                    matchCount++;
                }
            }
            
            if (found && !symptoms.find(s => s.name === symptom)) {
                symptoms.push({
                    name: symptom,
                    weight: data.weight,
                    matchCount: matchCount,
                    keywords: data.keywords.filter(k => message.includes(k)),
                    followUpQuestions: data.followUpQuestions
                });
            }
        }

        symptoms.sort((a, b) => {
            if (b.weight !== a.weight) {
                return b.weight - a.weight;
            }
            return b.matchCount - a.matchCount;
        });

        return symptoms;
    }

    /**
     * البحث عن منتجات مناسبة للأعراض
     */
    async findProductRecommendations(symptoms) {
        try {
            const products = await Product.find({
                status: 'active',
                isActive: true
            }).limit(45);

            const scoredProducts = products.map(product => {
                let score = 0;
                const reasons = [];

                const productText = `${product.name} ${product.description} ${product.tags ? product.tags.join(' ') : ''}`.toLowerCase();

                for (const symptom of symptoms) {
                    const symptomScore = this.calculateSymptomScore(symptom.name, productText, product);
                    if (symptomScore > 0) {
                        score += symptomScore;
                        reasons.push(`${symptom.name}: ${this.getSymptomReason(symptom.name)}`);
                    }
                }

                return {
                    ...product.toObject(),
                    aiScore: score,
                    aiReasons: reasons
                };
            });

            scoredProducts.sort((a, b) => b.aiScore - a.aiScore);

            return scoredProducts.slice(0, 3);

        } catch (error) {
            logger.error('Error finding product recommendations:', error);
            return [];
        }
    }

    /**
     * حساب نقاط المنتج لعرض معين
     */
    calculateSymptomScore(symptom, productText, product) {
        const scoreMap = {
            'أنيميا': { keywords: ['سدر', 'حديد', 'دم', 'أنيميا', 'فقر دم', 'هيموجلوبين', 'ملكي'], score: 10 },
            'إرهاق': { keywords: ['سدر', 'طاقة', 'قوة', 'نشاط', 'حيوية', 'إرهاق', 'تعب', 'سلام', 'تابعة'], score: 8 },
            'طاقة': { keywords: ['سدر', 'طاقة', 'نشاط', 'قوة', 'حيوية', 'ملكي', 'فاخر'], score: 7 },
            'هضم': { keywords: ['زهور', 'هضم', 'معدة', 'قولون', 'امعاء', 'عسر هضم', 'مراعي', 'طلح', 'ضباية', 'عسلق', 'ثعب'], score: 9 },
            'سعال': { keywords: ['سمر', 'سعال', 'صدر', 'تنفس', 'ربو', 'حساسية', 'صُمر', 'سُمر'], score: 10 },
            'صدر': { keywords: ['سمر', 'صدر', 'تنفس', 'ربو', 'حساسية', 'مِرية', 'سُمر'], score: 9 },
            'مناعة': { keywords: ['سدر', 'حبة سوداء', 'مناعة', 'حماية', 'جهاز مناعي', 'شمع'], score: 9 },
            'بشرة': { keywords: ['جمال', 'بشرة', 'حبوب', 'بثور', 'وجه', 'صورب'], score: 7 },
            'نوم': { keywords: ['استرخاء', 'نوم', 'راحة', 'أرق', 'سدر'], score: 8 },
            'ذاكرة': { keywords: ['ذاكرة', 'تركيز', 'ذهني', 'سدر'], score: 8 },
            'ضغط نفسي': { keywords: ['توتر', 'قلق', 'استرخاء', 'هدوء', 'زهور'], score: 8 }
        };

        const symptomData = scoreMap[symptom];
        if (!symptomData) return 0;

        let score = 0;
        for (const keyword of symptomData.keywords) {
            if (productText.includes(keyword)) {
                score += symptomData.score;
            }
        }

        return score;
    }

    /**
     * الحصول على سبب التوصية
     */
    getSymptomReason(symptom) {
        const reasons = {
            'أنيميا': 'غني بالحديد ويساعد في علاج فقر الدم',
            'إرهاق': 'يزيد الطاقة ويساعد على التغلب على الإرهاق',
            'طاقة': 'يعزز الطاقة والحيوية والنشاط العام',
            'هضم': 'يحسن عملية الهضم ويساعد على صحة المعدة',
            'سعال': 'مفيد للصدر ويساعد في علاج السعال',
            'صدر': 'يدعم صحة الجهاز التنفسي',
            'مناعة': 'يعزز جهاز المناعة ويحمي من الأمراض',
            'بشرة': 'يحسن صحة البشرة ويساعد في علاج الحبوب',
            'نوم': 'يساعد على الاسترخاء والنوم العميق',
            'ذاكرة': 'يساعد في تحسين الذاكرة والتركيز',
            'ضغط نفسي': 'يساعد في تخفيف التوتر والقلق'
        };

        return reasons[symptom] || 'مفيد لحالتك الصحية';
    }

    /**
     * نصائح وإرشادات عامة (تعليمية) مرتبطة باسم العرض المستخرج — ليست تشخيصاً طبياً
     */
    getHealthTipsForSymptomNames(names) {
        const map = {
            'أنيميا': [
                'تناول أطعمة غنية بالحديد (كمية مناسبة من اللحوم، خضروات ورقية، بقوليات) بحسب استطاعتك ونصيحة مختص.',
                'تجنب شرب الشاي القوي مباشرة مع الوجبات الحديدية لأنه قد يقلل الامتصاص.',
                'العسل الطبيعي قد يدعم الشعور بالطاقة مع نظام غذائي متوازن — وليس بديلاً عن علاج فقر الدم إن وُجد.',
                'إذا كان لديك دوخة شديدة أو إرهاق مفاجئ، يُفضّل مراجعة طبيب.'
            ],
            'إرهاق': [
                'نظّم نومك (حوالي 7–8 ساعات) وقلل الشاشات قبل النوم قدر الإمكان.',
                'قسّم وجباتك وقلل الوجبات الثقيلة جداً دفعة واحدة.',
                'مارس مشياً خفيفاً يومياً إن سمحت حالتك.',
                'حافظ على شرب الماء؛ الجفاف يزيد الإرهاق.',
                'يمكن استخدام العسل كجزء من وجبة خفيفة طبيعية — وليس كمصدر وحيد للطاقة.'
            ],
            'طاقة': [
                'فطور متوازن يقلل هبوط الطاقة لاحقاً في اليوم.',
                'قلل السكريات السريعة التي ترفع الطاقة ثم تهبط بسرعة.',
                'تنفس عميق قصير أثناء العمل يخفف الإرهاق الذهني.',
                'العسل الطبيعي قد يكون خياراً حلواً معقولاً ضمن نظامك الغذائي.'
            ],
            'هضم': [
                'تناول الطعام ببطء ومضغ جيد يخفف الغازات والانتفاخ.',
                'قلل الوجبات الدسمة جداً والبهارات الحارة إذا زادت الأعراض.',
                'امشِ قليلاً بعد الأكل بدل الاستلقاء مباشرة.',
                'إذا استمرت الحموضة أو الألم الشديد، راجع طبيباً للفحص.',
                'العسل قد يُستخدم كتحلية طبيعية ضمن نظام هضمي مناسب لك.'
            ],
            'سعال': [
                'اشرب سوائل دافئة باعتدال؛ الرطوبة تريح الحلق.',
                'تهوية الغرفة وتجنب الدخان والروائح المزعجة.',
                'إذا كان السعال مع حمى أو ضيق تنفس أو دم، اطلب رعاية طبية فوراً.',
                'العسل الطبيعي يُستخدم تقليدياً لتهدئة الحلق — وليس بديلاً عن علاج وصفه طبيب عند الحاجة.'
            ],
            'صدر': [
                'تجنب الجهد الشديد أثناء ضيق النفس؛ اجلس مستقيماً وخذ أنفاساً بطيئة.',
                'إذا كان ضيق التنفس شديداً أو مفاجئاً، اتصل بالطوارئ أو راجع أقرب مركز.',
                'العسل قد يساعد كدعم للراحة الحلقية ضمن إرشادات طبية عند الحاجة.'
            ],
            'مناعة': [
                'النوم الكافي والتغذية المتنوعة يدعمان المناعة.',
                'غسل اليدين يقلل نقل العدوى.',
                'العسل الطبيعي غالباً يُذكر كجزء من نمط حياة صحي — وليس «علاج مناعة» وحده.'
            ],
            'بشرة': [
                'نظف بشرتك بلطف وتجنب حكّها بقوة.',
                'استخدم واقياً شمسياً عند التعرض للشمس.',
                'إذا انتشر الطفح بسرعة أو مع حمى، راجع طبيب جلدية.',
                'العسل يُستخدم أحياناً كمكوّن في وصفات طبيعية للترطيب — تجنبها إن كانت لديك حساسية.'
            ],
            'نوم': [
                'ثبّت وقت النوم والاستيقاظ قدر الإمكان حتى في العطلة.',
                'قلل الكافيين بعد الظهر؛ خفف الإضاءة قبل النوم.',
                'مشي خفيف نهاراً يساعد على نوم أعمق ليلاً.',
                'مشروب دافئ خفيف قد يساعد على الاسترخاء — العسل أحياناً يُضاف باعتدال.'
            ],
            'ذاكرة': [
                'قسّم المهام الكبيرة إلى خطوات صغيرة لتقليل الضغط الذهني.',
                'نوم كافٍ أفضل من السهر للتركيز.',
                'تناول أوميغا 3 وخضروات متنوعة يدعم الدماغ ضمن نظام متوازن.'
            ],
            'ضغط نفسي': [
                'تنفس بطيء 4-7-8 أو تمارين استرخاء قصيرة يومياً.',
                'حدد ما يضغطك واطلب دعماً من مقرّب أو مختص عند الحاجة.',
                'قلل الكافيين الزائد والأخبار المفرطة.',
                'العسل كتحلية طبيعية قد تكون جزءاً من نمط حياة هادئ — وليس علاج اكتئاب.'
            ]
        };

        const generic = [
            'اشرب ماءً كافياً خلال اليوم.',
            'نم كفاية وقلل الإجهاد المتواصل قدر الإمكان.',
            'إذا كانت الأعراض شديدة أو مفاجئة أو مستمرة، استشر طبيباً.',
            'المعلومات هنا إرشادية وتعليمية فقط وليست تشخيصاً أو وصف علاج.'
        ];

        const out = [];
        const seen = new Set();
        for (const name of names) {
            const list = map[name];
            if (list) {
                for (const t of list) {
                    if (!seen.has(t)) {
                        seen.add(t);
                        out.push(t);
                    }
                }
            }
        }
        if (out.length === 0) {
            return generic.slice(0, 5);
        }
        return out.slice(0, 8);
    }

    /**
     * نصائح حسب فئة الاستفسار المتقدم (ألم، نوم، هضم…)
     */
    getTipsForAdvancedCategory(inquiryType) {
        const byCat = {
            pain: [
                'ميّز بين الألم الحاد المفاجئ والمزمن؛ المفاجئ الشديد قد يحتاج طوارئ.',
                'راحة نسبية للمنطقة دون إطالة كامل الجسم في الفراش إن أمكن.',
                'لا تعتمد على مسكنات دون استشارة عند الألم غير المفسّر.',
                'العسل قد يُذكر كدعم عام للراحة — وليس بديلاً عن فحص طبي.'
            ],
            sleep: [
                'قلل الشاشة قبل النوم ساعة على الأقل.',
                'غرفة مظلمة وهادئة ودرجة حرارة معتدلة.',
                'تجنب وجبة ثقيلة مباشرة قبل النوم.',
                'العسل مع حليب دافئ قد يساعد بعض الناس على الاسترخاء — باعتدال.'
            ],
            digestion: [
                'وجبات أصغر وأكثر عدداً قد تخفف الهضم.',
                'سجّل الأطعمة التي تزيد الأعراض لتجنبها.',
                'إذا كان معك قيء دم أو ألم شديد، راجع الطوارئ.',
                'العسل خيار تحلية طبيعية لبعض الأنظمة الهضمية — حسب تحمّلك.'
            ],
            energy: [
                'فحص فيتامين د والحديد أحياناً يوضح سبب الإرهاق — عبر طبيب.',
                'توزيع الجهد على اليوم بدل الإفراط ثم الانهيار.',
                'العسل كجزء من فطور متوازن قد يدعم الشعور بالنشاط.'
            ],
            skin: [
                'لا تفرط في غسل الوجه؛ رطب بلطف بعد الغسيل.',
                'تجنب منتجات عطرة قوية إذا كانت البشرة حساسة.',
                'للطفح السريع مع حمى — راجع طبيباً.'
            ],
            breathing: [
                'ضيق تنفس شديد أو شفاه زرقاء — طوارئ فوراً.',
                'تجنب الدخان والغبار؛ تهوية المنزل.',
                'العسل قد يرافق مشروبات دافئة لراحة الحلق — مع متابعة الأعراض.'
            ],
            mental: [
                'المشي اليومي حتى 20–30 دقيقة يحسن المزاج عند كثير من الناس.',
                'حدد وقتاً للقلق (10 دقائق) بدل القلق طوال اليوم.',
                'إذا أفكار إيذاء النفس أو اليأس — اطلب مساعدة فورية من جهة موثوقة.'
            ],
            women: [
                'الحمل والرضاعة والهرمونات تحتاج متابعة طبية — لا تعتمدي على نصائح عامة وحدها.',
                'آلام شديدة غير معتادة في الدورة تستحق فحصاً.',
                'العسل باعتدال ضمن نظامك المعتمد من الطبيب.'
            ],
            children: [
                'لا يُعطى عسل لرضع دون سنة تقريباً — التزم بإرشادات طب الأطفال.',
                'حمى عالية أو قلة شرب أو نعاس شديد — راجع طبيب الأطفال.',
                'تغذية متنوعة ونوم منتظم يدعمان مناعة الطفل.'
            ],
            chronic: [
                'لا تغيّر جرعات أدويتك دون طبيب.',
                'راقب السكر أو الضغط حسب خطة طبيبك.',
                'العسل سكريات طبيعية — يحتاج اعتدالاً وحسب توجيه مختص عند السكري.',
                'الزيارات الدورية لطبيبك أهم من أي نصيحة عامة على الإنترنت.'
            ]
        };
        return byCat[inquiryType] || [
            'صف حالتك بتفصيل أكبر لمساعدة أدق.',
            'عند أي أعراض خطيرة أو مفاجئة، راجع الطوارئ أو طبيبك.'
        ];
    }

    /**
     * تنسيق رد ذكي
     */
    formatSmartResponse(symptoms, recommendations, userId) {
        const symptomNames = symptoms.map(s => s.name);
        const healthTips = this.getHealthTipsForSymptomNames(symptomNames);

        if (recommendations.length === 0) {
            return {
                success: true,
                message:
                    'فهمت ما وصفته. لا توجد منتجات مطابقة في المتجر حالياً — تصفح الموقع أو تواصل معنا عبر واتساب لمساعدتك.\n\n⚠️ تذكير: المعلومات إرشادية وليست بديلاً عن الفحص الطبي. ستجد أدناه نصائح عامة قد تفيدك.',
                symptoms: symptomNames,
                healthTips,
                suggestions: ['صف الأعراض بطريقة أخرى', 'ما أنواع العسل لديكم؟', 'لعبة', 'العودة للرئيسية']
            };
        }

        const primarySymptom = symptoms[0];
        const followUpQuestion = primarySymptom.followUpQuestions && primarySymptom.followUpQuestions[0];
        const conv = userId ? this.conversationState.get(userId) : null;
        const canAskFollowUp = !!(followUpQuestion && conv && typeof conv.followUpQuestions === 'number' && conv.followUpQuestions < 2);

        let message = `فهمتك جيداً — يبدو أن طلبك مرتبط بـ «${primarySymptom.name}». `;
        let healthTipsPayload = healthTips;

        if (canAskFollowUp) {
            message += followUpQuestion;
            const quickTips = this.getHealthTipsForSymptomNames([primarySymptom.name]).slice(0, 3);
            if (quickTips.length) {
                message += '\n\n📌 نصائح سريعة:\n' + quickTips.map((t, i) => `${i + 1}. ${t}`).join('\n');
            }
            conv.followUpQuestions++;
            healthTipsPayload = [];
        } else {
            const top = recommendations[0];
            const reasonsText = (top.aiReasons && top.aiReasons.length) ? top.aiReasons.join(' — ') : 'يناسب وصف حالتك وفقاً لمعلومات المنتج في المتجر';
            message += `أنسب ما لدينا الآن: «${top.name}» — ${reasonsText}.\n\nيمكنك فتح صفحة المنتج للتفاصيل والطلب.`;
            message += '\n\n⚠️ للحالات المزمنة أو الحمل أو الأدوية: استشر طبيبك قبل الاعتماد على العسل كدعم غذائي.';
            message += '\n\nفي الأسفل نصائح عامة قد تساعدك — تعليمية وليست بديلاً عن الطبيب.';
        }

        return {
            success: true,
            message: message,
            symptoms: symptomNames,
            healthTips: healthTipsPayload,
            recommendations: recommendations.map((product, index) => ({
                rank: index + 1,
                name: product.name,
                price: product.price,
                oldPrice: product.oldPrice,
                image: product.image,
                description: product.description,
                score: product.aiScore,
                reasons: product.aiReasons,
                url: `product-details.html?productId=${product._id}`
            })),
            suggestions: [
                'هل تريد معرفة المزيد عن أي منتج؟',
                'يمكنك الطلب مباشرة من خلال الرابط',
                'هل تريد لعب لعبة؟',
                'هل لديك أسئلة أخرى عن حالتك؟'
            ]
        };
    }

    /**
     * كشف نوع الاستفسار
     */
    detectInquiryType(message) {
        const greetings = ['مرحبا', 'أهلا', 'السلام', 'هلا', 'hi', 'hello'];
        const gameInquiries = [...this.gamePatterns];
        // لا نستخدم "عسل" وحدها حتى لا تُخطف الرسائل الصحية (مثل: عندي سعال وأريد عسل)
        const productInquiries = ['سعر', 'أسعار', 'كم السعر', 'كم يكلف', 'تسعير', 'قائمة الأسعار', 'product price', 'price'];
        const generalInquiries = [...this.socialPatterns];
        const questionInquiries = [...this.questionPatterns];
        
        for (const greeting of greetings) {
            if (message.includes(greeting)) return 'greeting';
        }
        
        for (const game of gameInquiries) {
            if (message.includes(game)) return 'game';
        }
        
        for (const inquiry of productInquiries) {
            if (message.includes(inquiry)) return 'product_info';
        }
        
        for (const thanks of generalInquiries) {
            if (message.includes(thanks)) return 'general';
        }
        
        for (const question of questionInquiries) {
            if (message.includes(question)) return 'question';
        }
        
        return 'symptom';
    }

    /**
     * تحديث حالة المحادثة
     */
    updateConversationState(userId, message) {
        if (!this.conversationState.has(userId)) {
            this.conversationState.set(userId, {
                messages: [],
                symptoms: [],
                followUpQuestions: 0,
                currentTopic: null
            });
        }
        
        const state = this.conversationState.get(userId);
        state.messages.push({
            text: message,
            timestamp: new Date()
        });
    }

    /**
     * طلب توضيح
     */
    askForClarification() {
        return {
            success: true,
            message: 'لم أفهم حالتك بشكل كافٍ. هل يمكنك وصف ما تشعر به بمزيد من التفصيل؟',
            suggestions: [
                'صف أعراضك بالتفصيل',
                'اذكر المشكلة الرئيسية',
                'اسأل عن منتج معين',
                'لعب لعبة'
            ]
        };
    }

    /**
     * رد تحية
     */
    getGreetingResponse() {
        return {
            success: true,
            message: `${this.greeting} أنا هنا لمساعدتك في اختيار العسل المناسب لحالتك الصحية. صف حالتك وسأقترح عليك الأنسب! 🍯\n\n🎮 يمكنك أيضاً لعب الألعاب التعليمية!`,
            suggestions: [
                'يمكنك سؤالي عن أي حالة صحية',
                'سأساعدك في اختيار العسل المناسب',
                'لدينا منتجات طبيعية 100%',
                'لعب لعبة'
            ]
        };
    }

    /**
     * رد معلومات المنتج
     */
    getProductInfoResponse(message) {
        return {
            success: true,
            message: 'لدينا مجموعة متنوعة من منتجات العسل الطبيعي. صف حالتك وسأقترح عليك الأنسب! 🍯\n\n🎮 أو يمكنك لعب الألعاب التعليمية!',
            suggestions: [
                'عسل السدر - للطاقة والأنيميا',
                'عسل السمر - للسعال والصدر',
                'عسل الزهور - للهضم والمناعة',
                'اسأل عن منتج معين',
                'لعب لعبة'
            ]
        };
    }

    /**
     * رد عام
     */
    getGeneralResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('شكرا') || lowerMessage.includes('مشكور')) {
            return {
                success: true,
                message: 'عفواً! يسعدني مساعدتك. هل هناك شيء آخر يمكنني مساعدتك به؟ 😊\n\n🎮 لا تنسى تجربة الألعاب التعليمية!',
                suggestions: [
                    'يمكنك سؤالي عن أي منتج',
                    'صف حالتك لأعطيك توصية',
                    'تصفح جميع منتجاتنا',
                    'لعب لعبة'
                ]
            };
        }

        return {
            success: true,
            message: 'يمكنني مساعدتك في اختيار العسل المناسب لحالتك الصحية. صف حالتك وسأقترح عليك أفضل المنتجات! 🍯\n\n🎮 أو يمكنك لعب الألعاب التعليمية!',
            suggestions: [
                'صف حالتك الصحية',
                'اذكر أعراضك',
                'اسأل عن منتج معين',
                'لعب لعبة'
            ]
        };
    }

    /**
     * الحصول على معلومات المنتج
     */
    async getProductInfo(productId) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return {
                    success: false,
                    message: 'المنتج غير موجود'
                };
            }

            return {
                success: true,
                product: {
                    name: product.name,
                    price: product.price,
                    oldPrice: product.oldPrice,
                    description: product.description,
                    image: product.image,
                    stock: product.stock,
                    category: product.category,
                    tags: product.tags,
                    url: `product-details.html?productId=${product._id}`
                }
            };
        } catch (error) {
            logger.error('Error getting product info:', error);
            return {
                success: false,
                message: 'حدث خطأ في جلب معلومات المنتج'
            };
        }
    }
}

module.exports = new AIAssistant();
