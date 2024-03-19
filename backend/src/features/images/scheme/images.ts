import Joi, { ObjectSchema } from 'joi';

const addImageSchema: ObjectSchema = Joi.object().keys({
  image: Joi.string().required().messages({
    'any.required': 'image is a required property'
  })
});

export { addImageSchema };
