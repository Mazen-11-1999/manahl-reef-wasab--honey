/**
 * API Client
 * عميل API موحد للاتصال بالـ Backend
 */

// تجنب إعادة التنفيذ إذا كان API موجوداً بالفعل
if (window.API && window.API_BASE_URL) {
    // API محمّل بالفعل - لا حاجة لإعادة التنفيذ
    console.log('[API] API already loaded, skipping re-initialization');
} else {
    // تنفيذ API لأول مرة
    (function() {
        'use strict';
        
        const API_BASE_URL = window.location.origin;

/** مسارات لوحة التحكم — يجب استخدام adminToken وليس توكن العميل */
function isAdminArea() {
    try {
        const p = window.location.pathname || '';
        return p.includes('/admin/') || /\/admin\//.test(p) || p.endsWith('/admin');
    } catch (e) {
        return false;
    }
}

// Token management — يُخزَّن التوكن فقط، ولا يُخزَّن أبداً كلمة المرور (لأمان أدوات المطور والمتصفح)
// لا تخلط: توكن العميل (authToken) وتوكن المشرف (adminToken) — كان setAuthToken يكتب على الاثنين فيفسد الدخول للإدارة
let authToken = localStorage.getItem('authToken') || null;

/**
 * تعيين Token (عادة جلسة العميل). للمشرف استخدم { asAdmin: true } من صفحة الدخول الإدارية.
 */
function setAuthToken(token, opts) {
    const asAdmin = opts && opts.asAdmin === true;
    authToken = token || null;
    if (token) {
        localStorage.setItem('authToken', token);
        if (asAdmin) {
            localStorage.setItem('adminToken', token);
            localStorage.setItem('isAdmin', 'true');
        }
    } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('customerDisplayName');
    }
}

/**
 * الحصول على Token المناسب للصفحة الحالية (مشرف في /admin/، عميل في المتجر)
 */
function getAuthToken() {
    try {
        if (isAdminArea() && localStorage.getItem('isAdmin') === 'true') {
            const at = localStorage.getItem('adminToken');
            if (at) return at;
        }
    } catch (e) { /* ignore */ }
    return authToken || localStorage.getItem('authToken') || localStorage.getItem('adminToken');
}

/**
 * Request helper
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    const doRequest = async () => {
        let response;
        try {
            response = await fetch(url, finalOptions);
        } catch (e) {
            throw new Error('تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.');
        }
        const text = (await response.text()).trim();
        let data = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (parseErr) {
                if (!response.ok) {
                    if ([502, 503, 504].includes(response.status)) {
                        throw new Error('الخدمة غير متاحة مؤقتاً. جرّب بعد لحظات.');
                    }
                    throw new Error(`تعذر معالجة رد الخادم (${response.status}). حاول مرة أخرى.`);
                }
                throw new Error('استجابة غير متوقعة من الخادم.');
            }
        }
        if (!response.ok) {
            const msg = data && data.message ? String(data.message) : '';
            if (response.status === 429) {
                throw new Error(msg || 'طلبات كثيرة. انتظر دقيقة ثم أعد المحاولة.');
            }
            if (response.status === 503 || response.status === 502 || response.status === 504) {
                throw new Error(msg || 'الخدمة غير متاحة مؤقتاً. جرّب لاحقاً.');
            }
            throw new Error(msg || 'حدث خطأ في الطلب');
        }
        return data;
    };

    try {
        return await doRequest();
    } catch (error) {
        const isRetryable = error.message && (
            error.message.includes('كثيرة') ||
            error.message.includes('غير متاحة') ||
            error.message.includes('تعذر الاتصال') ||
            error.message.includes('مؤقتاً') ||
            (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network')))
        );
        if (isRetryable) {
            await new Promise(r => setTimeout(r, 2000));
            return await doRequest();
        }
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Authentication API
 */
const authAPI = {
    login: async (username, password) => {
        const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.token) {
            setAuthToken(data.token);
        }
        
        return data;
    },

    /** تسجيل عميل جديد: هاتف + اسم + كلمة مرور */
    registerCustomer: async (phone, name, password) => {
        const data = await apiRequest('/api/auth/register-customer', {
            method: 'POST',
            body: JSON.stringify({ phone, name, password })
        });
        
        if (data.token) {
            setAuthToken(data.token);
        }
        
        return data;
    },

    logout: () => {
        setAuthToken(null);
    },

    getMe: async () => {
        return await apiRequest('/api/auth/me');
    },

    /** طلب رابط استعادة كلمة المرور: { email } أو { phone } */
    forgotPassword: async (payload) => {
        return await apiRequest('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    /** إعادة التعيين برمز من الرابط */
    resetPassword: async (token, password) => {
        return await apiRequest('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password })
        });
    }
};

/**
 * Products API
 */
const productsAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/products${queryString ? '?' + queryString : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/api/products/${id}`);
    },

    create: async (productData, imageFile) => {
        const formData = new FormData();
        Object.keys(productData).forEach(key => {
            formData.append(key, productData[key]);
        });
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const token = getAuthToken();
        return await fetch(`${API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        }).then(res => res.json());
    },

    update: async (id, productData, imageFile) => {
        const formData = new FormData();
        Object.keys(productData).forEach(key => {
            formData.append(key, productData[key]);
        });
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const token = getAuthToken();
        return await fetch(`${API_BASE_URL}/api/products/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        }).then(res => res.json());
    },

    delete: async (id) => {
        return await apiRequest(`/api/products/${id}`, {
            method: 'DELETE'
        });
    }
};

/**
 * Orders API
 */
const ordersAPI = {
    create: async (orderData) => {
        return await apiRequest('/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/orders${queryString ? '?' + queryString : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/api/orders/${id}`);
    },

    getByOrderId: async (orderId) => {
        return await apiRequest(`/api/orders/track/${orderId}`);
    },

    update: async (id, orderData) => {
        return await apiRequest(`/api/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(orderData)
        });
    },

    updateStatus: async (id, status, notes) => {
        return await apiRequest(`/api/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, notes })
        });
    },

    uploadShippingReceipt: async (id, receiptFile) => {
        const formData = new FormData();
        formData.append('receipt', receiptFile);

        const token = getAuthToken();
        return await fetch(`${API_BASE_URL}/api/orders/${id}/shipping-receipt`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        }).then(res => res.json());
    },

    addPayment: async (id, amount, method = 'cash', notes = '') => {
        return await apiRequest(`/api/orders/${id}/payment`, {
            method: 'POST',
            body: JSON.stringify({ amount, method, notes })
        });
    },

    // الطلبات المسبقة
    createPreOrder: async (orderData) => {
        return await apiRequest('/api/orders/preorder', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    getPreOrders: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/orders/preorders${queryString ? '?' + queryString : ''}`);
    },

    markAsHarvested: async (id) => {
        return await apiRequest(`/api/orders/preorders/${id}/harvested`, {
            method: 'PUT'
        });
    },

    // التوصيل الجماعي
    createGroupDelivery: async (groupData) => {
        return await apiRequest('/api/orders/group-delivery', {
            method: 'POST',
            body: JSON.stringify(groupData)
        });
    },

    getGroupDeliveries: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/orders/group-delivery${queryString ? '?' + queryString : ''}`);
    },

    getGroupDelivery: async (id) => {
        return await apiRequest(`/api/orders/group-delivery/${id}`);
    },

    updateGroupDeliveryStatus: async (id, status, notes = '') => {
        return await apiRequest(`/api/orders/group-delivery/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, notes })
        });
    },

    addOrderToGroup: async (groupId, orderId) => {
        return await apiRequest(`/api/orders/group-delivery/${groupId}/orders`, {
            method: 'POST',
            body: JSON.stringify({ orderId })
        });
    },

    removeOrderFromGroup: async (groupId, orderId) => {
        return await apiRequest(`/api/orders/group-delivery/${groupId}/orders`, {
            method: 'DELETE',
            body: JSON.stringify({ orderId })
        });
    }
};

/**
 * Contests API
 */
const contestsAPI = {
    getAll: async () => {
        return await apiRequest('/api/contests');
    },

    getById: async (id) => {
        return await apiRequest(`/api/contests/${id}`);
    },

    create: async (contestData) => {
        return await apiRequest('/api/contests', {
            method: 'POST',
            body: JSON.stringify(contestData)
        });
    },

    update: async (id, contestData) => {
        return await apiRequest(`/api/contests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(contestData)
        });
    },

    delete: async (id) => {
        return await apiRequest(`/api/contests/${id}`, {
            method: 'DELETE'
        });
    },

    participate: async (contestId, participantData) => {
        return await apiRequest(`/api/contests/${contestId}/participate`, {
            method: 'POST',
            body: JSON.stringify(participantData)
        });
    },

    verifyFollow: async (contestId, verificationData) => {
        return await apiRequest(`/api/contests/${contestId}/verify-follow`, {
            method: 'POST',
            body: JSON.stringify(verificationData)
        });
    },

    verifyShare: async (contestId, shareData) => {
        return await apiRequest(`/api/contests/${contestId}/verify-share`, {
            method: 'POST',
            body: JSON.stringify(shareData)
        });
    },

    drawWinner: async (contestId, count = 1, announcementMessage) => {
        return await apiRequest(`/api/contests/${contestId}/draw`, {
            method: 'POST',
            body: JSON.stringify({ count, announcementMessage })
        });
    },

    getWinners: async () => {
        return await apiRequest('/api/contests/winners');
    },

    runAutoDraw: async () => {
        return await apiRequest('/api/contests/run-auto-draw', { method: 'POST' });
    }
};

