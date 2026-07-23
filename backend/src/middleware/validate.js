const { sendError } = require('../utils/apiResponse');

function validate(schema, property = 'body') {
  return (request, response, next) => {
    const { error, value } = schema.validate(request[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return sendError(response, {
        statusCode: 400,
        message: 'Validation failed.',
        errors: error.details.map((detail) => detail.message)
      });
    }

    request[property] = value;
    return next();
  };
}

module.exports = {
  validate
};
