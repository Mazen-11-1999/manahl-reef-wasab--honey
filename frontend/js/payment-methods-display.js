/**
 * عرض طرق الدفع من إعدادات الموقع (للزبون)
 * استخدم: ضع <div id="paymentMethodsContainer"></div> في صفحة الدفع/السلة ثم شغّل loadPaymentMethodsDisplay()
 */
(function() {
    'use strict';

    var style = document.createElement('style');
    style.textContent = '#paymentMethodsContainer .payment-methods-list{display:flex;flex-direction:column;gap:1rem;}' +
        '#paymentMethodsContainer .payment-method-block{border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:1rem;background:rgba(0,0,0,0.2);}' +
        '#paymentMethodsContainer .payment-method-title{color:#d4af37;display:block;margin-bottom:0.5rem;}' +
        '#paymentMethodsContainer .payment-method-line,#paymentMethodsContainer .payment-method-note{margin:0.25rem 0;font-size:0.95rem;color:#f3cf7a;}' +
        '#paymentMethodsContainer .payment-methods-empty{color:rgba(243,207,122,0.8);font-size:0.95rem;}';
    if (document.head) document.head.appendChild(style);

    var CONTAINER_ID = 'paymentMethodsContainer';
    var API_BASE = typeof window !== 'undefined' && (window.API_BASE_URL || window.location.origin);

    function getTypeLabel(type) {
        var labels = { bank: 'تحويل بنكي', hawala: 'حوالة مالية', phone: 'رقم هاتف / محفظة', card: 'بطاقة شخصية / هوية', other: 'طريقة أخرى' };
        return labels[type] || type;
    }

    function formatMethod(m) {
        var lines = [];
        var label = (m.label && m.label.trim()) ? m.label.trim() : getTypeLabel(m.type);
        lines.push('<div class="payment-method-block" data-type="' + (m.type || 'bank') + '">');
        lines.push('<strong class="payment-method-title">' + escapeHtml(label) + '</strong>');
        if (m.type === 'bank') {
            if (m.bankName) lines.push('<p class="payment-method-line">البنك: ' + escapeHtml(m.bankName) + '</p>');
            if (m.accountHolder) lines.push('<p class="payment-method-line">صاحب الحساب: ' + escapeHtml(m.accountHolder) + '</p>');
            if (m.accountNumber) lines.push('<p class="payment-method-line">رقم الحساب: ' + escapeHtml(m.accountNumber) + '</p>');
            if (m.iban) lines.push('<p class="payment-method-line">الآيبان: ' + escapeHtml(m.iban) + '</p>');
        } else if (m.type === 'hawala') {
            if (m.hawalaOfficeName) lines.push('<p class="payment-method-line">مكتب الحوالة: ' + escapeHtml(m.hawalaOfficeName) + '</p>');
            if (m.recipientName) lines.push('<p class="payment-method-line">اسم المستلم: ' + escapeHtml(m.recipientName) + '</p>');
            if (m.recipientPhone) lines.push('<p class="payment-method-line">رقم المستلم: ' + escapeHtml(m.recipientPhone) + '</p>');
            if (m.branchOrAgent) lines.push('<p class="payment-method-line">الفرع / الوكيل: ' + escapeHtml(m.branchOrAgent) + '</p>');
        } else if (m.type === 'phone') {
            if (m.phoneNumber) lines.push('<p class="payment-method-line">الرقم: ' + escapeHtml(m.phoneNumber) + '</p>');
        } else if (m.type === 'card') {
            if (m.cardNumber) lines.push('<p class="payment-method-line">رقم البطاقة/الهوية: ' + escapeHtml(m.cardNumber) + '</p>');
            if (m.holderName) lines.push('<p class="payment-method-line">الاسم: ' + escapeHtml(m.holderName) + '</p>');
        }
        if (m.note && m.note.trim()) lines.push('<p class="payment-method-note">' + escapeHtml(m.note.trim()) + '</p>');
        lines.push('</div>');
        return lines.join('');
    }

    function escapeHtml(s) {
        if (!s) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function render(container, methods) {
        if (!container) return;
        if (!methods || methods.length === 0) {
            container.innerHTML = '<p class="payment-methods-empty">لم تُضف طرق دفع بعد. يمكنك التواصل معنا عبر واتساب.</p>';
            return;
        }
        container.innerHTML = '<div class="payment-methods-list">' + methods.map(formatMethod).join('') + '</div>';
    }

    /**
     * تحميل إعدادات الموقع وعرض طرق الدفع في العنصر الذي id = paymentMethodsContainer
     * يمكن استدعاؤها من أي صفحة بعد تحميل api.js
     */
    window.loadPaymentMethodsDisplay = function(containerId) {
        var cid = containerId || CONTAINER_ID;
        var container = document.getElementById(cid);
        if (!container) return Promise.resolve();

        var base = API_BASE || '';
        var url = base + '/api/site-settings/public';
        return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var methods = (data.settings && data.settings.paymentMethods) ? data.settings.paymentMethods : [];
                render(container, methods);
            })
            .catch(function() {
                container.innerHTML = '<p class="payment-methods-empty">جارٍ تحميل طرق الدفع...</p>';
            });
    };
})();
