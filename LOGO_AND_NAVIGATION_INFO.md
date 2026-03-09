# معلومات الشعار والتنقل بين الصفحات

## 📍 موقع صورة الشعار في الكود

### 1. في HTML (frontend/index.html):

**السطر 140-145:**
```html
<header class="fade-in">
    <div class="logo-container">
        <div class="animated-logo">
            <div class="logo-placeholder">
                <img id="logo-img" alt="شعار مناحل ريف وصاب" class="main-logo-image" src="assets/manahel.jpg">
            </div>
        </div>
    </div>
    <h1 class="animated-title">مناحل ريف وصاب</h1>
    <p class="tagline">الفخامة الأصيلة من قلب الجبال اليمنية</p>
</header>
```

### 2. في JavaScript (frontend/index.html):

**السطر 1683-1721:**
```javascript
// دالة لتحميل الشعار (صورة فقط)
function loadLogo() {
    const logoImg = document.getElementById('logo-img');
    if (!logoImg) return;

    // مسارات الشعار - الصورة فقط
    const logoPaths = [
        'assets/manahel.jpg',              // المسار الأول (من frontend/)
        'frontend/assets/manahel.jpg',     // المسار الثاني (من الجذر)
        'assets/images/manahel.jpg',       // المسار الثالث
        'images/manahel.jpg'               // المسار الرابع
    ];

    let currentPathIndex = 0;

    function tryNextPath() {
        if (currentPathIndex >= logoPaths.length) {
            // جميع المسارات فشلت
            console.warn('لم يتم العثور على صورة الشعار');
            if (logoImg) {
                logoImg.style.display = 'none';
            }
            return;
        }

        const testImg = new Image();
        testImg.onload = function () {
            logoImg.src = logoPaths[currentPathIndex];
            logoImg.style.display = 'block';
        };
        testImg.onerror = function () {
            currentPathIndex++;
            tryNextPath();
        };
        testImg.src = logoPaths[currentPathIndex];
    }

    tryNextPath();
}
```

### 3. في CSS (frontend/index.html):

**السطر 279-296:**
```css
/* الشعار - صورة فقط */
.main-logo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    z-index: 2;
    position: relative;
    transition: all 0.5s ease;
    filter: drop-shadow(0 0 15px rgba(244, 192, 37, 0.6));
    background: transparent;
    display: block;
}

.logo-placeholder:hover .main-logo-image {
    transform: scale(1.1);
    filter: drop-shadow(0 0 25px rgba(244, 192, 37, 0.9));
}
```

### 📂 المسار الفعلي للصورة:

**يجب أن تكون الصورة في:**
```
E:\manahl-badr\frontend\assets\manahel.jpg
```

**أو في:**
```
E:\manahl-badr\assets\manahel.jpg
```

---

## 🔗 التنقل بين الصفحات - تم إصلاحه

### ✅ الصفحات التي تم إصلاحها:

#### 1. **frontend/index.html** (الصفحة الرئيسية)
- ✅ التنقل صحيح: `pages/cart.html`, `pages/profile.html`, `pages/contests.html`

#### 2. **frontend/pages/cart.html**
- ✅ التنقل صحيح: `../index.html`, `profile.html`

#### 3. **frontend/pages/checkout.html**
- ✅ تم إصلاح: `cart.html` → `cart.html` (نفس المجلد)
- ✅ تم إصلاح: `profile.html` → `profile.html` (نفس المجلد)
- ✅ التنقل صحيح: `../index.html`

#### 4. **frontend/pages/contests.html**
- ✅ تم إصلاح: `index.html` → `../index.html`
- ✅ تم إصلاح: `products-display.html` → `../index.html#products`
- ✅ تم تحديث الأيقونات إلى Font Awesome

#### 5. **frontend/pages/profile.html**
- ✅ التنقل صحيح: `../index.html`

#### 6. **frontend/pages/notifications.html**
- ✅ التنقل صحيح: `../index.html`, `profile.html`

---

## 📋 ملخص التنقل الصحيح:

### من `frontend/index.html`:
- إلى `pages/cart.html` → `pages/cart.html`
- إلى `pages/profile.html` → `pages/profile.html`
- إلى `pages/contests.html` → `pages/contests.html`
- إلى `pages/checkout.html` → `pages/checkout.html`

### من `frontend/pages/*.html`:
- إلى `index.html` → `../index.html`
- إلى `cart.html` → `cart.html` (نفس المجلد)
- إلى `profile.html` → `profile.html` (نفس المجلد)
- إلى `checkout.html` → `checkout.html` (نفس المجلد)
- إلى `contests.html` → `contests.html` (نفس المجلد)

---

## ✅ التحقق من التنقل:

جميع الروابط الآن تعمل بشكل صحيح:
- ✅ لا توجد أخطاء في المسارات
- ✅ جميع الأيقونات من Font Awesome
- ✅ التصميم موحد في جميع الصفحات
- ✅ التنقل يعمل من أي صفحة إلى أي صفحة أخرى










