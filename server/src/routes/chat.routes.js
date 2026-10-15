import { Router } from 'express';
import { handleChatQuery } from '../controllers/chat.controller.js';

const router = Router();

// Matches existing endpoint: GET /chat
router.get('/', handleChatQuery);

export default router;
