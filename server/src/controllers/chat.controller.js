import { executeRAGQuery } from '../services/rag.service.js';

/**
 * Controller for handling chat queries over ingested PDFs.
 * Preserves the exact response contract: { message, docs }
 */
export async function handleChatQuery(req, res, next) {
  try {
    const userQuery = req.query.message;
    const filename = req.query.filename;
    const docId = req.query.docId;

    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "message" is required.',
      });
    }

    console.log(`[ChatController] Incoming query: "${userQuery.trim()}" (document: "${filename || docId || 'none'}")`);
    const result = await executeRAGQuery(userQuery.trim(), { filename, docId });
    console.log(`[ChatController] Query answered with ${result.docs?.length || 0} docs.`);

    return res.json({
      message: result.message,
      docs: result.docs,
    });
  } catch (error) {
    console.error('[ChatController] Error processing chat query:', error);
    return next(error);
  }
}
