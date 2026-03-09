@echo off
echo ===============================================
echo    مناحل ريف وصاب - تشغيل الخادم الخلفي
echo ===============================================
echo.

REM التحقق من وجود Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ خطأ: Node.js غير مثبت على النظام
    echo يرجى تحميل وتثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)

REM التحقق من وجود MongoDB
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  تحذير: MongoDB غير مثبت محلياً
    echo سيتم استخدام MongoDB في Docker إذا كان متوفراً
    echo أو يمكنك تثبيت MongoDB من: https://www.mongodb.com
)

echo ✅ Node.js متوفر
echo.

REM تثبيت التبعيات إذا لم تكن موجودة
if not exist "node_modules" (
    echo 📦 تثبيت التبعيات...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ فشل في تثبيت التبعيات
        pause
        exit /b 1
    )
    echo ✅ تم تثبيت التبعيات بنجاح
) else (
    echo ✅ التبعيات موجودة
)

echo.
echo 🚀 بدء تشغيل الخادم...
echo يمكنك الوصول للخادم على: http://localhost:3000
echo يمكنك الوصول لواجهة الإدارة على: http://localhost:3000/admin-dashboard-tabs.html
echo.

REM تشغيل الخادم
npm start

pause
