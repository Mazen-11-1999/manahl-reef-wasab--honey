/**
 * زر العودة للوحة التحكم - ملف JavaScript موحد
 * لإضافته في جميع صفحات الإدارة
 */

// ===== الإعدادات =====
const DASHBOARD_CONFIG = {
    dashboardUrl: 'admin/dashboard.html',
    buttonPosition: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
    showOnPages: [
        // صفحات الإدارة فقط - سيظهر فيها الزر
        'admin/products.html',
        'admin/orders.html',
        'admin/contests.html',
        'admin/reports.html',
        'admin/did-you-know.html',
        'admin/notifications.html',
        'admin/reviews.html',
        'admin/users.html',
        'admin/ads.html',
        'admin/order-details.html',
        'admin/shipping.html',
        'admin/invoice.html',
        'admin/settings.html',
        'admin/map.html'
    ],
    hideOnPages: [
        // صفحات لن يظهر فيها الزر
        'admin/dashboard.html',
        'login.html',
        'index.html'
    ]
};

// ===== إنشاء الزر =====
function createDashboardBackButton() {
    // التحقق إذا كنا في صفحة يجب إخفاء الزر فيها
    const currentPage = window.location.pathname.split('/').pop();
    if (DASHBOARD_CONFIG.hideOnPages.includes(currentPage)) {
        return;
    }

    // التحقق إذا كان الزر موجود بالفعل
    if (document.querySelector('.dashboard-back-btn')) {
        return;
    }

    // إنشاء الزر
    const backBtn = document.createElement('a');
    backBtn.href = DASHBOARD_CONFIG.dashboardUrl;
    backBtn.className = 'dashboard-back-btn';
    backBtn.innerHTML = '<i class="fas fa-th-large"></i>';
    backBtn.title = 'العودة للوحة التحكم';
    backBtn.setAttribute('aria-label', 'العودة للوحة التحكم');

    // إضافة الأنماط
    const style = document.createElement('style');
    style.textContent = `
        .dashboard-back-btn {
            position: fixed;
            ${getPositionStyles()}
            background: linear-gradient(145deg, #d4af37, #aa8c2c);
            color: #1a0f00;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            font-size: 1.2rem;
            text-decoration: none;
            font-family: 'Font Awesome 6 Free', sans-serif;
            font-weight: 900;
        }

        .dashboard-back-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
            background: linear-gradient(145deg, #f3cf7a, #d4af37);
        }

        .dashboard-back-btn:active {
            transform: scale(0.95);
        }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(212, 175, 55, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(212, 175, 55, 0);
            }
        }

        .dashboard-back-btn.pulse {
            animation: pulse 2s infinite;
        }

        .dashboard-back-btn::after {
            content: 'العودة للوحة التحكم';
            position: absolute;
            bottom: -35px;
            left: 50%;
            transform: translateX(50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.8rem;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .dashboard-back-btn:hover::after {
            opacity: 1;
        }

        @media (max-width: 768px) {
            .dashboard-back-btn {
                width: 45px;
                height: 45px;
                font-size: 1rem;
            }
        }

        @media (min-width: 1024px) {
            .dashboard-back-btn {
                width: 60px;
                height: 60px;
                font-size: 1.4rem;
            }
        }
    `;

    // إضافة الأنماط للرأس
    if (!document.querySelector('style[data-dashboard-back-btn]')) {
        style.setAttribute('data-dashboard-back-btn', 'true');
        document.head.appendChild(style);
    }

    // إضافة الزر للصفحة
    document.body.appendChild(backBtn);

    // إضافة تأثير النبض عند التحميل
    setTimeout(() => {
        backBtn.classList.add('pulse');
        setTimeout(() => {
            backBtn.classList.remove('pulse');
        }, 3000);
    }, 1000);

    return backBtn;
}

// ===== الحصول على أنماط الموضع =====
function getPositionStyles() {
    const positions = {
        'top-right': 'top: 20px; right: 20px;',
        'top-left': 'top: 20px; left: 20px;',
        'bottom-right': 'bottom: 20px; right: 20px;',
        'bottom-left': 'bottom: 20px; left: 20px;'
    };
    return positions[DASHBOARD_CONFIG.buttonPosition] || positions['top-right'];
}

// ===== إزالة الزر =====
function removeDashboardBackButton() {
    const backBtn = document.querySelector('.dashboard-back-btn');
    if (backBtn) {
        backBtn.remove();
    }
}

// ===== تحديث موضع الزر =====
function updateButtonPosition(position) {
    const backBtn = document.querySelector('.dashboard-back-btn');
    if (backBtn) {
        DASHBOARD_CONFIG.buttonPosition = position;
        const style = document.querySelector('style[data-dashboard-back-btn]');
        if (style) {
            style.textContent = style.textContent.replace(/position:\s*fixed;\s*[^;]+;\s*[^;]+;/, `position: fixed; ${getPositionStyles()}`);
        }
    }
}

// ===== التحقق مما إذا كان يجب إظهار الزر =====
function shouldShowButton() {
    const currentPage = window.location.pathname.split('/').pop();

    // إخفاء في الصفحات المحددة
    if (DASHBOARD_CONFIG.hideOnPages.includes(currentPage)) {
        return false;
    }

    // التحقق من أن المستخدم هو admin
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.role !== 'admin') {
                return false; // إخفاء الزر إذا لم يكن admin
            }
        } catch (e) {
            return false;
        }
    } else {
        return false; // إخفاء الزر إذا لم يكن مسجل دخول
    }

    // إظهار في الصفحات المحددة فقط (صفحات الإدارة)
    if (DASHBOARD_CONFIG.showOnPages.length > 0) {
        return DASHBOARD_CONFIG.showOnPages.includes(currentPage);
    }

    return false;
}

// ===== التهيئة الرئيسية =====
function initDashboardBackButton() {
    if (shouldShowButton()) {
        createDashboardBackButton();
    }
}

// ===== تهيئة تلقائية =====
document.addEventListener('DOMContentLoaded', function () {
    initDashboardBackButton();
});

// ===== إعادة التهيئة عند تغيير الصفحة =====
window.addEventListener('popstate', function () {
    setTimeout(() => {
        removeDashboardBackButton();
        initDashboardBackButton();
    }, 100);
});

// ===== تصدير الدوال للاستخدام الخارجي =====
window.dashboardBackButton = {
    create: createDashboardBackButton,
    remove: removeDashboardBackButton,
    updatePosition: updateButtonPosition,
    init: initDashboardBackButton,
    config: DASHBOARD_CONFIG
};

// ===== إضافة Font Awesome إذا لم يكن موجوداً =====
function addFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        link.integrity = 'sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==';
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
        document.head.appendChild(link);
    }
}

// إضافة Font Awesome
addFontAwesome();
