const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadRoot = path.join(__dirname, '..', '..', 'uploads', 'menu');

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination(request, file, callback) {
    callback(null, uploadRoot);
  },
  filename(request, file, callback) {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    callback(null, `${uniquePrefix}-${safeName}`);
  }
});

function fileFilter(request, file, callback) {
  if (!file.mimetype.startsWith('image/')) {
    const error = new Error('Only image files are allowed.');
    error.statusCode = 400;
    return callback(error, false);
  }

  return callback(null, true);
}

const uploadMenuImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  uploadMenuImage
};
