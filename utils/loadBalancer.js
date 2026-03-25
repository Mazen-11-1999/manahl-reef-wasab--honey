/**
 * Load Balancer Utility
 * نظام موازن التحميل للتوسع الأفقي
 */

const config = require('../config/env');
const logger = require('./logger');
const { scalabilityConfig } = require('../config/scalability');

class LoadBalancer {
    constructor() {
        this.servers = [];
        this.currentIndex = 0;
        this.connections = new Map(); // عدد الاتصالات لكل خادم
        this.healthStatus = new Map(); // حالة الصحة لكل خادم
        this.algorithm = scalabilityConfig.loadBalancer.algorithm || 'round-robin';
        this.healthyServers = [];
        
        // تهيئة الخوادم
        this.initializeServers();
        
        // بدء فحص الصحة
        if (scalabilityConfig.loadBalancer.enabled) {
            this.startHealthCheck();
        }
    }

    /**
     * تهيئة الخوادم
     */
    initializeServers() {
        this.servers = scalabilityConfig.loadBalancer.servers.map((server, index) => ({
            id: index + 1,
            host: server.host,
            port: server.port,
            weight: server.weight || 1,
            connections: 0,
            isHealthy: true,
            lastHealthCheck: Date.now(),
            responseTime: 0,
            errorCount: 0
        }));

        // تهيئة الخوادم الصحية
        this.servers.forEach(server => {
            this.healthStatus.set(server.id, server.isHealthy);
            this.connections.set(server.id, 0);
        });

        this.healthyServers = [...this.servers];
        logger.info(`✅ تم تهيئة ${this.servers.length} خوادم في Load Balancer`);
    }

    /**
     * بدء فحص الصحة
     */
    startHealthCheck() {
        const interval = scalabilityConfig.loadBalancer.healthCheck.interval;
        
        this.healthCheckInterval = setInterval(async () => {
            await this.checkAllServersHealth();
        }, interval);

        logger.info(`✅ بدء فحص الصحة كل ${interval / 1000} ثانية`);
    }

    /**
     * فحص صحة جميع الخوادم
     */
    async checkAllServersHealth() {
        const healthPromises = this.servers.map(server => 
            this.checkServerHealth(server)
        );

        const results = await Promise.allSettled(healthPromises);
        
        this.healthyServers = [];
        this.servers.forEach((server, index) => {
            const result = results[index];
            if (result.status === 'fulfilled' && result.value) {
                server.isHealthy = true;
                server.lastHealthCheck = Date.now();
                server.errorCount = 0;
                this.healthyServers.push(server);
                this.healthStatus.set(server.id, true);
            } else {
                server.isHealthy = false;
                server.errorCount++;
                this.healthStatus.set(server.id, false);
                logger.warn(`⚠️ الخادم ${server.id} غير صحي: ${server.host}:${server.port}`);
            }
        });

        if (this.healthyServers.length === 0) {
            logger.error('❌ جميع الخوادم غير صحية!');
        } else {
            logger.info(`📊 عدد الخوادم الصحية: ${this.healthyServers.length}/${this.servers.length}`);
        }
    }

    /**
     * فحص صحة خادم واحد
     */
    async checkServerHealth(server) {
        try {
            const startTime = Date.now();
            
            // محاولة الاتصال بالخادم
            const response = await fetch(`http://${server.host}:${server.port}/health`, {
                method: 'GET',
                timeout: scalabilityConfig.loadBalancer.healthCheck.timeout
            });

            const endTime = Date.now();
            server.responseTime = endTime - startTime;

            if (response.ok) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            server.responseTime = scalabilityConfig.loadBalancer.healthCheck.timeout;
            return false;
        }
    }

    /**
     * اختيار الخادم التالي حسب الخوارزمية
     */
    selectServer() {
        if (this.healthyServers.length === 0) {
            throw new Error('لا يوجد خوادم صحية متاحة');
        }

        let selectedServer;

        switch (this.algorithm) {
            case 'round-robin':
                selectedServer = this.roundRobinSelect();
                break;
            case 'least-connections':
                selectedServer = this.leastConnectionsSelect();
                break;
            case 'weighted':
                selectedServer = this.weightedSelect();
                break;
            case 'response-time':
                selectedServer = this.responseTimeSelect();
                break;
            default:
                selectedServer = this.roundRobinSelect();
        }

        // زيادة عدد الاتصالات
        const currentConnections = this.connections.get(selectedServer.id) || 0;
        this.connections.set(selectedServer.id, currentConnections + 1);
        selectedServer.connections = currentConnections + 1;

        logger.debug(`🎯 تم اختيار الخادم ${selectedServer.id} (${selectedServer.host}:${selectedServer.port}) - الخوارزمية: ${this.algorithm}`);
        
        return selectedServer;
    }

