import { Queue } from 'bullmq';
import { config } from '../config/env.js';

export const fileUploadQueue = new Queue(config.queueName, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

/**
 * Adds an uploaded PDF to the processing queue.
 * Maintains the exact existing job format: 'file-ready' with JSON payload.
 */
export async function addFileUploadJob({ filename, destination, path }) {
  return fileUploadQueue.add(
    'file-ready',
    JSON.stringify({
      filename,
      destination,
      path,
    })
  );
}

/**
 * Closes queue connection during shutdown.
 */
export async function closeQueue() {
  await fileUploadQueue.close();
}
