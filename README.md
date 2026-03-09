# مناحل ريف وصاب - Backend API

خادم خلفي متكامل لمنصة التجارة الإلكترونية لبيع العسل والمنتجات الطبيعية.

## 🚀 الميزات

- ✅ **إدارة المنتجات**: إضافة، تعديل، حذف، وعرض المنتجات
- ✅ **إدارة الطلبات**: حفظ وتتبع الطلبات
- ✅ **إدارة المسابقات**: إنشاء وإدارة المسابقات التفاعلية
- ✅ **نظام المصادقة**: JWT tokens للأمان
- ✅ **رفع الملفات**: دعم رفع صور المنتجات
- ✅ **إحصائيات شاملة**: تقارير مالية وإحصائية
- ✅ **قاعدة بيانات MongoDB**: تخزين البيانات بشكل آمن

## 📋 متطلبات التشغيل

- **Node.js** >= 16.0.0
- **MongoDB** >= 4.0
- **npm** >= 8.0.0

## 🛠️ التثبيت والتشغيل

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd manahl-badr-backend
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. إعداد قاعدة البيانات
تأكد من تشغيل MongoDB على المنفذ الافتراضي (27017)

### 4. إعداد متغيرات البيئة
قم بنسخ ملف `.env` وضبط المتغيرات حسب الحاجة:
```bash
cp .env.example .env
```

### 5. تشغيل الخادم
```bash
# للتطوير (مع إعادة التحميل التلقائي)
npm run dev

# للإنتاج
npm start
```

الخادم سيعمل على: `http://localhost:3000`

## 📡 API Endpoints

### 🔐 المصادقة
```
POST /api/auth/login
```

### 📦 المنتجات
```
GET    /api/products          # جلب جميع المنتجات
POST   /api/products          # إضافة منتج جديد (يتطلب مصادقة)
PUT    /api/products/:id      # تحديث منتج (يتطلب مصادقة)
DELETE /api/products/:id      # حذف منتج (يتطلب مصادقة)
```

### 🛒 الطلبات
```
POST /api/orders             # إنشاء طلب جديد
GET  /api/orders             # جلب جميع الطلبات (يتطلب مصادقة)
```

### 🏆 المسابقات
```
GET    /api/contests          # جلب جميع المسابقات (يتطلب مصادقة)
POST   /api/contests          # إنشاء مسابقة جديدة (يتطلب مصادقة)
PUT    /api/contests/:id      # تحديث مسابقة (يتطلب مصادقة)
```

### 💡 هل تعلم؟
```
GET  /api/did-you-know       # جلب عناصر "هل تعلم؟"
POST /api/did-you-know       # إضافة عنصر جديد (يتطلب مصادقة)
```

### 📊 الإحصائيات
```
GET /api/stats               # جلب الإحصائيات (يتطلب مصادقة)
```

### 📁 رفع الملفات
```
POST /api/upload             # رفع ملف (يتطلب مصادقة)
```

## 🔧 إعدادات البيئة

| المتغير | الوصف | القيمة الافتراضية |
|---------|--------|-------------------|
| `PORT` | منفذ الخادم | `3000` |
| `MONGODB_URI` | رابط قاعدة البيانات | `mongodb://localhost:27017/manahl-badr` |
| `JWT_SECRET` | مفتاح JWT | `your-super-secret-jwt-key-change-this-in-production` |
| `JWT_EXPIRE` | مدة صلاحية التوكن | `24h` |
| `MAX_FILE_SIZE` | الحد الأقصى لحجم الملف | `5242880` (5MB) |

## 🗄️ نماذج قاعدة البيانات

### المنتجات (Products)
```javascript
{
  name: String,           // اسم المنتج
  category: String,       // الفئة
  description: String,    // الوصف
  price: Number,          // السعر
  oldPrice: Number,       // السعر القديم (اختياري)
  stock: Number,          // المخزون
  image: String,          // مسار الصورة
  sku: String,            // رمز المنتج
  featured: Boolean,      // مميز
  status: String          // الحالة
}
```

### الطلبات (Orders)
```javascript
{
  orderId: String,        // رقم الطلب الفريد
  customer: {             // بيانات العميل
    name: String,
    phone: String,
    city: String,
    address: String,
    notes: String
  },
  items: [{               // عناصر الطلب
    product: ObjectId,    // ربط بالمنتج
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,          // المجموع الكلي
  paymentMethod: String,  // طريقة الدفع
  status: String          // حالة الطلب
}
```

### المسابقات (Contests)
```javascript
{
  name: String,           // اسم المسابقة
  description: String,    // الوصف
  prize: String,          // الجائزة
  startDate: Date,        // تاريخ البداية
  endDate: Date,          // تاريخ النهاية
  participants: [String], // المشاركون
  winners: [{             // الفائزون
    name: String,
    prize: String,
    date: Date
  }],
  status: String          // الحالة
}
```

## 🔒 الأمان

- **JWT Authentication**: حماية نقاط النهاية الحساسة
- **File Upload Validation**: التحقق من نوع وحجم الملفات
- **Input Sanitization**: تنظيف المدخلات
- **Rate Limiting**: تحديد معدل الطلبات (قابل للإضافة)
- **CORS**: حماية من الوصول المباشر

## 📊 مراقبة الأداء

- **Morgan**: تسجيل الطلبات
- **Error Handling**: معالجة الأخطاء المركزية
- **Graceful Shutdown**: إغلاق آمن للخادم
- **Database Indexing**: فهرسة قاعدة البيانات

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
npm test

# تشغيل الاختبارات مع التغطية
npm run test:coverage
```

## 🚀 النشر

### للإنتاج:
1. غير متغيرات البيئة للإنتاج
2. استخدم `npm start` بدلاً من `npm run dev`
3. قم بإعداد MongoDB Atlas أو خادم MongoDB مخصص
4. استخدم PM2 لإدارة العمليات

### Docker:
```bash
# بناء الصورة
docker build -t manahl-badr-backend .

# تشغيل الحاوية
docker run -p 3000:3000 manahl-badr-backend
```

## 📝 السجلات (Logs)

- **Console Logs**: معلومات التشغيل الأساسية
- **Error Logs**: الأخطاء والاستثناءات
- **Request Logs**: جميع الطلبات الواردة

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ فرع للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للفرع (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة ISC.

## 📞 الدعم

للدعم الفني أو الأسئلة، يرجى التواصل مع فريق التطوير.

---

**تم التطوير بواسطة فريق تطوير مناحل ريف وصاب** 🐝
