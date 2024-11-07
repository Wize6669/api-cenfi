import Joi from "joi";

const categorySchemaParams = Joi.object({
  id: Joi.number().integer().min(1).required()
});

const categorySchemaCreateUpdate = Joi.object({
  name: Joi.string().min(3).max(80).required(),
  superCategoryId: Joi.number().optional()
});

export { categorySchemaParams, categorySchemaCreateUpdate };
