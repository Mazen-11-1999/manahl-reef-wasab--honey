# الخطوة 4: بناء نماذج البيانات المفقودة ✅

## ما تم إنجازه:

### 1. نموذج Customer (العميل) - `models/Customer.js`:

#### الميزات:
- ✅ **ربط مع User**: ربط مباشر مع نموذج User
- ✅ **معلومات الاتصال**: email, phone
- ✅ **الملف الشخصي**: firstName, lastName, dateOfBirth, gender, avatar
- ✅ **العناوين المتعددة**: دعم عناوين متعددة (home, work, other)
- ✅ **التفضيلات**: categories, allergies, notifications
- ✅ **برنامج الولاء**: points, tier (bronze, silver, gold, platinum)
- ✅ **قائمة الأمنيات**: wishlist مع المنتجات
- ✅ **الإحصائيات**: lastOrderDate, lastLoginDate, totalOrders, totalSpent

#### Methods:
- `updateLoyaltyTier()` - تحديث tier بناءً على النقاط
- `addLoyaltyPoints(points)` - إضافة نقاط الولاء
- `addToWishlist(productId)` - إضافة منتج لقائمة الأمنيات
- `removeFromWishlist(productId)` - إزالة منتج من قائمة الأمنيات

#### Indexes:
- email, phone, user, loyalty.tier, createdAt

---

### 2. نموذج Cart (سلة التسوق) - `models/Cart.js`:

#### الميزات:
- ✅ **ربط مع Customer**: سلة واحدة لكل عميل
- ✅ **عناصر السلة**: product, quantity, price, addedAt
- ✅ **كوبونات الخصم**: code, discount, discountType (percentage/fixed)
- ✅ **انتهاء الصلاحية**: expiresAt (24 ساعة افتراضياً)
- ✅ **Virtuals**: subtotal, discountAmount, total, itemCount

#### Methods:
- `addItem(productId, quantity, price)` - إضافة منتج
- `updateItemQuantity(productId, quantity)` - تحديث الكمية
- `removeItem(productId)` - إزالة منتج
- `clear()` - تفريغ السلة
- `applyCoupon(code, discount, discountType)` - تطبيق كوبون
- `removeCoupon()` - إزالة كوبون
- `isExpired()` - التحقق من انتهاء الصلاحية
- `extendExpiry(hours)` - تمديد الصلاحية

#### Indexes:
- customer (unique), expiresAt (TTL)

---

### 3. نموذج Payment (الدفعات) - `models/Payment.js`:

#### الميزات:
- ✅ **ربط مع Order و Customer**
- ✅ **طرق الدفع**: credit_card, paypal, cash_on_delivery, bank_transfer, stripe
- ✅ **حالات الدفع**: pending, processing, completed, failed, refunded, cancelled
- ✅ **معلومات المعاملة**: transactionId, gatewayResponse
- ✅ **معلومات البطاقة**: last4, brand, expiry (مشفرة)
- ✅ **الاسترداد**: amount, reason, processedAt, transactionId

#### Methods:
- `updateStatus(status, transactionId, gatewayResponse)` - تحديث الحالة
- `processRefund(amount, reason, transactionId)` - معالجة الاسترداد

#### Indexes:
- order, customer, status, transactionId, createdAt, method+status

---

### 4. نموذج Review (التقييمات) - `models/Review.js`:

#### الميزات:
- ✅ **ربط مع Product و Customer و Order**
- ✅ **التقييم**: rating (1-5), title, comment
- ✅ **الصور**: images array
- ✅ **إحصائيات**: helpful count, helpfulUsers
- ✅ **التحقق**: verified, verifiedPurchase
- ✅ **الحالة**: pending, approved, rejected, hidden
- ✅ **رد البائع**: reply مع text, repliedAt, repliedBy

#### Methods:
- `markHelpful(customerId)` - إضافة تقييم مفيد
- `unmarkHelpful(customerId)` - إزالة تقييم مفيد
- `approve()` - الموافقة على التقييم
- `reject()` - رفض التقييم
- `addReply(text, userId)` - إضافة رد

#### Static Methods:
- `getAverageRating(productId)` - حساب متوسط التقييمات لمنتج

#### Indexes:
- product+status, customer, order, rating, createdAt, helpful
- Compound unique: product+customer (منع التقييمات المكررة)

#### Post-save Hook:
- تحديث متوسط التقييمات للمنتج تلقائياً عند الموافقة

---

### 5. نموذج Analytics (التحليلات) - `models/Analytics.js`:

#### الميزات:
- ✅ **أنواع الأحداث**: 
  - page_view, product_view
  - add_to_cart, remove_from_cart
  - checkout_start, checkout_complete, purchase
  - search, filter
  - review_submit
  - wishlist_add, wishlist_remove
  - login, register, logout
  - email_click, sms_click

- ✅ **المستخدم**: userId, sessionId
- ✅ **البيانات الإضافية**: metadata (flexible)
- ✅ **المنتج/الطلب**: product, order references
- ✅ **البحث**: searchQuery, filters
- ✅ **الموقع**: location (country, city, coordinates)
- ✅ **المتصفح**: userAgent, device info
- ✅ **القيمة**: value, currency (للأحداث المالية)

