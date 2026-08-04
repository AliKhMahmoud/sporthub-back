const Joi = require('joi');

const sendRequestSchema = Joi.object({
  coachId: Joi.string().hex().length(24).required().messages({
    'any.required': 'Coach ID is required',
    'string.length': 'Invalid coach ID',
  }),

  message: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Message must be at most 500 characters',
    }),
});

module.exports = { sendRequestSchema };