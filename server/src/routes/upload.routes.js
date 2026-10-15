import { Router } from 'express';
import { uploadSinglePdf } from '../middleware/upload.middleware.js';
import { handlePdfUpload } from '../controllers/upload.controller.js';

const router = Router();

// Matches existing endpoint: POST /upload/pdf
router.post('/pdf', uploadSinglePdf, handlePdfUpload);

export default router;
