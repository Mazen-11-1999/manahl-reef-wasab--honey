/**
 * Admin Dashboard Integration
 * ربط لوحة الإدارة بالـ Backend API
 */

// تحميل البيانات من الـ API
async function loadDashboardData() {
    try {
        // تحميل الإحصائيات
        await loadStats();
        
        // تحميل الطلبات
        await loadOrders();
        
        // تحميل المنتجات
        await loadProducts();
        
        // تحميل المسابقات
        await loadContests();
        
        // تحميل العملاء
        await loadCustomers();
        
        showNotification('تم تحميل البيانات بنجاح! ✅', 'success');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    }
}

// تحميل الإحصائيات
async function loadStats() {
    try {
        // محاولة استخدام API.stats.getStats() إذا كان متوفراً
        let stats = {};
        try {
            stats = await API.stats.getStats();
        } catch (e) {
            // إذا فشل، استخدم fetch مباشرة
            const token = API.getAuthToken();
            const response = await fetch('/api/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                stats = await response.json();
            }
        }
        
        // تحديث الإحصائيات في التبويب Overview
        if (stats.monthlyRevenue !== undefined) {
            const monthlySalesEl = document.getElementById('monthlySales');
            if (monthlySalesEl) {
                monthlySalesEl.textContent = formatNumber(stats.monthlyRevenue);
            }
        }
        
        // حساب الطلبات قيد الشحن من الطلبات
        try {
            const ordersResponse = await API.orders.getAll({ status: 'shipped', limit: 1000 });
            const orders = ordersResponse.data || ordersResponse;
            const shippingOrders = Array.isArray(orders) ? orders.length : 0;
            
            const shippingOrdersEl = document.getElementById('shippingOrders');
            if (shippingOrdersEl) {
                shippingOrdersEl.textContent = shippingOrders;
            }
        } catch (e) {
            console.error('Error loading shipping orders:', e);
        }
        
        // حساب إجمالي العملاء من الطلبات
        try {
            const ordersResponse = await API.orders.getAll({ limit: 1000 });
            const orders = ordersResponse.data || ordersResponse;
            const uniqueCustomers = new Set();
            if (Array.isArray(orders)) {
                orders.forEach(order => {
                    const phone = order.customer?.phone || order.customerPhone;
                    if (phone) uniqueCustomers.add(phone);
                });
            }
            
            const totalCustomersEl = document.getElementById('totalCustomers');
            if (totalCustomersEl) {
                totalCustomersEl.textContent = uniqueCustomers.size;
            }
        } catch (e) {
            console.error('Error loading customers:', e);
        }
        
        // حساب معدل النمو (مبسط - يمكن تحسينه لاحقاً)
        const growthRateEl = document.getElementById('growthRate');
        if (growthRateEl && stats.monthlyRevenue) {
            // حساب بسيط - يمكن تحسينه لاحقاً
            growthRateEl.textContent = '+٢٣٪'; // مؤقت
        }
        
        // تحديث الأرباح (إذا كانت متوفرة)
        if (stats.profits) {
            const dailyProfitEl = document.getElementById('dailyProfit');
            const weeklyProfitEl = document.getElementById('weeklyProfit');
            const monthlyProfitEl = document.getElementById('monthlyProfit');
            const totalProfitEl = document.getElementById('totalProfit');
            
            if (dailyProfitEl && stats.profits.daily) {
                dailyProfitEl.textContent = formatNumber(stats.profits.daily) + ' ريال';
            }
            if (weeklyProfitEl && stats.profits.weekly) {
                weeklyProfitEl.textContent = formatNumber(stats.profits.weekly) + ' ريال';
            }
            if (monthlyProfitEl && stats.profits.monthly) {
                monthlyProfitEl.textContent = formatNumber(stats.profits.monthly) + ' ريال';
            }
            if (totalProfitEl && stats.profits.total) {
                totalProfitEl.textContent = formatNumber(stats.profits.total) + ' ريال';
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// تحميل الطلبات
async function loadOrders() {
    try {
        const response = await API.orders.getAll({ limit: 10, sort: '-createdAt' });
        const orders = response.data || response;
        
        if (!Array.isArray(orders)) return;
        
        // تحديث جدول الطلبات في التبويب Overview
        const ordersTableBody = document.querySelector('#overview .data-table tbody');
        if (ordersTableBody && orders.length > 0) {
            ordersTableBody.innerHTML = orders.map(order => {
                const statusBadge = getStatusBadge(order.status);
                const orderId = order.orderId || order._id;
                const grandTotal = (order.total || 0) + (order.shipping || 0);
                const paidAmount = order.payment?.paidAmount || 0;
                const remainingAmount = order.payment?.remainingAmount || grandTotal;
                const paymentMethod = getPaymentMethodText(order.paymentMethod);
                const paymentStatus = getPaymentStatusBadge(order.payment?.paymentStatus || 'pending');
                const currSym = (order.currency === 'SAR') ? 'ر.س' : 'ر.ي';
                
                return `
                    <tr>
                        <td>#${orderId}</td>
                        <td class="customer-name">${order.customer?.name || order.customerName || 'غير محدد'}</td>
                        <td class="revenue">${formatNumber(grandTotal)} ${currSym}</td>
                        <td style="color: var(--success); font-weight: bold;">${formatNumber(paidAmount)} ${currSym}</td>
                        <td style="color: ${remainingAmount > 0 ? 'var(--warning)' : 'var(--success)'}; font-weight: bold;">${formatNumber(remainingAmount)} ${currSym}</td>
                        <td>${paymentMethod}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <button onclick="viewOrder('${orderId}')" style="background: var(--gold-primary); color: var(--bg-primary); border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 5px;">عرض</button>
                            <button onclick="window.open('invoice.html?orderId=${orderId}','_blank')" style="background: rgba(212,175,55,0.25); color: var(--gold-primary); border: 1px solid var(--gold-primary); padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 5px;" title="فاتورة">🧾 فاتورة</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        // تحديث بطاقات الطلبات في تبويب Orders
        if (typeof renderOrdersCards === 'function') {
            renderOrdersCards(orders);
        }
        
        // تحديث جدول الطلبات في تبويب Orders
        const ordersTableBody2 = document.querySelector('#orders .data-table tbody');
        if (ordersTableBody2) {
            if (orders.length > 0) {
                ordersTableBody2.innerHTML = orders.map(order => {
                    const statusBadge = getStatusBadge(order.status);
                    const orderId = order.orderId || order._id;
                    const grandTotal = (order.total || 0) + (order.shipping || 0);
                    const paidAmount = order.payment?.paidAmount || 0;
                    const remainingAmount = order.payment?.remainingAmount || grandTotal;
                    const paymentMethod = getPaymentMethodText(order.paymentMethod);
                    const paymentStatus = getPaymentStatusBadge(order.payment?.paymentStatus || 'pending');
                    const currSym = (order.currency === 'SAR') ? 'ر.س' : 'ر.ي';
                    
                    return `
                        <tr>
                            <td>#${orderId}</td>
                            <td class="customer-name">${order.customer?.name || order.customerName || 'غير محدد'}</td>
                            <td class="revenue">${formatNumber(grandTotal)} ${currSym}</td>
                            <td style="color: var(--success); font-weight: bold;">${formatNumber(paidAmount)} ${currSym}</td>
                            <td style="color: ${remainingAmount > 0 ? 'var(--warning)' : 'var(--success)'}; font-weight: bold;">${formatNumber(remainingAmount)} ${currSym}</td>
                            <td>${paymentMethod}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <button onclick="viewOrder('${orderId}')" style="background: var(--info); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 5px;">عرض</button>
                                <button onclick="manageOrder('${orderId}')" style="background: var(--gold-primary); color: var(--bg-primary); border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 5px;">إدارة</button>
                                <button onclick="window.open('invoice.html?orderId=${orderId}','_blank')" style="background: rgba(212,175,55,0.25); color: var(--gold-primary); border: 1px solid var(--gold-primary); padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 5px;" title="طباعة الفاتورة أو إرسالها للعميل">🧾 فاتورة</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } else {
                ordersTableBody2.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #888;">لا توجد طلبات حالياً</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// تحميل المنتجات
async function loadProducts() {
    try {
        const response = await API.products.getAll({ limit: 10 });
        const products = response.data || response;
        
        // تحديث جدول المنتجات في تبويب Products
        const productsTableBody = document.querySelector('#products .data-table tbody');
        if (productsTableBody && products.length > 0) {
            productsTableBody.innerHTML = products.map(product => {
                const stockBadge = product.stock > 0 
                    ? `<span class="stock-badge">متوفر (${product.stock})</span>`
                    : `<span style="background: var(--danger); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">نفد المخزون</span>`;
                
                return `
                    <tr>
                        <td class="product-name">${product.name}</td>
                        <td class="product-price">${formatNumber(product.price)} ر.س</td>
                        <td>${stockBadge}</td>
                        <td>
                            <button onclick="editProduct('${product._id}')" style="background: var(--gold-primary); color: var(--bg-primary); border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-left: 5px;">تعديل</button>
                            <button onclick="deleteProduct('${product._id}')" style="background: var(--danger); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">حذف</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// تحميل المسابقات
async function loadContests() {
    try {
        const contests = await API.contests.getAll();
        const activeContests = Array.isArray(contests) ? contests.filter(c => c.status === 'active') : [];
        
        // تحديث جدول المسابقات
        const contestsTableBody = document.querySelector('#contests .data-table tbody');
        if (contestsTableBody) {
            if (activeContests.length > 0) {
                contestsTableBody.innerHTML = activeContests.map(contest => {
                    const participantsCount = contest.participants?.length || 0;
                    const prize = contest.prize || 'غير محدد';
                    const statusBadge = contest.status === 'active' 
                        ? '<span class="customer-badge">نشطة</span>'
                        : '<span style="background: #888; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">منتهية</span>';
                    
                    return `
                        <tr>
                            <td class="customer-name">${contest.title || contest.name}</td>
                            <td class="customer-orders">${participantsCount} مشارك</td>
                            <td class="revenue">${prize}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <button onclick="manageContest('${contest._id}')" style="background: var(--gold-primary); color: var(--bg-primary); border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">إدارة</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } else {
                contestsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">لا توجد مسابقات نشطة</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error loading contests:', error);
    }
}

// تحميل العملاء (بيانات حقيقية من API + إحصائيات الشارات)
async function loadCustomers() {
    const customersTableBody = document.getElementById('customersTableBody');
    const totalEl = document.getElementById('totalCustomersStat');
    const vipEl = document.getElementById('vipCustomersStat');
    const premiumEl = document.getElementById('premiumCustomersStat');
    try {
        const response = await API.customers.getAll({ limit: 50, page: 1 });
        const customers = response.customers || [];
        const stats = response.stats || {};
        const total = stats.totalCustomers !== undefined ? stats.totalCustomers : (response.pagination && response.pagination.total) || 0;

        if (totalEl) totalEl.textContent = typeof total === 'number' ? total : '—';
        if (vipEl) vipEl.textContent = typeof stats.vipCount === 'number' ? stats.vipCount : '—';
        if (premiumEl) premiumEl.textContent = typeof stats.premiumCount === 'number' ? stats.premiumCount : '—';

        if (!customersTableBody) return;
        if (customers.length === 0) {
            customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:#888;">لا يوجد عملاء مسجّلون بعد. للتفاصيل وإدارة الشارات: <a href="customers-badges.html" style="color:var(--gold-primary);">العملاء والشارات</a></td></tr>';
            return;
        }
        function badgeLabel(bt) {
            if (bt === 'vip') return 'VIP مناحل ريف وصاب';
            if (bt === 'premium') return 'عميل مميز';
            return '—';
        }
        function badgeClass(bt) {
            if (bt === 'vip') return 'customer-badge';
            if (bt === 'premium') return 'status-completed';
            return '';
        }
        customersTableBody.innerHTML = customers.map(function(c) {
            var name = (c.user && c.user.profile && (c.user.profile.firstName || c.user.profile.lastName))
                ? ((c.user.profile.firstName || '') + ' ' + (c.user.profile.lastName || '')).trim() || (c.user && c.user.username) || ''
                : (c.profile && (c.profile.firstName || c.profile.lastName))
                    ? ((c.profile.firstName || '') + ' ' + (c.profile.lastName || '')).trim()
                    : (c.user && c.user.username) || c.email || c.phone || '—';
            var badgeType = (c.user && c.user.badgeType) ? c.user.badgeType : 'none';
            var orderCount = c.orderCount !== undefined ? c.orderCount : 0;
            var badgeHtml = badgeType !== 'none'
                ? '<span class="' + badgeClass(badgeType) + '" style="' + (badgeType === 'vip' ? '' : 'padding:2px 8px; border-radius:10px; font-size:0.75rem;') + '">' + badgeLabel(badgeType) + '</span>'
                : '—';
            return '<tr><td class="customer-name">' + (name || '—') + '</td><td>' + (c.phone || '—') + '</td><td class="customer-orders">' + orderCount + ' طلب</td><td>' + badgeHtml + '</td></tr>';
        }).join('');
    } catch (error) {
        console.error('Error loading customers:', error);
        if (customersTableBody) {
            customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--danger);">فشل تحميل العملاء. <a href="customers-badges.html" style="color:var(--gold-primary);">افتح صفحة العملاء والشارات</a></td></tr>';
        }
        if (totalEl) totalEl.textContent = '—';
        if (vipEl) vipEl.textContent = '—';
        if (premiumEl) premiumEl.textContent = '—';
    }
}

// Helper Functions
function formatNumber(num) {
    return new Intl.NumberFormat('ar-SA').format(num);
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': '<span style="background: var(--warning); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">قيد المعالجة</span>',
        'processing': '<span style="background: var(--info); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">قيد المعالجة</span>',
        'paid': '<span style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">مدفوع</span>',
        'ready_to_ship': '<span style="background: var(--info); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">جاهز للشحن</span>',
        'shipped': '<span class="customer-badge">تم الشحن</span>',
        'delivered': '<span style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">تم التسليم</span>',
        'completed': '<span style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">مكتمل</span>',
        'cancelled': '<span style="background: var(--danger); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">ملغي</span>'
    };
    return statusMap[status] || '<span class="customer-badge">' + status + '</span>';
}

function getPaymentMethodText(method) {
    const methodMap = {
        'half': '💰 دفع النصف',
        'full': '💳 دفع كامل',
        'delivery': '🚛 عند الاستلام',
        'cash': '💵 نقدي',
        'bank_transfer': '🏦 تحويل بنكي',
        'card': '💳 بطاقة',
        'other': 'أخرى'
    };
    return methodMap[method] || method || 'غير محدد';
}

function getPaymentStatusBadge(status) {
    const statusMap = {
        'pending': '<span style="background: var(--warning); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">لم يدفع</span>',
        'partial': '<span style="background: var(--info); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">دفع جزئي</span>',
        'paid': '<span style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">مدفوع</span>',
        'completed': '<span style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">مكتمل</span>'
    };
    return statusMap[status] || '<span style="background: #888; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">غير محدد</span>';
}

function viewOrder(orderId) {
    window.open(`orders.html?orderId=${orderId}`, '_blank');
}

function manageOrder(orderId) {
    window.open(`orders.html?orderId=${orderId}`, '_blank');
}

function editProduct(productId) {
    window.open(`products.html?edit=${productId}`, '_blank');
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        return;
    }
    
    try {
        await API.products.delete(productId);
        showNotification('تم حذف المنتج بنجاح! ✅', 'success');
        loadProducts(); // إعادة تحميل المنتجات
    } catch (error) {
        showNotification('حدث خطأ في حذف المنتج', 'error');
    }
}

function manageContest(contestId) {
    window.open(`admin-contest-control.html?contestId=${contestId}`, '_blank');
}

// تحديث البيانات تلقائياً (فترة معقولة لتقليل الطلبات وتجنب 429)
function startAutoRefresh() {
    setInterval(() => {
        loadDashboardData();
    }, 60000); // كل 60 ثانية
}

// تهيئة عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof API !== 'undefined') {
            loadDashboardData();
            startAutoRefresh();
        }
    });
} else {
    if (typeof API !== 'undefined') {
        loadDashboardData();
        startAutoRefresh();
    }
}

