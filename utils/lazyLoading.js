/**
 * Lazy Loading Utility
 * تحميل الصور والمحتوى عند الحاجة لتحسين الأداء
 */

const LAZY_LOADING_CONFIG = {
    enabled: true,
    threshold: 0.1, // 10% من العنصر يجب أن يكون ظاهراً
    rootMargin: '50px', // بدء التحميل قبل 50px من العنصر
    loadingClass: 'lazy-loading',
    loadedClass: 'lazy-loaded',
    errorClass: 'lazy-error',
    placeholderColor: '#f0f0f0',
    placeholderIcon: '📷',
    retryAttempts: 3,
    retryDelay: 1000 // 1 ثانية
};

/**
 * تهيئة Lazy Loading
 */
const initLazyLoading = () => {
    if (!LAZY_LOADING_CONFIG.enabled || !('IntersectionObserver' in window)) {
        console.warn('⚠️ Lazy Loading not supported');
        return;
    }

    // تهيئة Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadElement(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: LAZY_LOADING_CONFIG.threshold,
        rootMargin: LAZY_LOADING_CONFIG.rootMargin
    });

    // مراقبة جميع العناصر التي تحتوي على data-lazy
    const lazyElements = document.querySelectorAll('[data-lazy]');
    lazyElements.forEach(element => {
        // إضافة placeholder
        addPlaceholder(element);
        
        // بدء المراقبة
        observer.observe(element);
    });

    console.log(`🔍 Lazy Loading initialized for ${lazyElements.length} elements`);
};

/**
 * تحميل العنصر
 */
const loadElement = async (element) => {
    const src = element.dataset.lazy;
    const type = element.tagName.toLowerCase();
    
    try {
        element.classList.add(LAZY_LOADING_CONFIG.loadingClass);
        
        if (type === 'img') {
            await loadImage(element, src);
        } else if (type === 'video') {
            await loadVideo(element, src);
        } else if (type === 'iframe') {
            await loadIframe(element, src);
        } else {
            await loadBackground(element, src);
        }
        
        element.classList.remove(LAZY_LOADING_CONFIG.loadingClass);
        element.classList.add(LAZY_LOADING_CONFIG.loadedClass);
        
        // إزالة placeholder
        removePlaceholder(element);
        
    } catch (error) {
        console.error('❌ Failed to load element:', error);
        element.classList.remove(LAZY_LOADING_CONFIG.loadingClass);
        element.classList.add(LAZY_LOADING_CONFIG.errorClass);
        
        // إعادة المحاولة
        retryLoad(element, src);
    }
};

/**
 * تحميل الصورة
 */
