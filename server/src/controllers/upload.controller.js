import { addFileUploadJob } from '../services/queue.service.js';

/**
 * Controller for handling PDF file uploads.
 * Preserves the exact response contract: { message: 'uploaded' }
 */
export async function handlePdfUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No PDF file uploaded. Please attach a file using the field name "pdf".',
      });
    }

    await addFileUploadJob({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    });

    return res.json({ message: 'uploaded' });
  } catch (error) {
    return next(error);
  }
}
