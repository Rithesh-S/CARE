const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `issue-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  
  const commonImageExts = [
    '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', 
    '.bmp', '.gif', '.tiff', '.tif', '.svg', '.avif', 
    '.jfif', '.pjpeg', '.pjp', '.ico', '.raw', '.dng', '.cr2', '.nef', '.arw'
  ];

  // Accept any standard or mobile image mimetype, octet-stream with image extension, or any common image format
  if (
    mime.startsWith('image/') || 
    mime === 'application/octet-stream' ||
    commonImageExts.includes(ext) ||
    !ext
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type (${file.mimetype || ext}). All image formats (JPG, PNG, WEBP, HEIC, GIF, BMP, SVG, TIFF, AVIF, RAW) are accepted.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB max file size for high-res/raw captures
  }
});

module.exports = {
  upload,
  uploadsDir
};
