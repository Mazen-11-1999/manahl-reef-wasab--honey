/**
 * عملة المتجر الافتراضية (YER / SAR / USD) — تُضبط من إعدادات الموقع في لوحة التحكم.
 */
(function () {
    function norm(c) {
        if (c == null || c === '') return 'YER';
        var u = String(c).toUpperCase();
        return (u === 'SAR' || u === 'USD' || u === 'YER') ? u : 'YER';
    }

    window.getStoreCurrencyCode = function () {
        return norm(window.__storeDefaultCurrency || (typeof localStorage !== 'undefined' && localStorage.getItem('storeDefaultCurrency')));
    };

    window.setStoreDefaultCurrency = function (code) {
        window.__storeDefaultCurrency = norm(code);
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('storeDefaultCurrency', window.__storeDefaultCurrency);
            }
        } catch (e) { /* ignore */ }
    };

    /** عرض رمز مناسب للواجهة (أسعار). override = كود عند اختلافه عن إعداد المتجر (مثلاً عملة طلب). */
    window.currencySymbol = function (override) {
        var c = (override != null && override !== '') ? norm(override) : window.getStoreCurrencyCode();
        if (c === 'SAR') return 'ر.س';
        if (c === 'USD') return 'US$';
        return 'ر.ي';
    };

    window.ensureStoreCurrency = async function () {
        if (window.__storeDefaultCurrency) return;
        try {
            if (window.API && window.API.siteSettings && window.API.siteSettings.getPublic) {
                var r = await window.API.siteSettings.getPublic();
                if (r && r.settings && r.settings.defaultCurrency) {
                    window.setStoreDefaultCurrency(r.settings.defaultCurrency);
                    return;
                }
            }
        } catch (e) { /* ignore */ }
        window.setStoreDefaultCurrency(typeof localStorage !== 'undefined' ? localStorage.getItem('storeDefaultCurrency') : 'YER');
    };
})();
