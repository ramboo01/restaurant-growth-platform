const multer = require('multer');
const { sendError } = require('../utils/apiResponse');

function getMySqlStatusCode(error) {
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return 409;
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return 409;
    case 'ER_BAD_NULL_ERROR':
    case 'ER_TRUNCATED_WRONG_VALUE':
    case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
    case 'ER_WARN_DATA_OUT_OF_RANGE':
      return 400;
    default:
      return 500;
  }
}

function getMulterMessage(error) {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return 'Uploaded file exceeds the 5MB size limit.';
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Unexpected upload field.';
    default:
      return error.message || 'File upload failed.';
  }
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  console.error('[errorHandler] error:', error);
  console.error('[errorHandler] stack:', error.stack);

  if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
    return sendError(response, {
      statusCode: 401,
      message: 'Invalid or expired token.',
      errors: process.env.NODE_ENV !== 'production' && error.stack ? [error.stack] : []
    });
  }

  if (error instanceof multer.MulterError) {
    return sendError(response, {
      statusCode: 400,
      message: getMulterMessage(error),
      errors: process.env.NODE_ENV !== 'production' && error.stack ? [error.stack] : []
    });
  }

  if (error.code && String(error.code).startsWith('ER_')) {
    return sendError(response, {
      statusCode: getMySqlStatusCode(error),
      message: error.message || 'Database operation failed.',
      errors: process.env.NODE_ENV !== 'production' && error.stack ? [error.stack] : []
    });
  }

  if (error.statusCode) {
    return sendError(response, {
      statusCode: error.statusCode,
      message: error.message || 'Request failed.',
      errors: process.env.NODE_ENV !== 'production' && error.stack ? [error.stack] : []
    });
  }

  if (error.name === 'ValidationError') {
    return sendError(response, {
      statusCode: 400,
      message: error.message || 'Validation failed.',
      errors: process.env.NODE_ENV !== 'production' && error.stack ? [error.stack] : []
    });
  }

  return sendError(response, {
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : error.message,
    errors: process.env.NODE_ENV !== 'production' && error.stack ? [error.stack] : []
  });
}

module.exports = {
  errorHandler
};
