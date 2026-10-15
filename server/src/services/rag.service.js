import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config/env.js';

/**
 * Returns the Gemini Chat Model instance.
 * Lazily instantiated so the server can boot even before an API key is provided.
 */
function getGeminiModel() {
  if (!config.gemini.apiKey) {
    const error = new Error('Missing GEMINI_API_KEY. Please set GEMINI_API_KEY in server/.env');
    error.status = 500;
    throw error;
  }

  return new ChatGoogleGenerativeAI({
    model: config.gemini.chatModel,
    apiKey: config.gemini.apiKey,
    temperature: 0.2,
  });
}

/**
 * Creates the vector store instance connected to Qdrant.
 */
async function getVectorStore() {
  if (!config.gemini.apiKey) {
    const error = new Error('Missing GEMINI_API_KEY. Please set GEMINI_API_KEY in server/.env');
    error.status = 500;
    throw error;
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: config.gemini.embeddingModel,
    apiKey: config.gemini.apiKey,
  });

  const client = new QdrantClient({
    url: config.qdrant.url,
    checkCompatibility: false,
  });

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === config.qdrant.collectionName);
    if (!exists) {
      await client.createCollection(config.qdrant.collectionName, {
        vectors: { size: 3072, distance: 'Cosine' },
      });
    }
  } catch (e) {
    // Collection already exists or connection check passed
  }

  return QdrantVectorStore.fromExistingCollection(embeddings, {
    client,
    url: config.qdrant.url,
    collectionName: config.qdrant.collectionName,
  });
}

const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemma-4-26b-a4b-it',
];

/**
 * Invokes Gemini LLM with automatic fallback cascade if the primary model hits
 * high demand (503) or rate limits (429).
 */
async function generateAnswerWithCascade(messages) {
  const primary = config.gemini.chatModel;
  const candidateModels = Array.from(new Set([primary, ...FALLBACK_MODELS]));

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: config.gemini.apiKey,
        temperature: 0.2,
        maxRetries: 1,
      });

      const result = await model.invoke(messages);
      const content = typeof result.content === 'string'
        ? result.content
        : Array.isArray(result.content)
        ? result.content.map((c) => c.text || '').join('\n')
        : String(result.content || '');

      return { content, modelUsed: modelName };
    } catch (err) {
      lastError = err;
      console.warn(`[RAG Cascade] Model "${modelName}" failed (${err.status || err.message?.slice(0, 50)}). Trying fallback...`);
    }
  }

  throw lastError;
}

/**
 * Executes similarity search and generates answer via Gemini LLM.
 * Preserves the exact retrieval parameters, prompt template, and output shape.
 */
export async function executeRAGQuery(userQuery) {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever({
    k: 2,
  });

  const docs = await retriever.invoke(userQuery);

  const SYSTEM_PROMPT = `
  You are a helpful AI Assistant who answers the user query based on the available context from the PDF file.
  Context:
  ${JSON.stringify(docs)}
  `;

  try {
    const { content } = await generateAnswerWithCascade([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuery },
    ]);

    return {
      message: content,
      docs,
    };
  } catch (err) {
    console.error('[RAG Error] All models in cascade failed:', err.message);
    return {
      message: '⚠️ Google Gemini is temporarily experiencing high server demand or daily quota limits. Please try asking again in a few moments, or check your API key quota at https://aistudio.google.com/.',
      docs,
    };
  }
}

