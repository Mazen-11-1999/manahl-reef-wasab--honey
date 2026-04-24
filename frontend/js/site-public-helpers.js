/**
 * إعدادات العامة للواجهة: اسم المتجر ورقم واتساب من API (أو احتياطي).
 */
(function () {
    var cached = null;
    var DEFAULT_WA = '967773298831';
    var DEFAULT_NAME = 'مناحل ريف وصاب';

    function digitizePhone(s) {
        if (s == null || s === '') return '';
        return String(s).replace(/\D/g, '');
    }

    function warmFromLocalStorage() {
        if (cached) return;
        try {
            var raw = localStorage.getItem('storeSettings');
            if (raw) cached = JSON.parse(raw);
        } catch (e) { /* ignore */ }
    }

    window.ensurePublicSiteSettings = async function () {
        try {
            if (window.API && window.API.siteSettings && window.API.siteSettings.getPublic) {
                var r = await window.API.siteSettings.getPublic();
                if (r && r.settings) {
                    cached = r.settings;
                    return cached;
                }
            }
        } catch (e) { /* ignore */ }
        warmFromLocalStorage();
        if (!cached) cached = {};
        return cached;
    };

    window.getStoreDisplayName = function () {
        warmFromLocalStorage();
        var c = cached || {};
        return c.storeName || c.siteName || DEFAULT_NAME;
    };

    /** أرقام فقط لرابط wa.me (بدون +) */
    window.getWhatsAppLinkDigits = function () {
        warmFromLocalStorage();
        var c = cached || {};
        var raw = c.whatsappPhone != null && String(c.whatsappPhone).trim() !== '' ? c.whatsappPhone : c.whatsapp;
        if (raw == null || raw === '') {
            try {
                var o = JSON.parse(localStorage.getItem('storeSettings') || '{}');
                raw = o.whatsappPhone || o.whatsapp || '';
            } catch (e) { /* ignore */ }
        }
        var d = digitizePhone(raw);
        if (d.length >= 8 && d.length <= 15) return d;
        return DEFAULT_WA;
    };

    warmFromLocalStorage();
})();
