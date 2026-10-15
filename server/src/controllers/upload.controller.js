import { addFileUploadJob, fileUploadQueue } from '../services/queue.service.js';

/**
 * Controller for handling PDF file uploads.
 * Returns { message: 'uploaded', jobId, filename, docId }
 */
export async function handlePdfUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No PDF file uploaded. Please attach a file using the field name "pdf".',
      });
    }

    const docId = req.file.filename;

    const job = await addFileUploadJob({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
      docId,
    });

    return res.json({
      message: 'uploaded',
      jobId: job.id,
      filename: req.file.originalname,
      docId,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Controller for checking the processing status of an uploaded PDF job.
 */
export async function getUploadStatus(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = await fileUploadQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Job ${jobId} not found.`,
      });
    }

    const state = await job.getState(); // 'waiting' | 'active' | 'completed' | 'failed'

    return res.json({
      jobId,
      state,
      failedReason: job.failedReason || null,
    });
  } catch (error) {
    return next(error);
  }
}
