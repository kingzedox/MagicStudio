import express from 'express';
import { createServer as createViteServer } from 'vite';
import generateHandler from './api/generate.js';
import dotenv from 'dotenv';
dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  
  // Route /api/generate to the vercel serverless function
  app.post('/api/generate', (req, res) => {
    // Express req/res are compatible enough with VercelRequest/VercelResponse for this
    return generateHandler(req as any, res as any);
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);

  app.listen(5173, () => {
    console.log('Local dev server running at http://localhost:5173');
  });
}
startServer();
