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

interface AIAction {
  action: string;
  blockId: string;
  range?: { start: number; end: number };
  blockType?: string;
  content: string;
  meta?: Record<string, unknown>;
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

function parseAIResponse(text: string, blockId: string): AIAction {
  const actionMatch = text.match(/ACTION:\s*(\{[^}]+\})/);
  const contentMatch = text.match(/CONTENT:\n?([\s\S]*)/);

  let action: AIAction = { action: 'replace', blockId, content: '' };
  if (actionMatch) {
    try {
      const parsed = JSON.parse(actionMatch[1]);
      action = { ...action, ...parsed, blockId };
    } catch {}
  }
  action.content = contentMatch ? contentMatch[1].trim() : text;
  return action;
}

async function generateAnthropic(req: AIRequest, apiKey: string): Promise<AIAction> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt(req) }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseAIResponse(text, req.blockId);
}

async function generateGemini(req: AIRequest, apiKey: string): Promise<AIAction> {
  const userPrompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(req)}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json() as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseAIResponse(text, req.blockId);
}

export const onRequestPost: PagesFunction<{ GEMINI_API_KEY: string }> = async (context) => {
  const req = await context.request.json() as AIRequest;
  const provider = context.request.headers.get('X-Provider') ?? 'gemini-free';

  if (!req.prompt || !req.blockId) {
    return Response.json({ error: 'Missing required fields: prompt, blockId' }, { status: 400 });
  }

  try {
    let action: AIAction;

    if (provider === 'anthropic') {
      const apiKey = context.request.headers.get('X-API-Key');
      if (!apiKey) {
        return Response.json({ error: 'Missing Anthropic API key' }, { status: 401 });
      }
      action = await generateAnthropic(req, apiKey);
    } else {
      const geminiKey = context.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return Response.json({ error: 'Gemini API key not configured on server' }, { status: 500 });
      }
      action = await generateGemini(req, geminiKey);
    }

    return Response.json(action);
  } catch (error) {
    return Response.json({ error: 'AI generation failed' }, { status: 500 });
  }
};
