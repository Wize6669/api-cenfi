import Joi from 'joi';

const createResultSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'El campo "name" es obligatorio.',
  }),
  score: Joi.number().min(0).max(100).required().messages({
    'number.base': 'El campo "score" debe ser un número.',
    'number.min': 'El campo "score" debe ser mayor o igual a 0.',
    'number.max': 'El campo "score" debe ser menor o igual a 100.',
  }),
  size: Joi.number().positive().required().messages({
    'number.base': 'El campo "size" debe ser un número positivo.',
  }),
  career: Joi.string().required().messages({
    'string.empty': 'El campo "career" es obligatorio.',
  }),
  image: Joi.object().required().messages({
    'any.required': 'El campo "image" es obligatorio.',
  })
});

const updateResultSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.empty': 'El campo "name" no puede estar vacío.',
  }),
  score: Joi.number().min(0).max(100).optional().messages({
    'number.base': 'El campo "score" debe ser un número.',
    'number.min': 'El campo "score" debe ser mayor o igual a 0.',
    'number.max': 'El campo "score" debe ser menor o igual a 100.',
  }),
  size: Joi.number().positive().optional().messages({
    'number.base': 'El campo "size" debe ser un número positivo.',
  }),
  career: Joi.string().optional().messages({
    'string.empty': 'El campo "career" no puede estar vacío.',
  }),
  image: Joi.object().optional().messages({
    'any.required': 'El campo "image" debe ser un archivo válido.',
  })
});

const resultSchemaParams = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export { createResultSchema, updateResultSchema, resultSchemaParams }
