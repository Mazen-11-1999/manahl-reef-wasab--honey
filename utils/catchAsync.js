/**
 * Catch Async Errors Wrapper
 * دالة مساعدة لالتقاط الأخطاء في الدوال غير المتزامنة
 */

const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = catchAsync;




















