# 📁 خطة تنظيم الملفات

## 🎯 الهدف:
تنظيم المشروع بشكل احترافي مع تسميات واضحة ومنطقية

## 📋 البنية المقترحة:

```
manahl-badr/
├── server.js                    # الخادم الرئيسي (إعادة تسمية server-new.js)
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── README.md
│
├── frontend/                    # جميع ملفات الواجهة الأمامية
│   ├── index.html              # الصفحة الرئيسية
│   ├── login.html              # تسجيل الدخول
│   │
│   ├── pages/                  # صفحات المستخدمين
│   │   ├── products-display.html
│   │   ├── product-details.html
│   │   ├── cart.html
│   │   ├── checkout.html
│   │   ├── contests.html
│   │   ├── did-you-know.html
│   │   ├── health-benefits.html
│   │   ├── our-story.html
│   │   ├── my-orders.html
│   │   ├── profile.html
│   │   ├── notifications.html
│   │   └── order-tracking.html
│   │
│   ├── admin/                  # صفحات الإدارة
│   │   ├── dashboard.html      # لوحة التحكم الشاملة (إعادة تسمية admin-dashboard-tabs.html)
│   │   ├── products.html       # إدارة المنتجات (إعادة تسمية product-management.html)
│   │   ├── orders.html         # إدارة الطلبات (إعادة تسمية manual-order-manager.html)
│   │   ├── order-details.html
│   │   ├── contests.html       # إدارة المسابقات (إعادة تسمية admin-contest-control.html)
│   │   ├── did-you-know.html  # إدارة "هل تعلم" (إعادة تسمية admin-did-you-know.html)
│   │   ├── notifications.html # إرسال الإشعارات (إعادة تسمية notification-sender.html)
│   │   ├── reports.html       # التقارير المالية (إعادة تسمية financial-reports.html)
│   │   ├── reviews.html        # مراجعات العملاء (إعادة تسمية customer-reviews.html)
│   │   ├── users.html         # إشعارات المستخدمين (إعادة تسمية user-notifications.html)
│   │   ├── ads.html           # إدارة الإعلانات (إعادة تسمية ads-management.html)
│   │   ├── shipping.html      # أرشيف الشحن (إعادة تسمية shipping-archive.html)
│   │   ├── invoice.html
│   │   ├── settings.html      # الإعدادات العامة (إعادة تسمية general-settings.html)
│   │   └── map.html           # خريطة المبيعات (إعادة تسمية admin-map.html)
│   │
│   ├── assets/                 # الموارد الثابتة
│   │   ├── css/
│   │   ├── js/
│   │   ├── images/
│   │   └── fonts/
│   │
│   └── js/                     # ملفات JavaScript
│       ├── api.js
│       ├── common.js           # الدوال المشتركة
│       ├── dashboard-back-button.js
│       └── admin-dashboard-integration.js
│
├── backend/                    # ملفات Backend
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── scripts/
│
├── docs/                       # التوثيق
│   ├── ADMIN_ACCESS_README.md
│   ├── ADMIN_DASHBOARD_INTEGRATION.md
│   ├── ADMIN_SECURITY_COMPLETE.md
│   ├── BACKUP_SYSTEM.md
│   ├── DASHBOARD_MERGE_COMPLETE.md
│   ├── DASHBOARD_PAGES_COMPLETE.md
│   ├── STEP1_SECURITY_FIXES.md
│   ├── STEP2_SECURITY_MIDDLEWARE.md
│   ├── STEP3_INPUT_VALIDATION.md
│   ├── STEP4_MODELS.md
│   ├── STEP6_API_ENDPOINTS.md
│   ├── STEP7_CACHING_OPTIMIZATION.md
│   └── ...
│
├── uploads/                    # الملفات المرفوعة
├── logs/                      # ملفات السجلات
├── node_modules/
│
└── docker/                     # ملفات Docker
    ├── Dockerfile
    ├── docker-compose.yml
    └── nginx.conf
```

## 🔄 التغييرات المطلوبة:

### 1. إعادة تسمية الملفات:
- `server-new.js` → `server.js`
- `admin-dashboard-tabs.html` → `frontend/admin/dashboard.html`
- `product-management.html` → `frontend/admin/products.html`
- `manual-order-manager.html` → `frontend/admin/orders.html`
- `admin-contest-control.html` → `frontend/admin/contests.html`
- `admin-did-you-know.html` → `frontend/admin/did-you-know.html`
- `notification-sender.html` → `frontend/admin/notifications.html`
- `financial-reports.html` → `frontend/admin/reports.html`
- `customer-reviews.html` → `frontend/admin/reviews.html`
- `user-notifications.html` → `frontend/admin/users.html`
- `ads-management.html` → `frontend/admin/ads.html`
- `shipping-archive.html` → `frontend/admin/shipping.html`
- `general-settings.html` → `frontend/admin/settings.html`
- `admin-map.html` → `frontend/admin/map.html`

### 2. نقل الملفات:
- جميع ملفات HTML → `frontend/` أو `frontend/pages/` أو `frontend/admin/`
- جميع ملفات التوثيق → `docs/`
- ملفات Docker → `docker/`

### 3. تحديث الروابط:
- تحديث جميع الروابط في الملفات بعد النقل
- تحديث مسارات الصور والـ CSS والـ JS
- تحديث مسارات API

