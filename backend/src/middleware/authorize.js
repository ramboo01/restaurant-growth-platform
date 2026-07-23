const { verifyJwt } = require('../modules/auth/jwt.middleware');
const { sendError } = require('../utils/apiResponse');

function authorize(...allowedRoles) {
  return [
    verifyJwt,
    (request, response, next) => {
      const userRole = request.user?.role;

      if (!userRole) {
        return sendError(response, {
          statusCode: 403,
          message: 'Forbidden. User role is missing.'
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return sendError(response, {
          statusCode: 403,
          message: 'Forbidden. Insufficient permissions.'
        });
      }

      return next();
    }
  ];
}

module.exports = {
  authorize
};
