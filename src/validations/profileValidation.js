const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)
    .optional()
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name must be at most 50 characters',
      'string.pattern.base': 'Name can only contain letters and spaces',
    }),

  about: Joi.string()
    .trim()
    .max(300)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'About must be at most 300 characters',
    }),

  coachSport: Joi.string()
    .trim()
    .optional()
    .allow(null, ''),

  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9]{7,15}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Phone number is not valid',
    }),

  height: Joi.number()
    .min(50)
    .max(300)
    .optional()
    .allow(null, '')
    .messages({
      'number.min': 'Height must be at least 50 cm',
      'number.max': 'Height must be at most 300 cm',
    }),

  weight: Joi.number()
    .min(20)
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'number.min': 'Weight must be at least 20 kg',
      'number.max': 'Weight must be at most 500 kg',
    }),
});

module.exports = { updateProfileSchema };