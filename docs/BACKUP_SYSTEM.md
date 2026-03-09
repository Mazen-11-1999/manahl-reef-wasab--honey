# نظام النسخ الاحتياطي (Backup System) ✅

## نظرة عامة:

تم إنشاء نظام نسخ احتياطي كامل يحفظ:
- ✅ **قاعدة البيانات MongoDB** (كاملة)
- ✅ **الملفات المهمة** (uploads, logs, config, .env)
- ✅ **ضغط تلقائي** (tar.gz)
- ✅ **حذف النسخ القديمة** تلقائياً
- ✅ **جدولة تلقائية** للنسخ الاحتياطي

---

## الملفات:

### 1. `utils/backup.js`:
- `backupDatabase()` - نسخ احتياطي لقاعدة البيانات
- `backupFiles()` - نسخ احتياطي للملفات
- `backupAll()` - نسخ احتياطي كامل
- `restoreDatabase()` - استعادة قاعدة البيانات
- `listBackups()` - قائمة النسخ الاحتياطية
- `getBackupStats()` - إحصائيات النسخ

### 2. `controllers/backupController.js`:
- Controllers للـ API endpoints

### 3. `routes/backupRoutes.js`:
- Routes محمية (تتطلب صلاحيات المشرف)

### 4. `scripts/auto-backup.js`:
- Script للنسخ الاحتياطي التلقائي (يمكن تشغيله كـ cron job)

### 5. `scripts/backup-schedule.js`:
- جدولة النسخ الاحتياطي التلقائي

---

## API Endpoints:

### جميع الـ endpoints تتطلب:
- ✅ Authentication (تسجيل دخول)
- ✅ Admin privileges (صلاحيات المشرف)

```
POST   /api/backup/database     # نسخ احتياطي لقاعدة البيانات
POST   /api/backup/files        # نسخ احتياطي للملفات
POST   /api/backup/full         # نسخ احتياطي كامل
GET    /api/backup/list         # قائمة النسخ الاحتياطية
POST   /api/backup/restore      # استعادة قاعدة البيانات
GET    /api/backup/stats        # إحصائيات النسخ
```

---

## كيفية الاستخدام:

### 1. نسخ احتياطي يدوي:

```bash
# نسخ احتياطي لقاعدة البيانات
curl -X POST http://localhost:3000/api/backup/database \
  -H "Authorization: Bearer ADMIN_TOKEN"

# نسخ احتياطي كامل
curl -X POST http://localhost:3000/api/backup/full \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 2. قائمة النسخ الاحتياطية:

```bash
curl -X GET http://localhost:3000/api/backup/list?type=all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 3. استعادة قاعدة البيانات:

```bash
curl -X POST http://localhost:3000/api/backup/restore \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "mongodb-backup-2024-01-15T10-30-00-000Z.tar.gz"}'
```

### 4. إحصائيات النسخ:

```bash
curl -X GET http://localhost:3000/api/backup/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## النسخ الاحتياطي التلقائي:

### 1. جدولة داخل التطبيق:

يتم تفعيل الجدولة التلقائية تلقائياً في بيئة الإنتاج:
- **نسخة يومية**: قاعدة البيانات في الساعة 2:00 صباحاً
- **نسخة أسبوعية**: نسخة كاملة يوم الأحد في الساعة 3:00 صباحاً

### 2. استخدام Cron Job (Linux/Mac):

```bash
# فتح crontab
crontab -e

# إضافة السطر التالي (نسخة يومية في الساعة 2 صباحاً)
0 2 * * * cd /path/to/manahl-badr && node scripts/auto-backup.js >> logs/backup.log 2>&1
```

### 3. استخدام Task Scheduler (Windows):

```powershell
# إنشاء مهمة مجدولة
schtasks /create /tn "ManahlBadrBackup" /tr "node E:\manahl-badr\scripts\auto-backup.js" /sc daily /st 02:00
```

---

## موقع النسخ الاحتياطية:

```
backups/
├── database/          # نسخ قاعدة البيانات
│   ├── mongodb-backup-2024-01-15T10-30-00-000Z.tar.gz
│   └── mongodb-backup-2024-01-16T10-30-00-000Z.tar.gz
└── files/             # نسخ الملفات
    ├── files-backup-2024-01-15T10-30-00-000Z.tar.gz
    └── files-backup-2024-01-16T10-30-00-000Z.tar.gz
```

---

## الإعدادات:

### الاحتفاظ بالنسخ:
- **قاعدة البيانات**: آخر 10 نسخ
- **الملفات**: آخر 5 نسخ

يتم حذف النسخ القديمة تلقائياً.

---

## متطلبات:

### MongoDB Tools:
يجب تثبيت `mongodump` و `mongorestore`:

**Windows:**
```bash
# تحميل من: https://www.mongodb.com/try/download/database-tools
```

**Linux:**
```bash
sudo apt-get install mongodb-database-tools
```

**Mac:**
```bash
brew install mongodb-database-tools
```

---

## الأمان:

1. ✅ **النسخ الاحتياطية محمية**: تتطلب صلاحيات المشرف
2. ✅ **الملفات مضغوطة**: تقليل الحجم
3. ✅ **حذف تلقائي**: النسخ القديمة تُحذف تلقائياً
4. ✅ **تسجيل**: جميع العمليات مسجلة

---

## استعادة البيانات:

### خطوات الاستعادة:

1. **اختيار النسخة الاحتياطية**:
   ```bash
   GET /api/backup/list
   ```

2. **استعادة قاعدة البيانات**:
   ```bash
   POST /api/backup/restore
   {
     "filename": "mongodb-backup-2024-01-15T10-30-00-000Z.tar.gz"
   }
   ```

3. **التحقق من الاستعادة**:
   - تحقق من البيانات في قاعدة البيانات
   - تحقق من المنتجات والطلبات

---

## نصائح:

1. **نسخ احتياطي منتظم**: قم بعمل نسخة احتياطية قبل أي تحديثات كبيرة
2. **اختبار الاستعادة**: اختبر استعادة النسخ الاحتياطية بانتظام
3. **نسخ خارجية**: انسخ النسخ الاحتياطية إلى مكان خارجي (Cloud Storage)
4. **مراقبة المساحة**: راقب مساحة القرص الصلب

---

## استكشاف الأخطاء:

### مشكلة: mongodump غير موجود
```bash
# تثبيت MongoDB Database Tools
# Windows: تحميل من الموقع الرسمي
# Linux: sudo apt-get install mongodb-database-tools
# Mac: brew install mongodb-database-tools
```

### مشكلة: فشل النسخ الاحتياطي
- تحقق من صلاحيات MongoDB
- تحقق من مساحة القرص الصلب
- تحقق من السجلات في `logs/`

---

**✅ نظام النسخ الاحتياطي جاهز للاستخدام!**