const loadImage = (element, src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            element.src = src;
            resolve();
        };
        
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${src}`));
        };
        
        img.src = src;
    });
};

/**
 * تحميل الفيديو
 */
const loadVideo = (element, src) => {
    return new Promise((resolve, reject) => {
        element.src = src;
        element.onload = resolve;
        element.onerror = () => reject(new Error(`Failed to load video: ${src}`));
    });
};

/**
 * تحميل iframe
 */
const loadIframe = (element, src) => {
    return new Promise((resolve, reject) => {
        element.src = src;
        element.onload = resolve;
        element.onerror = () => reject(new Error(`Failed to load iframe: ${src}`));
    });
};

/**
 * تحميل الخلفية
 */
const loadBackground = (element, src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            element.style.backgroundImage = `url(${src})`;
            resolve();
        };
        
        img.onerror = () => {
            reject(new Error(`Failed to load background: ${src}`));
        };
        
        img.src = src;
    });
};

/**
 * إضافة placeholder
 */
const addPlaceholder = (element) => {
    const type = element.tagName.toLowerCase();
    
    if (type === 'img') {
        // الحفاظ على الأبعاد الأصلية
        const width = element.getAttribute('width') || '300';
        const height = element.getAttribute('height') || '200';
        
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        element.style.backgroundColor = LAZY_LOADING_CONFIG.placeholderColor;
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.fontSize = '48px';
        element.style.color = '#999';
        element.textContent = LAZY_LOADING_CONFIG.placeholderIcon;
        
        // إضافة data-original للحفاظ على الأبعاد
        element.dataset.originalWidth = width;
        element.dataset.originalHeight = height;
    } else if (type === 'video') {
        const width = element.getAttribute('width') || '300';
        const height = element.getAttribute('height') || '200';
        
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        element.style.backgroundColor = LAZY_LOADING_CONFIG.placeholderColor;
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.fontSize = '48px';
        element.style.color = '#999';
        element.innerHTML = `<i class="fas fa-play-circle"></i>`;
    }
};

/**
 * إزالة placeholder
 */
const removePlaceholder = (element) => {
    const type = element.tagName.toLowerCase();
    
    if (type === 'img') {
        // استعادة الأبعاد الأصلية
        if (element.dataset.originalWidth) {
            element.style.width = element.dataset.originalWidth + 'px';
            delete element.dataset.originalWidth;
        }
        
        if (element.dataset.originalHeight) {
            element.style.height = element.dataset.originalHeight + 'px';
            delete element.dataset.originalHeight;
        }
        
        // إزالة الأنماط المؤقتة
        element.style.backgroundColor = '';
        element.style.display = '';
        element.style.alignItems = '';
        element.style.justifyContent = '';
        element.style.fontSize = '';
        element.style.color = '';
        element.textContent = '';
    } else if (type === 'video') {
        element.style.backgroundColor = '';
        element.style.display = '';
        element.style.alignItems = '';
        element.style.justifyContent = '';
        element.style.fontSize = '';
        element.style.color = '';
        element.innerHTML = '';
    }
};

/**
 * إعادة محاولة التحميل
 */
const retryLoad = (element, src) => {
    let attempts = parseInt(element.dataset.retryAttempts || '0');
    
    if (attempts < LAZY_LOADING_CONFIG.retryAttempts) {
        attempts++;
        element.dataset.retryAttempts = attempts.toString();
        
        setTimeout(() => {
            console.log(`🔄 Retrying load (${attempts}/${LAZY_LOADING_CONFIG.retryAttempts}):`, src);
            loadElement(element);
        }, LAZY_LOADING_CONFIG.retryDelay * attempts);
    } else {
        console.error(`❌ Failed to load after ${LAZY_LOADING_CONFIG.retryAttempts} attempts:`, src);
        element.classList.add(LAZY_LOADING_CONFIG.errorClass);
    }
};

/**
 * تحميل تدريجي للصور
 */
const progressiveImageLoading = (imgElement) => {
    const src = imgElement.dataset.lazy;
    
    if (!src) return;
    
    // تحميل صورة صغيرة أولاً
    const smallSrc = getResponsiveImage(src, 'small');
    const mediumSrc = getResponsiveImage(src, 'medium');
    const largeSrc = getResponsiveImage(src, 'large');
    
    // تحميل الصورة الصغيرة
    imgElement.src = smallSrc;
    imgElement.classList.add('progressive-loading');
    
    // تحميل الصورة المتوسطة في الخلفية
    const mediumImg = new Image();
    mediumImg.onload = () => {
        setTimeout(() => {
            imgElement.src = mediumSrc;
        }, 500);
    };
    mediumImg.src = mediumSrc;
    
    // تحميل الصورة الكبيرة في الخلفية
    const largeImg = new Image();
    largeImg.onload = () => {
        setTimeout(() => {
            imgElement.src = largeSrc;
            imgElement.classList.remove('progressive-loading');
        }, 1500);
    };
    largeImg.src = largeSrc;
};

/**
 * الحصول على الصورة المناسبة حسب الشاشة
 */
const getResponsiveImage = (src, size) => {
    // إضافة حجم الصورة للرابط
    const extension = src.split('.').pop();
    const baseSrc = src.substring(0, src.lastIndexOf('.'));
    
    switch (size) {
        case 'small':
            return `${baseSrc}-small.${extension}`;
        case 'medium':
            return `${baseSrc}-medium.${extension}`;
        case 'large':
            return `${baseSrc}-large.${extension}`;
        default:
            return src;
    }
};

/**
 * تحسين أداء التمرير
 */
const optimizeScrollPerformance = () => {
    let ticking = false;
    
    const requestTick = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                // تحديث العناصر المرئية فقط
                updateVisibleElements();
                ticking = false;
            });
            ticking = true;
        }
    };
    
    // مراقبة التمرير
    window.addEventListener('scroll', requestTick);
    window.addEventListener('resize', requestTick);
};

/**
 * تحديث العناصر المرئية
 */
const updateVisibleElements = () => {
    const lazyElements = document.querySelectorAll('[data-lazy]:not(.lazy-loaded):not(.lazy-loading)');
    
    lazyElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
        
        if (isVisible) {
            loadElement(element);
        }
    });
};

/**
 * تهيئة Lazy Loading للصور في المنتجات
 */
const initProductImagesLazyLoading = () => {
    const productImages = document.querySelectorAll('.product-image[data-lazy]');
    
    productImages.forEach(img => {
        // إضافة مؤشر تحميل
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'image-loading-indicator';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // إضافة المؤشر بعد الصورة
        img.parentNode.insertBefore(loadingIndicator, img.nextSibling);
        
        // إزالة المؤشر عند التحميل
        img.addEventListener('load', () => {
            loadingIndicator.remove();
        });
        
        img.addEventListener('error', () => {
            loadingIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        });
    });
};

/**
 * تحميل الصور عند التمرير السريع
 */
const handleFastScrolling = () => {
    let scrollTimeout;
    let lastScrollTime = 0;
    
    window.addEventListener('scroll', () => {
        const currentTime = Date.now();
        
        // التحقق من التمرير السريع
        if (currentTime - lastScrollTime < 100) {
            clearTimeout(scrollTimeout);
            
            // تأخير التحميل عند التمرير السريع
            scrollTimeout = setTimeout(() => {
                updateVisibleElements();
            }, 200);
        }
        
        lastScrollTime = currentTime;
    });
};

/**
 * إضافة أنماط CSS للـ Lazy Loading
 */
const addLazyLoadingStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .lazy-loading {
            opacity: 0.5;
            transition: opacity 0.3s ease;
        }
        
        .lazy-loaded {
            opacity: 1;
            transition: opacity 0.3s ease;
        }
        
        .lazy-error {
            opacity: 0.3;
            filter: grayscale(100%);
        }
        
        .progressive-loading {
            filter: blur(2px);
            transition: filter 0.5s ease;
        }
        
        .image-loading-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--gold, #d4af37);
            font-size: 20px;
            z-index: 10;
        }
        
        [data-lazy] {
            transition: all 0.3s ease;
        }
    `;
    
    document.head.appendChild(style);
};

// تهيئة Lazy Loading عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    addLazyLoadingStyles();
    initLazyLoading();
    initProductImagesLazyLoading();
    optimizeScrollPerformance();
    handleFastScrolling();
});

// تصدير الدوال للاستخدام في أماكن أخرى
module.exports = {
    initLazyLoading,
    loadElement,
    progressiveImageLoading,
    getResponsiveImage,
    LAZY_LOADING_CONFIG
};
