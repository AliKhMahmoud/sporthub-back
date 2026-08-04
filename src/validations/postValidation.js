const Joi = require('joi');

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required().messages({
    'any.required': 'Title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must be at most 150 characters',
  }),

  body: Joi.string().trim().min(10).max(5000).required().messages({
    'any.required': 'Body is required',
    'string.min': 'Body must be at least 10 characters',
    'string.max': 'Body must be at most 5000 characters',
  }),

  sportId: Joi.string().hex().length(24).required().messages({
    'any.required': 'Sport is required',
    'string.length': 'Invalid sport ID',
  }),

  media: Joi.array().items(Joi.string().uri()).optional().default([]).messages({
    'string.uri': 'Each media item must be a valid URL',
  }),
});

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).optional(),
  body: Joi.string().trim().min(10).max(5000).optional(),
  media: Joi.array().items(Joi.string().uri()).optional(),
});

const commentSchema = Joi.object({
  body: Joi.string().trim().min(1).max(1000).required().messages({
    'any.required': 'Comment body is required',
    'string.min': 'Comment cannot be empty',
    'string.max': 'Comment must be at most 1000 characters',
  }),
});

module.exports = { createPostSchema, updatePostSchema, commentSchema };
