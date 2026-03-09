/**
 * Async Handler Middleware
 * Middleware لالتقاط الأخطاء في الدوال غير المتزامنة
 * (Alternative to catchAsync utility)
 */

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;




















