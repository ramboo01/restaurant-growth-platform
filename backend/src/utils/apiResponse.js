function normalizeErrors(errors) {
  if (!errors) {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors.filter(Boolean);
  }

  return [errors].filter(Boolean);
}

function sendSuccess(response, { statusCode = 200, message = 'Request successful.', data = {} } = {}) {
  return response.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function sendError(response, { statusCode = 500, message = 'Request failed.', errors = [] } = {}) {
  return response.status(statusCode).json({
    success: false,
    message,
    errors: normalizeErrors(errors)
  });
}

function createErrorHandler(scope) {
  return (response, error) => {
    console.error(`[${scope}] error:`, error);
    console.error(`[${scope}] stack:`, error.stack);

    return sendError(response, {
      statusCode: error.statusCode || 500,
      message: error.message,
      errors: process.env.NODE_ENV !== 'production' && error.stack ? [error.stack] : []
    });
  };
}

module.exports = {
  sendSuccess,
  sendError,
  createErrorHandler
};
