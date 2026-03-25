/**
 * AI Assistant Service - Ultimate Version with Real Conversation Patterns
 * خدمة المساعد الذكي "ريف" - نسخة شاملة مع احتمالات حقيقية للمحادثة
 */

const Product = require('../models/Product');
const logger = require('../utils/logger');

class AIAssistant {
    constructor() {
        this.name = "مساعد ريف";
        this.greeting = "مرحباً! أنا مساعد ريف، كيف يمكنني مساعدتك اليوم؟ 🍯";
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
                message: 'المشاكل المزمنة تحتاج عناية خاصة! ما نوع المشكلة المزمنة التي تعاني منها؟\n\n💡 **معلومات مهمة:**\n- هل تتناول أدوية حالياً؟\n- هل المشكلة خاضعة للسيطرة؟\n- هل استشرت الطبيب مؤخراً؟\n\n🍯 **العسل يمكن أن يساعد في:**\n- تحسين الصحة العامة\n- تقوية المناعة\n- تخفيف بعض الأعراض\n\n⚠️ **مهم:** استشر طبيبك قبل استخدام أي علاج بديل',
                suggestions: ['سكري', 'ضغط دم', 'كوليسترول', 'مشاكل قلب']
            }
        };

        return responses[inquiryType] || this.getGeneralResponse(message);
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

    /**
     * بدء لعبة الاختبار
     */
    startQuizGame(userId) {
        const questions = [
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
            }
        ];
        
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        this.gameState.set(userId, {
            currentGame: 'quiz',
            currentQuestion: randomQuestion,
            score: 0,
            questionsAnswered: 0
        });
        
        return {
            success: true,
            message: '🧠 **اختبار العسل**',
            gameType: 'quiz',
            question: randomQuestion.question,
            options: randomQuestion.options,
            suggestions: randomQuestion.options
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
            }).limit(20);

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
            'أنيميا': { keywords: ['سدر', 'حديد', 'دم', 'أنيميا', 'فقر دم', 'هيموجلوبين'], score: 10 },
            'إرهاق': { keywords: ['سدر', 'طاقة', 'قوة', 'نشاط', 'حيوية', 'إرهاق', 'تعب'], score: 8 },
            'طاقة': { keywords: ['سدر', 'طاقة', 'نشاط', 'قوة', 'حيوية'], score: 7 },
            'هضم': { keywords: ['زهور', 'هضم', 'معدة', 'قولون', 'امعاء', 'عسر هضم'], score: 9 },
            'سعال': { keywords: ['سمر', 'سعال', 'صدر', 'تنفس', 'ربو', 'حساسية'], score: 10 },
            'صدر': { keywords: ['سمر', 'صدر', 'تنفس', 'ربو', 'حساسية'], score: 9 },
            'مناعة': { keywords: ['سدر', 'حبة سوداء', 'مناعة', 'حماية', 'جهاز مناعي'], score: 9 },
            'بشرة': { keywords: ['جمال', 'بشرة', 'حبوب', 'بثور', 'وجه'], score: 7 },
            'نوم': { keywords: ['استرخاء', 'نوم', 'راحة', 'أرق'], score: 8 },
            'ذاكرة': { keywords: ['ذاكرة', 'تركيز', 'ذهني'], score: 8 },
            'ضغط نفسي': { keywords: ['توتر', 'قلق', 'استرخاء', 'هدوء'], score: 8 }
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
     * تنسيق رد ذكي
     */
    formatSmartResponse(symptoms, recommendations, userId) {
        if (recommendations.length === 0) {
            return {
                success: true,
                message: 'فهمت حالتك. للأسف لا توجد منتجات متاحة الآن، ولكن يمكنك التواصل معنا للمساعدة.',
                symptoms: symptoms.map(s => s.name),
                suggestions: ['هل يمكنك توضيح حالتك أكثر؟', 'تواصل معنا مباشرة للمساعدة']
            };
        }

        const primarySymptom = symptoms[0];
        const followUpQuestion = primarySymptom.followUpQuestions[0];

        let message = `فهمت! لديك ${primarySymptom.name}. `;
        
        if (followUpQuestion && userId && this.conversationState.get(userId).followUpQuestions < 2) {
            message += followUpQuestion;
            this.conversationState.get(userId).followUpQuestions++;
        } else {
            message += `أوصي بـ ${recommendations[0].name} لأنه ${recommendations[0].aiReasons.join(' و ')}.`;
        }

        return {
            success: true,
            message: message,
            symptoms: symptoms.map(s => s.name),
            recommendations: recommendations.map((product, index) => ({
                rank: index + 1,
                name: product.name,
                price: product.price,
                oldPrice: product.oldPrice,
                image: product.image,
                description: product.description,
                score: product.aiScore,
                reasons: product.aiReasons,
                url: `/product.html?id=${product._id}`
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
        const productInquiries = ['منتج', 'عسل', 'سعر', 'كم', 'product', 'honey', 'price'];
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
                    url: `/product.html?id=${product._id}`
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
