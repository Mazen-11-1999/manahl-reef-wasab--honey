/**
 * Map Controller
 * Controller لجلب بيانات الخريطة
 */

const Order = require('../models/Order');
const Customer = require('../models/Customer');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * إحداثيات مناحل ريف وصاب (المصدر) - اليمن
 */
const SOURCE_COORDINATES = {
    latitude: 15.3694, // صنعاء تقريباً (يمكن تحديثها لإحداثيات دقيقة)
    longitude: 44.1910,
    name: 'مناحل ريف وصاب',
    city: 'صنعاء',
    country: 'اليمن'
};

/**
 * حساب المسافة بين نقطتين (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // المسافة بالكيلومتر
}

/**
 * جلب بيانات الخريطة
 * يعرض مواقع العملاء مع إحداثياتهم من الطلبات
 */
exports.getMapData = catchAsync(async (req, res, next) => {
    try {
        // جلب جميع الطلبات مع إحداثيات العملاء
        const orders = await Order.find({
            'customer.location.latitude': { $exists: true, $ne: null },
            'customer.location.longitude': { $exists: true, $ne: null }
        })
        .select('customer orderId total createdAt status shipping')
        .sort({ createdAt: -1 });

        // تجميع العملاء حسب الموقع (لتجنب التكرار)
        const customersMap = new Map();
        
        orders.forEach(order => {
            const key = `${order.customer.location.latitude}_${order.customer.location.longitude}`;
            
            if (!customersMap.has(key)) {
                customersMap.set(key, {
                    name: order.customer.name,
                    phone: order.customer.phone,
                    city: order.customer.city || 'غير محدد',
                    region: order.customer.region || 'غير محدد',
                    country: order.customer.country || 'اليمن',
                    location: {
                        latitude: order.customer.location.latitude,
                        longitude: order.customer.location.longitude
                    },
                    orders: [],
                    totalSpent: 0,
                    lastOrder: order.createdAt
                });
            }
            
            const customer = customersMap.get(key);
            customer.orders.push({
                orderId: order.orderId,
                total: order.total,
                createdAt: order.createdAt,
                status: order.status
            });
            customer.totalSpent += order.total || 0;
            
            // تحديث آخر طلب
            if (order.createdAt > customer.lastOrder) {
                customer.lastOrder = order.createdAt;
            }
        });

        // تحويل Map إلى Array
        const customers = Array.from(customersMap.values()).map(customer => {
            // حساب المسافة من المصدر
            const distance = calculateDistance(
                SOURCE_COORDINATES.latitude,
                SOURCE_COORDINATES.longitude,
                customer.location.latitude,
                customer.location.longitude
            );

            return {
                ...customer,
                distance: Math.round(distance),
                ordersCount: customer.orders.length,
                isVip: customer.totalSpent > 5000 || customer.orders.length > 10
            };
        });

        // جلب إحصائيات
        const totalOrders = await Order.countDocuments();
        const totalCustomers = await Customer.countDocuments();
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

        // حساب متوسط وقت التوصيل
        const deliveredOrdersWithDates = await Order.find({
            status: 'delivered',
            deliveredAt: { $exists: true },
            createdAt: { $exists: true }
        }).select('createdAt deliveredAt');

        let avgDeliveryDays = 0;
        if (deliveredOrdersWithDates.length > 0) {
            const totalDays = deliveredOrdersWithDates.reduce((sum, order) => {
                const days = (order.deliveredAt - order.createdAt) / (1000 * 60 * 60 * 24);
                return sum + days;
            }, 0);
            avgDeliveryDays = Math.round((totalDays / deliveredOrdersWithDates.length) * 10) / 10;
        }

        // جلب الدول الفريدة
        const uniqueCountries = await Order.distinct('customer.country');
        const uniqueRegions = await Order.distinct('customer.region');

        res.status(200).json({
            success: true,
            data: {
                source: SOURCE_COORDINATES,
                customers: customers,
                stats: {
                    totalCustomers: totalCustomers,
                    activeCustomers: customers.length,
                    totalOrders: totalOrders,
                    deliveredOrders: deliveredOrders,
                    deliveryRate: deliveryRate,
                    avgDeliveryDays: avgDeliveryDays,
                    countries: uniqueCountries.filter(c => c).length,
                    regions: uniqueRegions.filter(r => r).length
                }
            }
        });
    } catch (error) {
        console.error('Error fetching map data:', error);
        return next(new AppError('حدث خطأ في جلب بيانات الخريطة', 500));
    }
});

