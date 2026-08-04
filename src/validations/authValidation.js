const Joi = require('joi');

// ─── Reusable field rules ───────────────────────────────────────────────
const passwordRules = Joi.string()
  .min(8)
  .max(64)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/\d/, 'number')
  .pattern(/[!@#$%^&*(),.?":{}|<>]/, 'special character')
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password must be at most 64 characters',
    'string.pattern.name': 'Password must contain at least one {#name}',
    'any.required': 'Password is required',
  });

const emailRules = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  });

// ─── Schemas ────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)
    .required()
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name must be at most 50 characters',
      'string.pattern.base': 'Name can only contain letters and spaces',
      'any.required': 'Name is required',
    }),

  email: emailRules,
  password: passwordRules,

  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9]{7,15}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Phone number is not valid',
    }),

  role: Joi.string()
    .valid('athlete', 'coach')
    .default('athlete')
    .messages({
      'any.only': 'Role must be either athlete or coach',
    }),

  // ─── Coach fields ──────────────────────────────────────────────────
  sport: Joi.when('role', {
    is: 'coach',
    then: Joi.string().trim().min(2).max(50).required().messages({
      'any.required': 'Sport is required for coach',
      'string.min': 'Sport name must be at least 2 characters',
    }),
    otherwise: Joi.string().optional().allow(null, ''),
  }),

  age: Joi.when('role', {
    is: 'coach',
    then: Joi.number().integer().min(16).max(100).required().messages({
      'any.required': 'Age is required for coach',
      'number.min': 'Age must be at least 16',
    }),
    otherwise: Joi.number().optional().allow(null),
  }),

  experienceYears: Joi.when('role', {
    is: 'coach',
    then: Joi.number().integer().min(0).max(50).required().messages({
      'any.required': 'Experience years is required for coach',
    }),
    otherwise: Joi.number().optional().allow(null),
  }),

  workingDays: Joi.when('role', {
    is: 'coach',
    then: Joi.array()
      .items(Joi.string().valid('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'))
      .min(1)
      .required()
      .messages({
        'any.required': 'Working days are required for coach',
        'array.min': 'At least one working day is required',
      }),
    otherwise: Joi.array().optional().default([]),
  }),

  workingHours: Joi.when('role', {
    is: 'coach',
    then: Joi.string().trim().required().messages({
      'any.required': 'Working hours are required for coach',
    }),
    otherwise: Joi.string().optional().allow(null, ''),
  }),

  certificates: Joi.array()
    .items(Joi.string().trim())
    .optional()
    .default([]),

  bio: Joi.string()
    .trim()
    .max(300)
    .optional()
    .allow(null, ''),
});

const loginSchema = Joi.object({
  email: emailRules,
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: emailRules,
});

const resetPasswordSchema = Joi.object({
  newPassword: passwordRules,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password',
    }),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
    'string.empty': 'Current password cannot be empty',
  }),
  newPassword: passwordRules,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password',
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
};