#### Static Methods:
- `getEventStats(eventType, startDate, endDate)` - إحصائيات الأحداث
- `getUserEvents(userId, limit)` - أحداث المستخدم
- `getProductEvents(productId, eventType, limit)` - أحداث المنتج
- `getConversionFunnel(startDate, endDate)` - قمع التحويل
- `getTopViewedProducts(limit, startDate, endDate)` - المنتجات الأكثر مشاهدة

#### Indexes:
- eventType+timestamp, userId+timestamp, sessionId+timestamp
- product+timestamp, timestamp
- Compound: eventType+timestamp+userId

---

### 6. تحديثات إضافية:

- ✅ **تحديث Product Schema**: إضافة ratings (average, count)
- ✅ **Relationships**: جميع النماذج مربوطة بشكل صحيح
- ✅ **Indexes**: فهرسة محسنة لجميع النماذج
- ✅ **Validation**: تحقق من البيانات في مستوى Schema
- ✅ **Virtuals**: حقول محسوبة ديناميكياً
- ✅ **Methods**: دوال مساعدة لكل نموذج
- ✅ **Hooks**: Pre/Post save hooks حيث لزم الأمر

## البنية الجديدة:

```
├── models/
│   ├── User.js          (موجود - تم تحديثه)
│   ├── Customer.js      (جديد)
│   ├── Cart.js          (جديد)
│   ├── Payment.js       (جديد)
│   ├── Review.js        (جديد)
│   └── Analytics.js     (جديد)
```

## العلاقات بين النماذج:

```
User (1) ──→ (1) Customer
Customer (1) ──→ (1) Cart
Customer (1) ──→ (*) Order
Customer (1) ──→ (*) Review
Customer (1) ──→ (*) Payment

Order (1) ──→ (*) Payment
Order (1) ──→ (1) Review (optional)

Product (*) ──→ (*) Cart (through items)
Product (1) ──→ (*) Review
Product (1) ──→ (*) Analytics

Analytics ──→ Customer (optional)
Analytics ──→ Product (optional)
Analytics ──→ Order (optional)
```

## كيفية الاستخدام:

### 1. إنشاء عميل:
```javascript
const Customer = require('./models/Customer');

const customer = await Customer.create({
    user: userId,
    email: 'customer@example.com',
    phone: '0501234567',
    profile: {
        firstName: 'أحمد',
        lastName: 'محمد'
    },
    addresses: [{
        type: 'home',
        street: 'شارع الملك فهد',
        city: 'الرياض',
        isDefault: true
    }]
});
```

### 2. إدارة السلة:
```javascript
const Cart = require('./models/Cart');

// إضافة منتج
await cart.addItem(productId, 2, 250);

// تطبيق كوبون
await cart.applyCoupon('SAVE10', 10, 'percentage');

// الحصول على المجموع
const total = cart.total; // Virtual
```

### 3. معالجة الدفع:
```javascript
const Payment = require('./models/Payment');

const payment = await Payment.create({
    order: orderId,
    customer: customerId,
    method: 'credit_card',
    amount: 500
});

// تحديث الحالة
await payment.updateStatus('completed', 'txn_123', gatewayResponse);
```

### 4. إضافة تقييم:
```javascript
const Review = require('./models/Review');

const review = await Review.create({
    product: productId,
    customer: customerId,
    order: orderId,
    rating: 5,
    title: 'منتج رائع',
    comment: 'جودة ممتازة',
    verifiedPurchase: true
});

// الموافقة
await review.approve();
```

### 5. تسجيل حدث تحليلي:
```javascript
const Analytics = require('./models/Analytics');

await Analytics.create({
    eventType: 'product_view',
    userId: customerId,
    sessionId: sessionId,
    product: productId,
    metadata: {
        source: 'search',
        query: 'عسل'
    },
    location: {
        country: 'SA',
        city: 'Riyadh'
    }
});
```

## الاختبار:

### 1. اختبار Customer:
```javascript
// إضافة نقاط الولاء
await customer.addLoyaltyPoints(100);
// سيتم تحديث tier تلقائياً

// إضافة لقائمة الأمنيات
await customer.addToWishlist(productId);
```

### 2. اختبار Cart:
```javascript
// إضافة منتج
await cart.addItem(productId, 2, 250);

// الحصول على المجموع
console.log(cart.subtotal); // 500
console.log(cart.total); // بعد الخصم
```

### 3. اختبار Analytics:
```javascript
// الحصول على إحصائيات
const stats = await Analytics.getEventStats('purchase', startDate, endDate);

// قمع التحويل
const funnel = await Analytics.getConversionFunnel(startDate, endDate);
```

## ملاحظات مهمة:

1. **TTL Index**: Cart له TTL index على expiresAt (سيتم حذف السلات المنتهية تلقائياً)
2. **Unique Constraints**: Customer+User, Cart+Customer, Review+Product+Customer
3. **Virtuals**: لا يتم حفظها في قاعدة البيانات، يتم حسابها عند الطلب
4. **Hooks**: Review يحدث Product ratings تلقائياً عند الموافقة
5. **Relationships**: جميع العلاقات معرّفة بشكل صحيح مع populate support

## الخطوة التالية:

الخطوة 6: بناء API Endpoints الكاملة (Auth, Customer, Cart, Products, Orders, Analytics)

---

**✅ الخطوة 4 مكتملة!**










