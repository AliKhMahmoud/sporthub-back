const Joi = require('joi');

const addProgressSchema = Joi.object({
  userId: Joi.string().hex().length(24).required().messages({
    'any.required': 'User ID is required',
    'string.length': 'Invalid user ID',
  }),

  sportId: Joi.string().hex().length(24).required().messages({
    'any.required': 'Sport is required',
    'string.length': 'Invalid sport ID',
  }),

  metric: Joi.string()
    .valid('weight', 'reps', 'time', 'distance')
    .required()
    .messages({
      'any.only': 'Metric must be weight, reps, time, or distance',
      'any.required': 'Metric is required',
    }),

  value: Joi.number().min(0).required().messages({
    'any.required': 'Value is required',
    'number.min': 'Value cannot be negative',
  }),

  note: Joi.string().trim().max(300).optional().allow(null, '').messages({
    'string.max': 'Note must be at most 300 characters',
  }),

  recordedAt: Joi.date().max('now').optional().messages({
    'date.max': 'Recorded date cannot be in the future',
  }),
});

module.exports = { addProgressSchema };