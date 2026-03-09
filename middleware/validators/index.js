/**
 * Validators Index
 * ملف تجميع جميع الـ Validators
 */

const productValidator = require('./productValidator');
const orderValidator = require('./orderValidator');
const contestValidator = require('./contestValidator');
const didYouKnowValidator = require('./didYouKnowValidator');

module.exports = {
    product: productValidator,
    order: orderValidator,
    contest: contestValidator,
    didYouKnow: didYouKnowValidator
};




















