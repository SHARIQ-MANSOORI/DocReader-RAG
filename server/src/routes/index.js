import { Router } from 'express';
import uploadRoutes from './upload.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

// Root health check endpoint: GET /
router.get('/', (req, res) => {
  return res.json({ status: 'All Good!' });
});

// Mounted sub-routes preserving existing endpoints
router.use('/upload', uploadRoutes); // /upload/pdf
router.use('/chat', chatRoutes);     // /chat

export default router;
