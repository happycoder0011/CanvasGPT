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

export const onRequestPost: PagesFunction = async (context) => {
  const apiKey = context.request.headers.get('X-API-Key');
  if (!apiKey) {
    return Response.json({ error: 'Missing API key. Add your Anthropic key in settings.' }, { status: 401 });
  }

  const req = await context.request.json() as AIRequest;

  if (!req.prompt || !req.blockId) {
    return Response.json({ error: 'Missing required fields: prompt, blockId' }, { status: 400 });
  }

  try {
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

          // Parse final action
          const actionMatch = fullText.match(/ACTION:\s*(\{[^}]+\})/);
          const contentMatch = fullText.match(/CONTENT:\n?([\s\S]*)/);

          let action: any = { action: 'replace', blockId: req.blockId, content: '' };
          if (actionMatch) {
            try {
              const parsed = JSON.parse(actionMatch[1]);
              action = { ...action, ...parsed, blockId: req.blockId };
            } catch {}
          }
          action.content = contentMatch ? contentMatch[1].trim() : fullText;

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'action', action })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return Response.json({ error: 'AI stream failed' }, { status: 500 });
  }
};
