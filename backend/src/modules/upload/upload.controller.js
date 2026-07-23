const { sendSuccess, sendError } = require('../../utils/apiResponse');

function uploadMenuImage(request, response) {
  if (!request.file) {
    return sendError(response, {
      statusCode: 400,
      message: 'Image file is required.'
    });
  }

  return sendSuccess(response, {
    statusCode: 201,
    message: 'Menu image uploaded successfully.',
    data: {
      path: `uploads/menu/${request.file.filename}`
    }
  });
}

module.exports = {
  uploadMenuImage
};
