import app from './src/app.js';
import { config } from './src/config/env.js';
import { closeQueue } from './src/services/queue.service.js';

const server = app.listen(config.port, () => {
  console.log(`Server started on PORT:${config.port}`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down server...`);
  server.close(async () => {
    try {
      await closeQueue();
      console.log('Connections closed cleanly. Server shut down.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