    /**
     * اختيار Round Robin
     */
    roundRobinSelect() {
        const server = this.healthyServers[this.currentIndex % this.healthyServers.length];
        this.currentIndex++;
        return server;
    }

    /**
     * اختيار أقل عدد اتصالات
     */
    leastConnectionsSelect() {
        return this.healthyServers.reduce((minServer, server) => {
            const minConnections = this.connections.get(minServer.id) || 0;
            const serverConnections = this.connections.get(server.id) || 0;
            return serverConnections < minConnections ? server : minServer;
        });
    }

    /**
     * اختيار مرجح حسب الوزن
     */
    weightedSelect() {
        const totalWeight = this.healthyServers.reduce((total, server) => total + server.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const server of this.healthyServers) {
            random -= server.weight;
            if (random <= 0) {
                return server;
            }
        }
        
        return this.healthyServers[this.healthyServers.length - 1];
    }

    /**
     * اختيار حسب وقت الاستجابة
     */
    responseTimeSelect() {
        return this.healthyServers.reduce((fastestServer, server) => {
            return server.responseTime < fastestServer.responseTime ? server : fastestServer;
        });
    }

    /**
     * تحرير الاتصال
     */
    releaseConnection(serverId) {
        const currentConnections = this.connections.get(serverId) || 0;
        const newConnections = Math.max(0, currentConnections - 1);
        this.connections.set(serverId, newConnections);
        
        // تحديث عدد الاتصالات في الخادم
        const server = this.servers.find(s => s.id === serverId);
        if (server) {
            server.connections = newConnections;
        }
    }

    /**
     * الحصول على إحصائيات Load Balancer
     */
    getStats() {
        const stats = {
            totalServers: this.servers.length,
            healthyServers: this.healthyServers.length,
            algorithm: this.algorithm,
            connections: {},
            healthStatus: {},
            responseTimes: {}
        };

        this.servers.forEach(server => {
            stats.connections[server.id] = server.connections;
            stats.healthStatus[server.id] = server.isHealthy;
            stats.responseTimes[server.id] = server.responseTime;
        });

        const totalConnections = Array.from(this.connections.values()).reduce((total, conn) => total + conn, 0);
        stats.totalConnections = totalConnections;

        return stats;
    }

    /**
     * الحصول على توصيات الأداء
     */
    getPerformanceRecommendations() {
        const recommendations = [];
        const stats = this.getStats();

        // توصية بعدد الخوادم
        if (stats.totalConnections > 100 && stats.healthyServers.length < 3) {
            recommendations.push({
                type: 'capacity',
                message: 'يجب زيادة عدد الخوادم لتحمل الأداء العالي',
                action: 'add_server'
            });
        }

        // توصية بتغيير الخوارزمية
        if (stats.totalConnections > 50 && this.algorithm === 'round-robin') {
            recommendations.push({
                type: 'algorithm',
                message: 'يجب استخدام خوارزمية least-connections أو weighted للتوزيع الأفضل',
                action: 'change_algorithm'
            });
        }

        // توصية بالخوادم غير الصحية
        const unhealthyCount = stats.totalServers - stats.healthyServers.length;
        if (unhealthyCount > 0) {
            recommendations.push({
                type: 'health',
                message: `${unhealthyCount} خوادم غير صحية تحتاج للمراجعة`,
                action: 'check_servers'
            });
        }

        return recommendations;
    }

    /**
     * إيقاف Load Balancer
     */
    stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            logger.info('🔌 تم إيقاف فحص الصحة');
        }
    }

    /**
     * إعادة تشغيل Load Balancer
     */
    restart() {
        this.stop();
        this.initializeServers();
        if (scalabilityConfig.loadBalancer.enabled) {
            this.startHealthCheck();
        }
        logger.info('🔄 تم إعادة تشغيل Load Balancer');
    }
}

// إنشاء Load Balancer singleton
let loadBalancerInstance = null;

const getLoadBalancer = () => {
    if (!loadBalancerInstance) {
        loadBalancerInstance = new LoadBalancer();
    }
    return loadBalancerInstance;
};

// Middleware للتوجيه الطلبات
const loadBalancerMiddleware = (req, res, next) => {
    if (!scalabilityConfig.loadBalancer.enabled) {
        return next();
    }

    try {
        const loadBalancer = getLoadBalancer();
        const selectedServer = loadBalancer.selectServer();
        
        // إضافة معلومات الخادم للطلب
        req.serverInfo = {
            id: selectedServer.id,
            host: selectedServer.host,
            port: selectedServer.port,
            connections: selectedServer.connections
        };

        // تحرير الاتصال عند الانتهاء
        res.on('finish', () => {
            loadBalancer.releaseConnection(selectedServer.id);
        });

        next();
    } catch (error) {
        logger.error('❌ خطأ في Load Balancer middleware:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في موازن التحميل'
        });
    }
};

module.exports = {
    LoadBalancer,
    getLoadBalancer,
    loadBalancerMiddleware
};
