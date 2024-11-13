import Joi from 'joi';

const createResultSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'El campo "name" es obligatorio.',
  }),
  score: Joi.number().min(0).required().messages({
    'number.base': 'El campo "score" debe ser un número.',
    'number.min': 'El campo "score" debe ser mayor o igual a 0.',
  }),
  order: Joi.number().required().messages({
    'number.base': 'El campo "order" es obligatorio.',
  }),
  career: Joi.string().required().messages({
    'string.empty': 'El campo "career" es obligatorio.',
  }),
  image: Joi.string().required().messages({
    'string.empty': 'El campo "image" es obligatorio.',
  }),
});

const updateResultSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.empty': 'El campo "name" no puede estar vacío.',
  }),
  score: Joi.number().min(0).optional().messages({
    'number.base': 'El campo "score" debe ser un número.',
    'number.min': 'El campo "score" debe ser mayor o igual a 0.',
  }),
  order: Joi.number().optional().messages({
    'number.base': 'El campo "order" debe ser un número.',
  }),
  career: Joi.string().optional().messages({
    'string.empty': 'El campo "career" no puede estar vacío.',
  }),
});

const resultSchemaParams = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export { createResultSchema, updateResultSchema, resultSchemaParams }
