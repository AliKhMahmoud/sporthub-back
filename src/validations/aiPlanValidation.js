const Joi = require('joi');

const exerciseSchema = Joi.object({
  exerciseName: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Exercise name is required',
  }),
  completed: Joi.boolean().optional().default(false),
});

const daySchema = Joi.object({
  dayName: Joi.string().trim().required().messages({
    'any.required': 'Day name is required',
  }),
  focus: Joi.string().trim().max(200).optional().allow(null, ''),
  exercises: Joi.array().items(exerciseSchema).optional().default([]),
});

const createAIPlanSchema = Joi.object({
  sport: Joi.string().trim().min(2).max(50).required().messages({
    'any.required': 'Sport is required',
  }),

  goal: Joi.string().trim().min(5).max(500).required().messages({
    'any.required': 'Goal is required',
    'string.min': 'Goal must be at least 5 characters',
  }),

  condition: Joi.string().trim().max(500).optional().allow(null, ''),

  days: Joi.array().items(daySchema).optional().default([]),
});

const feedbackSchema = Joi.object({
  coachFeedback: Joi.string().trim().max(1000).optional().allow(null, ''),

  coachRating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': 'Rating must be between 1 and 5',
    'number.max': 'Rating must be between 1 and 5',
  }),
});

module.exports = { createAIPlanSchema, feedbackSchema };
