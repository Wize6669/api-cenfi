import Joi from 'joi';

// Esquema para la creación de un simulador (Create)
const createSimulatorSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.base': 'El nombre debe ser una cadena de texto.',
      'string.empty': 'El nombre no puede estar vacío.',
      'string.min': 'El nombre debe tener al menos 3 caracteres.',
      'string.max': 'El nombre no puede tener más de 100 caracteres.',
      'any.required': 'El nombre es obligatorio.',
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'La contraseña no puede estar vacía.',
      'any.required': 'La contraseña es obligatoria.',
    }),

  duration: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'La duración debe ser un número entero.',
      'number.positive': 'La duración debe ser un número positivo.',
      'any.required': 'La duración es obligatoria.',
    }),

  navigate: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'El valor de navegación debe ser un booleano.',
      'any.required': 'El campo de navegación es obligatorio.',
    }),

  review: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'El valor de revisión debe ser un booleano.',
      'any.required': 'El campo de revisión es obligatorio.',
    }),

  visibility: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'El valor de visibilidad debe ser un booleano.',
      'any.required': 'El campo de visibilidad es obligatorio.',
    }),

  categoryQuestions: Joi.array()
    .items(Joi.object({
      categoryId: Joi.number().required(),
      numberOfQuestions: Joi.number().integer().min(0).required(),
    }))
    .optional()
    .messages({
      'string.base': 'El campo categoryId debe ser un número',
      'string.empty': 'El campo categoryId no puede estar vacío.',
      'any.required': 'El campo categoryId es obligatorio.',
    }),

  number_of_questions: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'El número de preguntas debe ser un número entero.',
      'number.min': 'El número de preguntas no puede ser negativo.',
    }),

}).messages({
  'object.unknown': 'Un campo desconocido fue recibido.',
});

const updateSimulatorSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  password: Joi.string().optional(),
  duration: Joi.number().integer().min(1).optional(),
  navigate: Joi.boolean().optional(),
  review: Joi.boolean().optional(),
  visibility: Joi.boolean().optional(),
  categoryQuestions: Joi.array()
    .items(Joi.object({
      categoryId: Joi.number().integer().required(),
      numberOfQuestions: Joi.number().integer().min(0).required(),
    }))
    .optional()
    .messages({
      'array.base': 'El campo de preguntas por categoría debe ser un arreglo.',
    }),
  number_of_questions: Joi.number().integer().min(0).optional(),
}).min(1);

const simulatorSchemaParams = Joi.object({
  id: Joi.string().min(3).required(),
});


export { createSimulatorSchema, simulatorSchemaParams, updateSimulatorSchema };
