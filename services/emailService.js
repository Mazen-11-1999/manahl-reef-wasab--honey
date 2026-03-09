/**
 * Email Service
 * خدمة إرسال البريد الإلكتروني عبر Gmail
 */

const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

/**
 * تهيئة Email Service
 */
const initEmailService = () => {
    if (!config.emailHost || !config.emailUser || !config.emailPass) {
        logger.warn('⚠️  Email service not configured. Email notifications will be disabled.');
        return false;
    }

    try {
        transporter = nodemailer.createTransport({
            host: config.emailHost,
            port: parseInt(config.emailPort) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: config.emailUser,
                pass: config.emailPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        logger.info('✅ Email service initialized');
        return true;
    } catch (error) {
        logger.error('❌ Failed to initialize email service:', error);
        return false;
    }
};

/**
 * إرسال رسالة بريد إلكتروني
 */
const sendEmail = async (to, subject, html, text = null) => {
    if (!transporter) {
        if (!initEmailService()) {
            logger.warn('Email service not available, skipping email send');
            return { success: false, message: 'Email service not configured' };
        }
    }

    try {
        const mailOptions = {
            from: `"مناحل ريف وصاب" <${config.emailUser}>`,
            to: to,
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>/g, '') // Remove HTML tags for text version
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`✅ Email sent to ${to}: ${info.messageId}`);
        
        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        logger.error('❌ Failed to send email:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * إرسال رسالة تأكيد الطلب
 */
const sendOrderConfirmation = async (order, customer) => {
    const subject = `تأكيد طلبك #${order.orderId} - مناحل ريف وصاب`;
    
    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Tajawal', Arial, sans-serif; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d4af37, #f3cf7a); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-right: 4px solid #d4af37; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="color: #120a00; margin: 0;">🍯 مناحل ريف وصاب 🍯</h1>
            </div>
            <div class="content">
                <h2>شكراً لك ${customer.name}!</h2>
                <p>تم استلام طلبك بنجاح وسيتم معالجته قريباً.</p>
                
                <div class="order-info">
                    <h3>📋 تفاصيل الطلب:</h3>
                    <p><strong>رقم الطلب:</strong> ${order.orderId}</p>
                    <p><strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleString('ar-SA')}</p>
                    <p><strong>المبلغ الإجمالي:</strong> ${order.total.toLocaleString()} ريال</p>
                    <p><strong>طريقة الدفع:</strong> ${getPaymentMethodText(order.paymentMethod)}</p>
                    <p><strong>الحالة:</strong> ${getStatusText(order.status)}</p>
                </div>
                
                <div class="order-info">
                    <h3>📍 معلومات التوصيل:</h3>
                    <p><strong>المدينة:</strong> ${order.customer.city}</p>
                    <p><strong>العنوان:</strong> ${order.customer.address}</p>
                </div>
                
                <p style="margin-top: 30px;">
                    يمكنك تتبع طلبك من خلال الرابط التالي:<br>
                    <a href="${config.frontendUrl}/order-tracking.html?orderId=${order.orderId}" style="color: #d4af37; text-decoration: none;">
                        تتبع طلبك
                    </a>
                </p>
            </div>
            <div class="footer">
                <p>مناحل ريف وصاب - أجود أنواع العسل الطبيعي</p>
                <p>للاستفسار: ${order.customer.phone}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return await sendEmail(customer.email || customer.phone + '@temp.com', subject, html);
};

/**
 * إرسال رسالة تحديث حالة الطلب
 */
const sendOrderStatusUpdate = async (order, customer, newStatus) => {
    const subject = `تحديث حالة طلبك #${order.orderId} - مناحل ريف وصاب`;
    
    const statusMessages = {
        'processing': 'قيد المعالجة',
        'paid': 'تم الدفع',
        'ready_to_ship': 'جاهز للشحن',
        'shipped': 'تم الشحن',
        'delivered': 'تم التوصيل',
        'completed': 'مكتمل'
    };

    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Tajawal', Arial, sans-serif; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d4af37, #f3cf7a); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-right: 4px solid #d4af37; text-align: center; }
            .status-icon { font-size: 48px; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="color: #120a00; margin: 0;">🍯 مناحل ريف وصاب 🍯</h1>
            </div>
            <div class="content">
                <h2>مرحباً ${customer.name}!</h2>
                <p>تم تحديث حالة طلبك #${order.orderId}</p>
                
                <div class="status-box">
                    <div class="status-icon">${getStatusIcon(newStatus)}</div>
                    <h3 style="margin: 10px 0;">${statusMessages[newStatus] || newStatus}</h3>
                </div>
                
                <p style="margin-top: 30px;">
                    <a href="${config.frontendUrl}/order-tracking.html?orderId=${order.orderId}" style="background: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        تتبع طلبك
                    </a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    return await sendEmail(customer.email || customer.phone + '@temp.com', subject, html);
};

/**
 * إرسال رسالة سند الشحن
 */
const sendShippingReceipt = async (order, customer, receiptUrl) => {
    const subject = `سند شحن طلبك #${order.orderId} - مناحل ريف وصاب`;
    
    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Tajawal', Arial, sans-serif; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d4af37, #f3cf7a); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
            .receipt-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="color: #120a00; margin: 0;">🍯 مناحل ريف وصاب 🍯</h1>
            </div>
            <div class="content">
                <h2>مرحباً ${customer.name}!</h2>
                <p>تم شحن طلبك #${order.orderId} بنجاح!</p>
                
                <div class="receipt-box">
                    <h3>📸 سند الشحن:</h3>
                    <img src="${receiptUrl}" alt="سند الشحن" style="max-width: 100%; border-radius: 8px; margin: 15px 0;">
                    <p>يمكنك استخدام هذا السند لتتبع شحنتك</p>
                </div>
                
                <p style="margin-top: 30px;">
                    <a href="${config.frontendUrl}/order-tracking.html?orderId=${order.orderId}" style="background: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        تتبع طلبك
                    </a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    return await sendEmail(customer.email || customer.phone + '@temp.com', subject, html);
};

// Helper functions
const getPaymentMethodText = (method) => {
    const methods = {
        'full': 'دفع كامل (تحويل رقمي/كريمي)',
        'half': 'دفع نصفي (عربون والباقي عند الاستلام)',
        'delivery': 'دفع عند الاستلام',
        'cash_on_delivery': 'دفع عند الاستلام',
        'bank_transfer': 'تحويل بنكي'
    };
    return methods[method] || method;
};

const getStatusText = (status) => {
    const statuses = {
        'pending': 'قيد الانتظار',
        'processing': 'قيد المعالجة',
        'paid': 'تم الدفع',
        'ready_to_ship': 'جاهز للشحن',
        'shipped': 'تم الشحن',
        'delivered': 'تم التوصيل',
        'completed': 'مكتمل',
        'cancelled': 'ملغي'
    };
    return statuses[status] || status;
};

const getStatusIcon = (status) => {
    const icons = {
        'processing': '⏳',
        'paid': '💳',
        'ready_to_ship': '📦',
        'shipped': '🚚',
        'delivered': '✅',
        'completed': '🎉'
    };
    return icons[status] || '📋';
};

// Initialize on load
if (config.nodeEnv !== 'test') {
    initEmailService();
}

module.exports = {
    initEmailService,
    sendEmail,
    sendOrderConfirmation,
    sendOrderStatusUpdate,
    sendShippingReceipt
};



