/**
 * Contest Settings API (إعدادات المسابقات - للمالك فقط)
 */
const contestSettingsAPI = {
    get: async () => {
        return await apiRequest('/api/contest-settings');
    },
    update: async (settings) => {
        return await apiRequest('/api/contest-settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }
};

/**
 * Did You Know API
 */
const didYouKnowAPI = {
    getAll: async () => {
        return await apiRequest('/api/did-you-know');
    },

    create: async (itemData) => {
        return await apiRequest('/api/did-you-know', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    },

    update: async (id, itemData) => {
        return await apiRequest(`/api/did-you-know/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
    },

    delete: async (id) => {
        return await apiRequest(`/api/did-you-know/${id}`, {
            method: 'DELETE'
        });
    }
};

/**
 * Stats API
 */
const statsAPI = {
    getStats: async () => {
        return await apiRequest('/api/stats');
    }
};

/**
 * Customers API
 */
const customersAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/customers/all${queryString ? '?' + queryString : ''}`);
    },

    getProfile: async () => {
        return await apiRequest('/api/customers/profile');
    },

    /** رفع صورة الملف الشخصي — تُحفظ في الخادم وقاعدة البيانات بشكل دائم */
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/customers/profile/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'فشل رفع الصورة');
        return data;
    },
    
    updateProfile: async (profileData) => {
        return await apiRequest('/api/customers/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },
    
    getStats: async () => {
        return await apiRequest('/api/customers/stats');
    },
    
    getWishlist: async () => {
        return await apiRequest('/api/customers/wishlist');
    },
    
    addToWishlist: async (productId) => {
        return await apiRequest('/api/customers/wishlist', {
            method: 'POST',
            body: JSON.stringify({ productId })
        });
    },
    
    removeFromWishlist: async (productId) => {
        return await apiRequest(`/api/customers/wishlist/${productId}`, {
            method: 'DELETE'
        });
    },
    
    updateVipStatus: async (customerId, isVip) => {
        return await apiRequest(`/api/customers/${customerId}/vip`, {
            method: 'PUT',
            body: JSON.stringify({ isVip })
        });
    },

    updateBadge: async (customerId, badgeType) => {
        return await apiRequest(`/api/customers/${customerId}/badge`, {
            method: 'PUT',
            body: JSON.stringify({ badgeType })
        });
    }
};

/**
 * Notifications API
 */
const notificationsAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/notifications${queryString ? '?' + queryString : ''}`);
    },

    getUnreadCount: async () => {
        return await apiRequest('/api/notifications/unread-count');
    },

    markAsRead: async (id) => {
        return await apiRequest(`/api/notifications/${id}/read`, {
            method: 'PUT'
        });
    },

    markAllAsRead: async () => {
        return await apiRequest('/api/notifications/read-all', {
            method: 'PUT'
        });
    },

    // إرسال إشعار جماعي (للمشرفين فقط)
    sendBulk: async (title, message, options = {}) => {
        return await apiRequest('/api/notifications/send-bulk', {
            method: 'POST',
            body: JSON.stringify({
                title,
                message,
                audience: options.audience || 'all',
                type: options.type || 'system_announcement',
                priority: options.priority || 'normal'
            })
        });
    }
};

/**
 * Health Info API
 * API للمعلومات الطبية - صيدلية ريف وصاب الطبيعية
 */
const healthInfoAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/health-info${queryString ? '?' + queryString : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/api/health-info/${id}`);
    },

    getStats: async () => {
        return await apiRequest('/api/health-info/stats');
    },

    like: async (id) => {
        return await apiRequest(`/api/health-info/${id}/like`, {
            method: 'POST'
        });
    },

    // Admin APIs
    create: async (healthInfoData) => {
        return await apiRequest('/api/health-info', {
            method: 'POST',
            body: JSON.stringify(healthInfoData)
        });
    },

    update: async (id, healthInfoData) => {
        return await apiRequest(`/api/health-info/${id}`, {
            method: 'PUT',
            body: JSON.stringify(healthInfoData)
        });
    },

    delete: async (id) => {
        return await apiRequest(`/api/health-info/${id}`, {
            method: 'DELETE'
        });
    }
};

