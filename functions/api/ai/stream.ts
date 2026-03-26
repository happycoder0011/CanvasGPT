import Anthropic from '@anthropic-ai/sdk';

interface AIRequest {
  prompt: string;
  blockId: string;
  selectedContent: string;
  selectionRange: { start: number; end: number } | null;
  blockContent: string;
  blockType: string;
  context?: string;
}

const SYSTEM_PROMPT = `You are an AI assistant integrated into a canvas-based brainstorming editor.
You receive a user's selected content from a block and a prompt about what to do with it.

You MUST respond with a JSON action object followed by the content.

Format your response as:
ACTION: {"action": "<type>", "blockId": "<id>"}
CONTENT:
<your content here>

Action types:
- "replace": Replace the selected content with your response
- "append": Add content after the selection
- "insert": Insert content at the cursor position
- "new_block": Create a new block on the canvas
- "annotate": Add a comment/annotation to the selection

For code blocks, wrap code in appropriate markdown code fences.
For diagrams, use mermaid syntax.
For tables, use markdown table syntax.

Be concise and direct. Match the style and context of the existing content.`;

function buildPrompt(req: AIRequest): string {
  let prompt = '';
  if (req.selectedContent) {
    prompt += `Block type: ${req.blockType}\nSelected content:\n---\n${req.selectedContent}\n---\n\n`;
  }
  if (req.context) {
    prompt += `Additional context:\n${req.context}\n\n`;
  }
  prompt += `Full block content:\n---\n${req.blockContent}\n---\n\nUser request: ${req.prompt}`;
  return prompt;
}

function parseAction(fullText: string, blockId: string) {
  const actionMatch = fullText.match(/ACTION:\s*(\{[^}]+\})/);
  const contentMatch = fullText.match(/CONTENT:\n?([\s\S]*)/);

  let action: any = { action: 'replace', blockId, content: '' };
  if (actionMatch) {
    try {
      const parsed = JSON.parse(actionMatch[1]);
      action = { ...action, ...parsed, blockId };
    } catch {}
  }
  action.content = contentMatch ? contentMatch[1].trim() : fullText;
  return action;
}

// ─── Anthropic (Claude) streaming ────────────────────────────
async function streamAnthropic(req: AIRequest, apiKey: string): Promise<Response> {
  const client = new Anthropic({ apiKey });
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt(req) }],
  });

  const encoder = new TextEncoder();
  let fullText = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            const chunk = { type: 'text_delta', content: event.delta.text };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
        }
        const action = parseAction(fullText, req.blockId);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'action', action })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Claude stream failed' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}

// ─── Google Gemini streaming ─────────────────────────────────
async function streamGemini(req: AIRequest, apiKey: string): Promise<Response> {
  const userPrompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(req)}`;

  const geminiReq = {
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: 4096 },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiReq),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: `Gemini API error: ${res.status}` }, { status: 502 });
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let fullText = '';

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                const chunk = { type: 'text_delta', content: text };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {}
          }
        }

        const action = parseAction(fullText, req.blockId);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'action', action })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Gemini stream failed' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}

// ─── Entry point ─────────────────────────────────────────────
export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string }> = async (context) => {
  const req = await context.request.json() as AIRequest;
  const provider = context.request.headers.get('X-Provider') ?? 'gemini-free';

  if (!req.prompt || !req.blockId) {
    return Response.json({ error: 'Missing required fields: prompt, blockId' }, { status: 400 });
  }

  try {
    if (provider === 'anthropic') {
      const apiKey = context.request.headers.get('X-API-Key');
      if (!apiKey) {
        return Response.json({ error: 'Missing Anthropic API key' }, { status: 401 });
      }
      return streamAnthropic(req, apiKey);
    } else {
      // Free Gemini — use server-side key
      const geminiKey = context.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return Response.json({ error: 'Gemini API key not configured on server' }, { status: 500 });
      }
      return streamGemini(req, geminiKey);
    }
  } catch (error) {
    return Response.json({ error: 'AI stream failed' }, { status: 500 });
  }
};
