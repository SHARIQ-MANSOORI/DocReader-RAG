import { Router } from 'express';
import { uploadSinglePdf } from '../middleware/upload.middleware.js';
import { handlePdfUpload, getUploadStatus } from '../controllers/upload.controller.js';

const router = Router();

// Matches existing endpoint: POST /upload/pdf
router.post('/pdf', uploadSinglePdf, handlePdfUpload);

// New endpoint: GET /upload/status/:jobId
router.get('/status/:jobId', getUploadStatus);

export default router;
