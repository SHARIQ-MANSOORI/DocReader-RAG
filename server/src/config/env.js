import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  queueName: process.env.QUEUE_NAME || 'file-upload-queue',
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    collectionName: process.env.QDRANT_COLLECTION || 'langchainjs-testing',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite',
  },
  uploadDir: process.env.UPLOAD_DIR || 'uploads/',
};
