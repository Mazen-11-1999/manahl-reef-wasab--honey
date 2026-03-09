# استخدام Node.js 18 Alpine لصورة أصغر
FROM node:18-alpine

# إعداد مجلد العمل
WORKDIR /app

# نسخ ملفات package.json و package-lock.json
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci --only=production && npm cache clean --force

# نسخ باقي الملفات
COPY . .

# إنشاء مجلد الرفع
RUN mkdir -p uploads

# فتح المنفذ 3000
EXPOSE 3000

# متغيرات البيئة الافتراضية
ENV NODE_ENV=production
ENV PORT=3000

# تشغيل التطبيق
CMD ["npm", "start"]

# معلومات الصورة
LABEL maintainer="Manahl Badr Development Team"
LABEL version="1.0.0"
LABEL description="Backend API for Manahl Badr - Reef Wasab Honey Farm E-commerce Platform"
