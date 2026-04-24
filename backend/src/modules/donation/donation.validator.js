const { body, validationResult } = require('express-validator');

const rules = {
  initiate: [
    body('artistId').isUUID().withMessage('artistId must be a valid UUID'),
    body('amount').isFloat({ min: 1000 }).withMessage('amount must be at least 1000 VND'),
    body('method').isIn(['stripe', 'vnpay']).withMessage('method must be stripe or vnpay'),
  ],
  confirm: [
    body('paymentIntentId').notEmpty().withMessage('paymentIntentId is required'),
  ],
};

function validate(ruleName) {
  return [
    ...rules[ruleName],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      }
      next();
    },
  ];
}

module.exports = { validate };
