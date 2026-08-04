const Joi = require('joi');

const startConversationSchema = Joi.object({
  coachId: Joi.string().hex().length(24).optional(),
  athleteId: Joi.string().hex().length(24).optional(),
})
  .or('coachId', 'athleteId')
  .messages({
    'object.missing': 'Either coachId or athleteId is required',
  });

const sendMessageSchema = Joi.object({
  conversationId: Joi.string().hex().length(24).required().messages({
    'any.required': 'conversationId is required',
    'string.length': 'Invalid conversation ID',
  }),

  content: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Message content cannot be empty',
    'string.max': 'Message is too long (max 2000 characters)',
    'any.required': 'Message content is required',
  }),
});

module.exports = { startConversationSchema, sendMessageSchema };
