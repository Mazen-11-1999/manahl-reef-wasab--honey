/**
 * AI Assistant Routes
 * مسارات المساعد الذكي "ريف"
 */

const express = require('express');
const router = express.Router();
const aiAssistant = require('../services/aiAssistantService');
const logger = require('../utils/logger');

/**
 * تحليل رسالة المستخدم وتقديم توصية
 * POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'الرسالة مطلوبة'
            });
        }

        logger.info('AI Assistant Request:', {
            message: message.substring(0, 100),
            userId: userId || 'anonymous',
            timestamp: new Date().toISOString()
        });

        const response = await aiAssistant.analyzeUserMessage(message);

        logger.info('AI Assistant Response:', {
            success: response.success,
            recommendations: response.recommendations?.length || 0,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('AI Assistant Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في المساعد الذكي',
            error: error.message
        });
    }
});

/**
 * الحصول على معلومات منتج
 * GET /api/ai/product/:id
 */
router.get('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await aiAssistant.getProductInfo(id);

        if (response.success) {
            res.json({
                success: true,
                data: response.product
            });
        } else {
            res.status(404).json({
                success: false,
                message: response.message
            });
        }

    } catch (error) {
        logger.error('AI Product Info Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب معلومات المنتج'
        });
    }
});

/**
 * الحصول على معلومات المساعد
 * GET /api/ai/info
 */
router.get('/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: aiAssistant.name,
            greeting: aiAssistant.greeting,
            features: [
                'تحليل الأعراض والحالات الصحية',
                'توصية بالمنتجات المناسبة',
                'معلومات مفصلة عن المنتجات',
                'ردود ذكية ومخصصة'
            ],
            supportedSymptoms: [
                'أنيميا وفقر الدم',
                'إرهاق وضعف عام',
                'مشاكل الهضم',
                'سعال ومشاكل الصدر',
                'ضعف المناعة',
                'مشاكل البشرة',
                'ضغط الدم والسكري',
                'الحاجة للطاقة والنشاط',
                'مشاكل النوم والأرق'
            ],
            tips: [
                'كن محدداً في وصف حالتك',
                'اذكر الأعراض الرئيسية',
                'يمكنك سؤال عن منتج معين',
                'أسأل عن الفوائد الصحية'
            ]
        }
    });
});

/**
 * الحصول على الاقتراحات الشائعة
 * GET /api/ai/suggestions
 */
router.get('/suggestions', (req, res) => {
    const suggestions = [
        {
            type: 'symptom',
            text: 'عندي إرهاق وضعف عام',
            message: 'أوصي بعسل السدر لزيادة الطاقة'
        },
        {
            type: 'symptom',
            text: 'عندي مشاكل في الهضم',
            message: 'أوصي بعسل الزهور لتحسين الهضم'
        },
        {
            type: 'symptom',
            text: 'عندي سعال جاف',
            message: 'أوصي بعسل السمر للسعال والصدر'
        },
        {
            type: 'symptom',
            text: 'أريد تقوية مناعتي',
            message: 'أوصي بعسل السدر مع حبة البركة'
        },
        {
            type: 'product',
            text: 'ما هو عسل السدر؟',
            message: 'عسل السدر هو أفضل أنواع العسل اليمني'
        },
        {
            type: 'general',
            text: 'ما هي أفضل المنتجات لديكم؟',
            message: 'لدينا مجموعة متنوعة من الأعسال الطبيعية'
        }
    ];

    res.json({
        success: true,
        data: suggestions
    });
});

module.exports = router;
