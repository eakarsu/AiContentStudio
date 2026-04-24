const { validationResult, body } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateCreate = (fields) => {
  const validators = fields.map(f => {
    let chain = body(f.name);
    if (f.required) {
      chain = chain.notEmpty().withMessage(`${f.label || f.name} is required`);
    } else {
      chain = chain.optional({ nullable: true });
    }
    if (f.type === 'email') {
      chain = chain.isEmail().withMessage('Invalid email');
    }
    if (f.minLength) {
      chain = chain.isLength({ min: f.minLength }).withMessage(`${f.label || f.name} must be at least ${f.minLength} characters`);
    }
    return chain;
  });
  return [...validators, handleValidationErrors];
};

module.exports = { handleValidationErrors, validateCreate, body };
