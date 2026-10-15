/**
 * Centralized 404 Not Found Handler
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Centralized Express Error Handler
 */
export function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  // Handle Multer upload limits
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File Too Large',
      message: 'The uploaded file exceeds the maximum allowed size.',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  return res.status(statusCode).json({
    error: err.name || 'Error',
    message,
  });
}
