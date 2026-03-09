/**
 * Realistic Honey Drips Generator
 * مولد قطرات العسل الواقعية
 * باستخدام فيزياء حقيقية
 */

class RealisticHoneyDrips {
    constructor(containerId = 'honey-drips-container') {
        this.container = document.getElementById(containerId);
        this.drips = [];
        this.isRunning = false;
        this.intervalId = null;
        
        // إعدادات القطرات
        this.settings = {
            minInterval: 600,      // أقل فترة بين القطرات (ملي ثانية)
            maxInterval: 2000,     // أقصى فترة بين القطرات (ملي ثانية)
            minSize: 8,            // أصغر حجم للقطرة (بكسل)
            maxSize: 20,           // أكبر حجم للقطرة (بكسل)
            minSpeed: 3.5,         // أبطأ سرعة (ثواني)
            maxSpeed: 5.5,         // أسرع سرعة (ثواني)
            maxDrips: 12,          // أقصى عدد من القطرات في نفس الوقت
            spawnArea: {           // منطقة ظهور القطرات
                left: 3,           // من اليسار (%)
                right: 97          // إلى اليمين (%)
            }
        };
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.warn('Honey drips container not found');
            return;
        }
        
        // إنشاء القطرات الأولية
        this.createInitialDrips();
        
        // بدء إنشاء القطرات المستمرة
        this.start();
    }
    
    /**
     * إنشاء القطرات الأولية
     */
    createInitialDrips() {
        const initialCount = 4;
        for (let i = 0; i < initialCount; i++) {
            setTimeout(() => {
                this.createDrip();
            }, i * 800);
        }
    }
    
    /**
     * بدء إنشاء القطرات
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.scheduleNextDrip();
    }
    
    /**
     * إيقاف إنشاء القطرات
     */
    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }
    
    /**
     * جدولة القطرة التالية
     */
    scheduleNextDrip() {
        if (!this.isRunning) return;
        
        // التحقق من عدد القطرات الحالية
        if (this.drips.length >= this.settings.maxDrips) {
            // انتظار حتى تقل القطرات
            this.intervalId = setTimeout(() => {
                this.scheduleNextDrip();
            }, 500);
            return;
        }
        
        // حساب الوقت العشوائي للقطرة التالية
        const delay = this.randomBetween(
            this.settings.minInterval,
            this.settings.maxInterval
        );
        
        this.intervalId = setTimeout(() => {
            this.createDrip();
            this.scheduleNextDrip();
        }, delay);
    }
    
    /**
     * إنشاء قطرة جديدة
     */
    createDrip() {
        // إنشاء عنصر القطرة
        const drip = document.createElement('div');
        drip.className = 'honey-drip-realistic';
        
        // تحديد حجم القطرة
        const size = this.randomBetween(
            this.settings.minSize,
            this.settings.maxSize
        );
        
        // تحديد نوع القطرة حسب الحجم
        let sizeClass = 'drip-medium';
        if (size <= 10) {
            sizeClass = 'drip-small';
        } else if (size <= 14) {
            sizeClass = 'drip-medium';
        } else if (size <= 18) {
            sizeClass = 'drip-large';
        } else {
            sizeClass = 'drip-xlarge';
        }
        drip.classList.add(sizeClass);
        
        // تحديد موقع القطرة (عشوائي)
        const leftPosition = this.randomBetween(
            this.settings.spawnArea.left,
            this.settings.spawnArea.right
        );
        drip.style.left = `${leftPosition}%`;
        
        // تحديد السرعة (عشوائية)
        const speed = this.randomBetween(
            this.settings.minSpeed,
            this.settings.maxSpeed
        );
        
        // تطبيق السرعة على الحركة - استخدام الحركات فائقة الواقعية
        const animationName = sizeClass === 'drip-small' ? 'ultra-realistic-honey-drip-fast' :
                            sizeClass === 'drip-large' || sizeClass === 'drip-xlarge' ? 'ultra-realistic-honey-drip-slow' :
                            'ultra-realistic-honey-drip';
        
        // استخدام cubic-bezier واقعي للعسل (لزوجة عالية) - حركة شفافة
        const easing = sizeClass === 'drip-small' ? 'cubic-bezier(0.4, 0, 0.6, 1)' :
                      sizeClass === 'drip-large' || sizeClass === 'drip-xlarge' ? 'cubic-bezier(0.35, 0, 0.65, 1)' :
                      'cubic-bezier(0.38, 0, 0.62, 1)';
        
        drip.style.animation = `${animationName} ${speed}s ${easing} forwards`;
        
        // إضافة القطرة إلى الحاوية
        this.container.appendChild(drip);
        
        // إضافة القطرة إلى القائمة
        this.drips.push(drip);
        
        // إزالة القطرة بعد انتهاء الحركة
        setTimeout(() => {
            this.removeDrip(drip);
        }, speed * 1000 + 500);
    }
    
    /**
     * إزالة قطرة
     */
    removeDrip(drip) {
        // إزالة من القائمة
        const index = this.drips.indexOf(drip);
        if (index > -1) {
            this.drips.splice(index, 1);
        }
        
        // إزالة من DOM
        if (drip.parentNode) {
            drip.style.opacity = '0';
            drip.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (drip.parentNode) {
                    drip.remove();
                }
            }, 300);
        }
    }
    
    /**
     * إنشاء عدد محدد من القطرات دفعة واحدة
     */
    createBurst(count = 5) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createDrip();
            }, i * 200);
        }
    }
    
    /**
     * تحديث الإعدادات
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
    
    /**
     * عدد عشوائي بين قيمتين
     */
    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * تنظيف جميع القطرات
     */
    clear() {
        this.drips.forEach(drip => {
            if (drip.parentNode) {
                drip.remove();
            }
        });
        this.drips = [];
    }
    
    /**
     * إعادة التشغيل
     */
    restart() {
        this.stop();
        this.clear();
        this.start();
    }
}

// تهيئة تلقائية عند تحميل الصفحة
let honeyDripsInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    // إنشاء مثيل جديد
    honeyDripsInstance = new RealisticHoneyDrips('honey-drips-container');
    
    // جعل المثيل متاحاً عالمياً
    window.honeyDrips = honeyDripsInstance;
    
    // إضافة تأثيرات إضافية عند التمرير
    let lastScrollY = window.scrollY;
    let scrollTimeout = null;
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        const scrollDelta = Math.abs(currentScrollY - lastScrollY);
        
        // إنشاء قطرات إضافية عند التمرير السريع (مع debounce)
        if (scrollDelta > 80 && honeyDripsInstance) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (honeyDripsInstance && honeyDripsInstance.drips.length < 8) {
                    honeyDripsInstance.createBurst(1);
                }
            }, 300);
        }
        
        lastScrollY = currentScrollY;
    });
    
    // إضافة تأثيرات عند تحميل الصفحة
    setTimeout(() => {
        if (honeyDripsInstance) {
            honeyDripsInstance.createBurst(2);
        }
    }, 2500);
});

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealisticHoneyDrips;
}
