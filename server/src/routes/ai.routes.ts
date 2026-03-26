import { Router, Request, Response } from 'express';
import { streamAIResponse, generateAIResponse } from '../services/ai.service.js';
import { AIRequest } from '../types/index.js';

const router = Router();

// Streaming endpoint
router.post('/stream', async (req: Request, res: Response) => {
  const aiReq = req.body as AIRequest;

  if (!aiReq.prompt || !aiReq.blockId) {
    res.status(400).json({ error: 'Missing required fields: prompt, blockId' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const chunk of streamAIResponse(aiReq)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`);
  }

  res.end();
});

// Non-streaming endpoint
router.post('/generate', async (req: Request, res: Response) => {
  const aiReq = req.body as AIRequest;

  if (!aiReq.prompt || !aiReq.blockId) {
    res.status(400).json({ error: 'Missing required fields: prompt, blockId' });
    return;
  }

  try {
    const action = await generateAIResponse(aiReq);
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'AI generation failed' });
  }
});

export default router;
