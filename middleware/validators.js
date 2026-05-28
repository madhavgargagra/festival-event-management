// Input validations middleware using express-validator
const { body, validationResult } = require('express-validator');

// 1. Validation handler middleware to inspect and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    return res.status(400).send(`<h3>Validation Error</h3><p>${errors.array().map(e => e.msg).join('<br>')}</p><a href="javascript:history.back()">Go Back</a>`);
  }
  next();
};

// 2. Auth Validators
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  validate
};
