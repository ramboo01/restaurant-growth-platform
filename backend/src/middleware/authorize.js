const { verifyJwt } = require('../modules/auth/jwt.middleware');
const { sendError } = require('../utils/apiResponse');

function authorize(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((role) => String(role).trim().toLowerCase());

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

      const normalizedUserRole = String(userRole).trim().toLowerCase();

      if (normalizedUserRole !== 'admin' && !normalizedAllowed.includes(normalizedUserRole)) {
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
