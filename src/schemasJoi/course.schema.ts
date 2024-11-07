import Joi from "joi"

const courseSchemaParams = Joi.object({
  id: Joi.string().min(3).required()
});

const courseSchemaCreateUpdate = Joi.object({
  name: Joi.string().required(),
  university: Joi.string().required(),
  schedule: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  cost: Joi.number().required(),
  paymentOptions: Joi.array().items(Joi.string()).required(),
  syllabus: Joi.array().items(Joi.string()).required(),
  benefits: Joi.array().items(Joi.string()).required(),
  phone: Joi.string().required(),
  inPersonSchedules: Joi.array().items(Joi.string()).required(),
  virtualSchedules: Joi.array().items(Joi.string()).required(),

})

export { courseSchemaParams, courseSchemaCreateUpdate };
