# 🔗 دليل تحديث الروابط بعد التنظيم

## 📋 الملفات التي تحتاج تحديث الروابط:

### 1. **ملفات `frontend/admin/*.html`:**
يجب تحديث جميع الروابط لتشير إلى:
- لوحة التحكم: `dashboard.html` (نفس المجلد)
- صفحات أخرى: `../pages/` أو `../index.html`
- JavaScript: `../js/`
- الصور: `../assets/images/`

### 2. **ملفات `frontend/pages/*.html`:**
يجب تحديث جميع الروابط لتشير إلى:
- الصفحة الرئيسية: `../index.html`
- صفحات أخرى: `filename.html` (نفس المجلد) أو `../admin/`
- JavaScript: `../js/`
- الصور: `../assets/images/`

### 3. **ملف `frontend/index.html`:**
- ✅ تم تحديث مسار الصورة: `assets/images/images.jpg`
- ✅ تم تحديث روابط الصفحات: `pages/products-display.html`
- ✅ تم تحديث روابط التنقل: `pages/contests.html`, `pages/my-orders.html`, `pages/profile.html`

### 4. **ملف `frontend/login.html`:**
- يجب تحديث روابط التوجيه بعد تسجيل الدخول

---

## 🔧 أمثلة على التحديث:

### من `frontend/admin/dashboard.html`:
```html
<!-- قبل -->
<a href="product-management.html">إدارة المنتجات</a>
<script src="js/api.js"></script>
<img src="images/logo.jpg">

<!-- بعد -->
<a href="products.html">إدارة المنتجات</a>
<script src="../js/api.js"></script>
<img src="../assets/images/logo.jpg">
```

### من `frontend/pages/cart.html`:
```html
<!-- قبل -->
<a href="checkout.html">الدفع</a>
<a href="index.html">الرئيسية</a>
<script src="js/api.js"></script>

<!-- بعد -->
<a href="checkout.html">الدفع</a>
<a href="../index.html">الرئيسية</a>
<script src="../js/api.js"></script>
```

---

## ⚠️ ملاحظات مهمة:

1. **الروابط النسبية**: استخدم `../` للرجوع لمجلد أعلى
2. **مسارات JavaScript**: من `admin/` → `../js/`، من `pages/` → `../js/`
3. **مسارات الصور**: من `admin/` → `../assets/images/`، من `pages/` → `../assets/images/`
4. **روابط الصفحات**: استخدم أسماء الملفات الجديدة

---

## ✅ الملفات المحدثة:

- ✅ `frontend/index.html` - تم تحديث الروابط الأساسية
- ✅ `frontend/admin/dashboard.html` - تم تحديث بعض الروابط
- ✅ `frontend/js/dashboard-back-button.js` - تم تحديث الروابط

---

## ⚠️ الملفات المتبقية:

يجب تحديث الروابط في:
- جميع ملفات `frontend/admin/*.html`
- جميع ملفات `frontend/pages/*.html`
- `frontend/login.html`











