/**
 * Modern Animations & Interactions
 * حركات وتفاعلات حديثة
 */

// ===== تهيئة الحركات عند التمرير =====
document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initParallaxEffects();
    initHoverEffects();
    initLoadingAnimations();
    initSmoothScroll();
});

// ===== حركات التمرير =====
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // إضافة حركات للعناصر
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ===== تأثيرات Parallax =====
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.parallax');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// ===== تأثيرات التمرير =====
function initHoverEffects() {
    // تأثيرات البطاقات
    const cards = document.querySelectorAll('.modern-card, .product-card-modern');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // تأثيرات الأزرار
    const buttons = document.querySelectorAll('.modern-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // تأثيرات الأيقونات
    const icons = document.querySelectorAll('.modern-icon');
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.animation = 'pulse 0.6s ease';
        });
    });
}

// ===== رسوم متحركة للتحميل =====
function initLoadingAnimations() {
    // إظهار/إخفاء التحميل
    window.showLoader = function() {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'loader-modern';
        loader.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
        `;
        document.body.appendChild(loader);
    };

    window.hideLoader = function() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    };
}

// ===== التمرير السلس =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// ===== إشعارات محسّنة =====
window.showModernNotification = function(message, type = 'success', duration = 3000) {
    // إزالة الإشعارات السابقة
    const existing = document.querySelector('.notification-modern');
    if (existing) {
        existing.remove();
    }

    // إنشاء إشعار جديد
    const notification = document.createElement('div');
    notification.className = `notification-modern ${type}`;
    
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };

    notification.innerHTML = `
        ${icons[type] || icons.info}
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // إزالة تلقائية
    setTimeout(() => {
        notification.style.animation = 'slideInDown 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, duration);
};

// ===== تأثيرات الكتابة =====
window.typeWriter = function(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
};

// ===== عداد متحرك =====
window.animateCounter = function(element, target, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.round(target).toLocaleString('ar-SA');
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current).toLocaleString('ar-SA');
        }
    }, 16);
};

// ===== تأثيرات الصور =====
function initImageEffects() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '0';
            this.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 100);
        });

        // تأثير التكبير عند التمرير
        img.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.transition = 'transform 0.3s ease';
        });

        img.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// ===== تأثيرات النماذج =====
function initFormEffects() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        // تأثير التركيز
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });

        // تأثير الكتابة
        input.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
}

// ===== تأثيرات القوائم =====
function initMenuEffects() {
    const menuItems = document.querySelectorAll('.nav-item-modern, .menu-item');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(-5px)';
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
}

// ===== تهيئة جميع التأثيرات =====
document.addEventListener('DOMContentLoaded', function() {
    initImageEffects();
    initFormEffects();
    initMenuEffects();
});

// ===== تأثيرات التحميل التدريجي =====
window.lazyLoad = function() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
};

// ===== تأثيرات الجسيمات =====
window.createParticles = function(container, count = 50) {
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
    `;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--primary-gold);
            border-radius: 50%;
            opacity: 0.3;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        particleContainer.appendChild(particle);
    }

    container.style.position = 'relative';
    container.appendChild(particleContainer);
};











