const Joi = require('joi');

const exerciseSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Exercise name is required',
    'string.min': 'Exercise name must be at least 2 characters',
  }),
  sets: Joi.number().integer().min(1).optional(),
  reps: Joi.number().integer().min(1).optional(),
  durationMinutes: Joi.number().integer().min(1).optional(),
  notes: Joi.string().trim().max(300).optional().allow(null, ''),
});

const createPlanSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required().messages({
    'any.required': 'Title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must be at most 100 characters',
  }),

  description: Joi.string().trim().min(10).max(1000).required().messages({
    'any.required': 'Description is required',
    'string.min': 'Description must be at least 10 characters',
  }),

  level: Joi.string()
    .valid('beginner', 'intermediate', 'advanced')
    .required()
    .messages({
      'any.only': 'Level must be beginner, intermediate, or advanced',
      'any.required': 'Level is required',
    }),

  durationWeeks: Joi.number().integer().min(1).max(52).required().messages({
    'any.required': 'Duration in weeks is required',
    'number.min': 'Duration must be at least 1 week',
    'number.max': 'Duration cannot exceed 52 weeks',
  }),

  exercises: Joi.array()
  .items(exerciseSchema)
  .required()
  .messages({
    'array.base': 'Exercises must be an array'
  }),
});

const updatePlanSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).optional(),
  description: Joi.string().trim().min(10).max(1000).optional(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  durationWeeks: Joi.number().integer().min(1).max(52).optional(),
  exercises: Joi.array().items(exerciseSchema).optional(),
});

module.exports = { createPlanSchema, updatePlanSchema };
