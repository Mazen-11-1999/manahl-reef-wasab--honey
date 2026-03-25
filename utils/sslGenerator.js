/**
 * SSL Certificate Generator
 * إنشاء شهادات SSL مجانية لـ HTTPS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./logger');

/**
 * إنشاء شهادة SSL ذاتية التوقيع (للتطوير)
 */
const generateSelfSignedSSL = () => {
    try {
        const sslDir = path.join(__dirname, '..', 'ssl');
        
        // إنشاء مجلد SSL إذا لم يكن موجوداً
        if (!fs.existsSync(sslDir)) {
            fs.mkdirSync(sslDir, { recursive: true });
        }
        
        const keyPath = path.join(sslDir, 'server.key');
        const certPath = path.join(sslDir, 'server.crt');
        
        // التحقق من وجود الشهادات
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
            logger.info('✅ SSL certificates already exist');
            return {
                key: keyPath,
                cert: certPath
            };
        }
        
        // إنشاء شهادة ذاتية التوقيع باستخدام OpenSSL
        logger.info('🔐 Generating self-signed SSL certificates...');
        
        const opensslCommand = `openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyPath}" -out "${certPath}" -days 365 -subj "/C=SA/ST=Sanaa/L=Sanaa/O=Manahl Badr/OU=IT/CN=localhost"`;
        
        execSync(opensslCommand, { stdio: 'inherit' });
        
        logger.info('✅ Self-signed SSL certificates generated successfully');
        
        return {
            key: keyPath,
            cert: certPath
        };
    } catch (error) {
        logger.error('❌ Failed to generate SSL certificates:', error);
        return null;
    }
};

/**
 * إعداد Let's Encrypt (للإنتاج)
 */
const setupLetsEncrypt = async (domain, email) => {
    try {
        logger.info(`🔐 Setting up Let's Encrypt for domain: ${domain}`);
        
        // التحقق من وجود certbot
        try {
            execSync('certbot --version', { stdio: 'pipe' });
        } catch (error) {
            logger.error('❌ Certbot not found. Please install certbot first.');
            logger.info('💡 Install certbot: https://certbot.eff.org/');
            return null;
        }
        
        const certDir = '/etc/letsencrypt/live';
        const keyPath = path.join(certDir, domain, 'privkey.pem');
        const certPath = path.join(certDir, domain, 'fullchain.pem');
        
        // التحقق من وجود الشهادات
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
            logger.info('✅ Let\'s Encrypt certificates already exist');
            return {
                key: keyPath,
                cert: certPath
            };
        }
        
        // إنشاء شهادة Let's Encrypt
        logger.info('🔐 Requesting Let\'s Encrypt certificate...');
        
        const certbotCommand = `certbot certonly --standalone --email ${email} --agree-tos --no-eff-email -d ${domain}`;
        
        execSync(certbotCommand, { stdio: 'inherit' });
        
        logger.info('✅ Let\'s Encrypt certificate generated successfully');
        
        return {
            key: keyPath,
            cert: certPath
        };
    } catch (error) {
        logger.error('❌ Failed to setup Let\'s Encrypt:', error);
        return null;
    }
};

/**
 * تجديد شهادة Let's Encrypt
 */
const renewLetsEncrypt = async () => {
    try {
        logger.info('🔄 Renewing Let\'s Encrypt certificates...');
        
        execSync('certbot renew --quiet', { stdio: 'inherit' });
        
        logger.info('✅ Let\'s Encrypt certificates renewed successfully');
        return true;
    } catch (error) {
        logger.error('❌ Failed to renew Let\'s Encrypt certificates:', error);
        return false;
    }
};

/**
 * التحقق من صلاحية الشهادة
 */