/**
 * Reviews API
 */
const reviewsAPI = {
    getProductReviews: async (productId, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/reviews/product/${productId}${queryString ? '?' + queryString : ''}`);
    },
    
    create: async (productId, reviewData) => {
        return await apiRequest(`/api/reviews/product/${productId}`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    },
    
    update: async (reviewId, reviewData) => {
        return await apiRequest(`/api/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify(reviewData)
        });
    },
    
    delete: async (reviewId) => {
        return await apiRequest(`/api/reviews/${reviewId}`, {
            method: 'DELETE'
        });
    },
    
    markHelpful: async (reviewId) => {
        return await apiRequest(`/api/reviews/${reviewId}/helpful`, {
            method: 'POST'
        });
    },
    
    markNotHelpful: async (reviewId) => {
        return await apiRequest(`/api/reviews/${reviewId}/not-helpful`, {
            method: 'POST'
        });
    },
    
    // Admin APIs
    approve: async (reviewId) => {
        return await apiRequest(`/api/reviews/${reviewId}/approve`, {
            method: 'POST'
        });
    },
    
    reject: async (reviewId) => {
        return await apiRequest(`/api/reviews/${reviewId}/reject`, {
            method: 'POST'
        });
    },
    
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/reviews${queryString ? '?' + queryString : ''}`);
    }
};

/**
 * Map API
 */
const mapAPI = {
    getMapData: async () => {
        return await apiRequest('/api/map');
    }
};

/**
 * Stories API
 */
const storiesAPI = {
    getStories: async () => {
        return await apiRequest('/api/stories/stories');
    },
    
    getAds: async (position = null) => {
        const queryString = position ? `?position=${position}` : '';
        return await apiRequest(`/api/stories/ads${queryString}`);
    },
    
    getStory: async (id) => {
        return await apiRequest(`/api/stories/${id}`);
    },
    
    likeStory: async (id) => {
        return await apiRequest(`/api/stories/${id}/like`, {
            method: 'POST'
        });
    },
    
    unlikeStory: async (id) => {
        return await apiRequest(`/api/stories/${id}/like`, {
            method: 'DELETE'
        });
    },
    
    addComment: async (id, text, parentCommentId = null) => {
        const body = { text };
        if (parentCommentId) body.parentCommentId = parentCommentId;
        return await apiRequest(`/api/stories/${id}/comment`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    toggleCommentLike: async (storyId, commentId) => {
        return await apiRequest(`/api/stories/${storyId}/comment/${commentId}/like`, {
            method: 'POST'
        });
    },
    
    deleteComment: async (storyId, commentId) => {
        return await apiRequest(`/api/stories/${storyId}/comment/${commentId}`, {
            method: 'DELETE'
        });
    },
    
    // Admin APIs
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/stories/admin/all${queryString ? '?' + queryString : ''}`);
    },

    /** رفع صورة أو فيديو من المعرض/الكاميرا — يُستخدم قبل create لربط الرابط بالحالة/الإعلان */
    uploadMedia: async (file) => {
        const formData = new FormData();
        formData.append('media', file);
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/stories/admin/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'فشل رفع الملف');
        return data;
    },
    
    create: async (storyData) => {
        return await apiRequest('/api/stories/admin/create', {
            method: 'POST',
            body: JSON.stringify(storyData)
        });
    },
    
    update: async (id, storyData) => {
        return await apiRequest(`/api/stories/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(storyData)
        });
    },
    
    delete: async (id) => {
        return await apiRequest(`/api/stories/admin/${id}`, {
            method: 'DELETE'
        });
    }
};

/**
 * Categories API - إدارة الفئات
 */
const categoriesAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/api/categories${queryString ? '?' + queryString : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/api/categories/${id}`);
    },

    create: async (formData) => {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData // FormData for file upload
        });
        return await response.json();
    },

    update: async (id, formData) => {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData // FormData for file upload
        });
        return await response.json();
    },

    delete: async (id) => {
        return await apiRequest(`/api/categories/${id}`, {
            method: 'DELETE'
        });
    }
};

        // Export
        window.API = {
            auth: authAPI,
            products: productsAPI,
            orders: ordersAPI,
            contests: contestsAPI,
            contestSettings: contestSettingsAPI,
            didYouKnow: didYouKnowAPI,
            healthInfo: healthInfoAPI,
            siteBanner: {
                getPublic: async () => {
                    const url = `${API_BASE_URL}/api/site-banner/public`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'فشل جلب الشريط');
                    return data;
                },
                get: async () => await apiRequest('/api/site-banner'),
                update: async (data) => await apiRequest('/api/site-banner', { method: 'PUT', body: JSON.stringify(data) })
            },
            siteSettings: {
                getPublic: async () => {
                    const url = `${API_BASE_URL}/api/site-settings/public`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'فشل جلب الإعدادات');
                    return data;
                },
                get: async () => await apiRequest('/api/site-settings'),
                update: async (data) => await apiRequest('/api/site-settings', { method: 'PUT', body: JSON.stringify(data) }),
                uploadLogo: async (file) => {
                    const formData = new FormData();
                    formData.append('logo', file);
                    const token = getAuthToken();
                    const res = await fetch(`${API_BASE_URL}/api/site-settings/logo`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'فشل رفع الشعار');
                    return data;
                },
                /** رفع صور معرض قصتنا (حتى 6) - FormData مع الحقل images[] أو image0..image5 */
                uploadStoryGallery: async (formData) => {
                    const token = getAuthToken();
                    const res = await fetch(`${API_BASE_URL}/api/site-settings/story-gallery`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'فشل رفع صور المعرض');
                    return data;
                },
                reset: async () => await apiRequest('/api/site-settings/reset', { method: 'POST' })
            },
            stats: statsAPI,
            customers: customersAPI,
            notifications: notificationsAPI,
            stories: storiesAPI,
            reviews: reviewsAPI,
            map: mapAPI,
            categories: categoriesAPI,
            backup: {
                createDatabase: () => apiRequest('/api/backup/database', { method: 'POST' }),
                createFull: () => apiRequest('/api/backup/full', { method: 'POST' }),
                list: (type) => apiRequest('/api/backup/list' + (type ? '?type=' + type : '')),
                restore: (filename) => apiRequest('/api/backup/restore', { method: 'POST', body: JSON.stringify({ filename }) }),
                stats: () => apiRequest('/api/backup/stats'),
                downloadUrl: (type, filename) => `${API_BASE_URL}/api/backup/download/${type}/${encodeURIComponent(filename)}`
            },
            setAuthToken,
            getAuthToken
        };
        
        window.API_BASE_URL = API_BASE_URL;
        
        console.log('[API] API initialized successfully');
    })();
}









