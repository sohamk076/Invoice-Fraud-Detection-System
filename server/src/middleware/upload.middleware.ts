import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { APP_CONFIG } from '../config/constants';

const uploadDir = path.join(process.cwd(), APP_CONFIG.UPLOAD_DIR);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file format (${file.mimetype}). Please upload an Indian GST invoice in PDF, PNG, or JPEG format.`
      )
    );
  }
};

export const uploadInvoiceFile = multer({
  storage,
  limits: {
    fileSize: APP_CONFIG.MAX_FILE_SIZE_BYTES, // 10 MB
  },
  fileFilter,
});
