const Joi = require('joi');

// Admin يعدل بيانات رياضة — كل الحقول اختيارية (partial update)
const updateSportSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 50 characters',
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must be at most 500 characters',
    }),

  colorTheme: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .optional()
    .messages({
      'string.pattern.base': 'Color theme must be a valid hex color (e.g. #FF5733)',
    }),

  image: Joi.string()
    .uri()
    .optional()
    .allow(null, '')
    .messages({
      'string.uri': 'Image must be a valid URL',
    }),

  sport: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid sport ID'
      }),

  isActive: Joi.boolean().optional(),
});

module.exports = { updateSportSchema };