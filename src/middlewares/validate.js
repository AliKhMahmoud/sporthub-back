const { error } = require('../utils/responseService');

/**
 * Middleware factory — wraps any Joi schema into an Express middleware.
 * Usage: router.post('/register', validate(registerSchema), authController.register)
 *
 * @param {import('joi').ObjectSchema} schema
 */
const validate = (schema) => (req, res, next) => {
  const { error: validationError, value } = schema.validate(req.body, {
    abortEarly: false,   // collect ALL errors, not just the first
    stripUnknown: true,  // remove fields not in the schema (security)
  });

  if (validationError) {
    const errors = validationError.details.map((d) => d.message);

    const resp = error('Validation failed', 422, errors);
    return res.status(resp.status).json(resp);
  }

  // replace req.body with the cleaned & sanitized value from Joi
  req.body = value;
  next();
};

module.exports = validate;