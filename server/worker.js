import { Worker } from 'bullmq';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { config } from './src/config/env.js';

/**
 * Background worker for processing uploaded PDF files.
 * Preserves the exact queue name, connection, and vector indexing operations.
 */
const worker = new Worker(
  config.queueName,
  async (job) => {
    console.log(`[Worker] Processing Job ID ${job.id}:`, job.data);
    const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;

    // Load the PDF
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: config.gemini.embeddingModel,
      apiKey: config.gemini.apiKey,
    });

    const client = new QdrantClient({
      url: config.qdrant.url,
      checkCompatibility: false,
    });

    // Ensure collection exists with vector size 3072
    try {
      const collections = await client.getCollections();
      const exists = collections.collections.some((c) => c.name === config.qdrant.collectionName);
      if (!exists) {
        await client.createCollection(config.qdrant.collectionName, {
          vectors: { size: 3072, distance: 'Cosine' },
        });
        console.log(`[Worker] Created Qdrant collection "${config.qdrant.collectionName}" with vector size 3072.`);
      }

      // Ensure payload indexes exist for strict document isolation filtering
      await client.createPayloadIndex(config.qdrant.collectionName, {
        field_name: 'metadata.docId',
        field_schema: 'keyword',
      }).catch(() => {});
      await client.createPayloadIndex(config.qdrant.collectionName, {
        field_name: 'metadata.filename',
        field_schema: 'keyword',
      }).catch(() => {});
    } catch (e) {
      // Collection already exists or connection check passed
    }

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        client,
        url: config.qdrant.url,
        collectionName: config.qdrant.collectionName,
      }
    );

    const docId = data.docId || data.filename;
    docs.forEach((doc) => {
      doc.metadata = {
        ...doc.metadata,
        filename: data.filename,
        docId: docId,
      };
    });

    await vectorStore.addDocuments(docs);
    console.log(`[Worker] Successfully added ${docs.length} documents from "${data.filename}" (docId: ${docId}) to vector store.`);
  },
  {
    concurrency: 100,
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
});

// Graceful shutdown handling
async function shutdownWorker(signal) {
  console.log(`\n[Worker] Received ${signal}. Shutting down worker...`);
  await worker.close();
  console.log('[Worker] Worker stopped cleanly.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdownWorker('SIGTERM'));
process.on('SIGINT', () => shutdownWorker('SIGINT'));

export default worker;