const checkCertificateValidity = (certPath) => {
    try {
        if (!fs.existsSync(certPath)) {
            return { valid: false, message: 'Certificate file not found' };
        }
        
        const opensslCommand = `openssl x509 -in "${certPath}" -noout -dates`;
        const output = execSync(opensslCommand, { encoding: 'utf8' });
        
        const dates = output.match(/notBefore=(.+)\s+notAfter=(.+)/);
        if (!dates) {
            return { valid: false, message: 'Invalid certificate format' };
        }
        
        const notBefore = new Date(dates[1]);
        const notAfter = new Date(dates[2]);
        const now = new Date();
        
        const isValid = now >= notBefore && now <= notAfter;
        const daysUntilExpiry = Math.ceil((notAfter - now) / (1000 * 60 * 60 * 24));
        
        return {
            valid: isValid,
            notBefore,
            notAfter,
            daysUntilExpiry,
            message: isValid ? 'Certificate is valid' : 'Certificate is expired'
        };
    } catch (error) {
        logger.error('❌ Failed to check certificate validity:', error);
        return { valid: false, message: 'Failed to check certificate' };
    }
};

/**
 * إنشاء خادم HTTPS
 */
const createHTTPSServer = (app, sslOptions) => {
    try {
        const https = require('https');
        
        const server = https.createServer(sslOptions, app);
        
        logger.info('🔐 HTTPS server created successfully');
        
        return server;
    } catch (error) {
        logger.error('❌ Failed to create HTTPS server:', error);
        return null;
    }
};

/**
 * إعادة التوجيه من HTTP إلى HTTPS
 */
const createHTTPToHTTPSRedirect = (httpsPort = 443) => {
    return (req, res) => {
        const httpsUrl = `https://${req.headers.host}:${httpsPort}${req.url}`;
        res.redirect(301, httpsUrl);
    };
};

/**
 * إعداد SSL تلقائياً
 */
const setupSSL = async (domain, email, useProduction = false) => {
    try {
        let sslConfig;
        
        if (useProduction && domain && email) {
            // استخدام Let's Encrypt للإنتاج
            sslConfig = await setupLetsEncrypt(domain, email);
        } else {
            // استخدام شهادة ذاتية التوقيع للتطوير
            sslConfig = generateSelfSignedSSL();
        }
        
        if (!sslConfig) {
            throw new Error('Failed to setup SSL');
        }
        
        // التحقق من صلاحية الشهادة
        const validity = checkCertificateValidity(sslConfig.cert);
        logger.info(`📋 Certificate validity: ${validity.message}`);
        
        if (validity.daysUntilExpiry && validity.daysUntilExpiry < 30) {
            logger.warn(`⚠️ Certificate expires in ${validity.daysUntilExpiry} days`);
        }
        
        return sslConfig;
    } catch (error) {
        logger.error('❌ Failed to setup SSL:', error);
        return null;
    }
};

/**
 * جدولة تجديد شهادة Let's Encrypt
 */
const scheduleCertificateRenewal = () => {
    // تجديد الشهادة كل يوم في الساعة 3 صباحاً
    const schedule = '0 3 * * *';
    
    logger.info('⏰ Scheduled certificate renewal: every day at 3 AM');
    
    // في بيئة الإنتاج، يمكن استخدام node-cron أو مكتبة مشابهة
    // هنا مجرد مثال بسيط
    setInterval(async () => {
        const now = new Date();
        if (now.getHours() === 3 && now.getMinutes() === 0) {
            await renewLetsEncrypt();
        }
    }, 60 * 1000); // كل دقيقة للتحقق
};

/**
 * إنشاء ملفات SSL لـ HTTPS
 */
const createSSLFiles = () => {
    try {
        const sslDir = path.join(__dirname, '..', 'ssl');
        
        if (!fs.existsSync(sslDir)) {
            fs.mkdirSync(sslDir, { recursive: true });
        }
        
        // إنشاء شهادة ذاتية التوقيع
        const sslConfig = generateSelfSignedSSL();
        
        if (sslConfig) {
            logger.info('✅ SSL files created successfully');
            return sslConfig;
        }
        
        return null;
    } catch (error) {
        logger.error('❌ Failed to create SSL files:', error);
        return null;
    }
};

module.exports = {
    generateSelfSignedSSL,
    setupLetsEncrypt,
    renewLetsEncrypt,
    checkCertificateValidity,
    createHTTPSServer,
    createHTTPToHTTPSRedirect,
    setupSSL,
    scheduleCertificateRenewal,
    createSSLFiles
};
