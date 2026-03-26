import Anthropic from '@anthropic-ai/sdk';
import { AIRequest, AIAction, AIStreamChunk, BlockType } from '../types/index.js';

const client = new Anthropic();

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
    prompt += `Block type: ${req.blockType}\n`;
    prompt += `Selected content:\n---\n${req.selectedContent}\n---\n\n`;
  }

  if (req.context) {
    prompt += `Additional context:\n${req.context}\n\n`;
  }

  prompt += `Full block content:\n---\n${req.blockContent}\n---\n\n`;
  prompt += `User request: ${req.prompt}`;

  return prompt;
}

function parseAIResponse(text: string, blockId: string): { action: AIAction; content: string } {
  const actionMatch = text.match(/ACTION:\s*(\{[^}]+\})/);
  const contentMatch = text.match(/CONTENT:\n?([\s\S]*)/);

  let action: AIAction = {
    action: 'replace',
    blockId,
    content: '',
  };

  if (actionMatch) {
    try {
      const parsed = JSON.parse(actionMatch[1]);
      action = { ...action, ...parsed, blockId };
    } catch {}
  }

  const content = contentMatch ? contentMatch[1].trim() : text;
  action.content = content;

  return { action, content };
}

export async function* streamAIResponse(req: AIRequest): AsyncGenerator<AIStreamChunk> {
  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildPrompt(req) }
      ],
    });

    let fullText = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullText += event.delta.text;
        yield { type: 'text_delta', content: event.delta.text };
      }
    }

    const { action } = parseAIResponse(fullText, req.blockId);
    yield { type: 'action', action };
    yield { type: 'done' };

  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function generateAIResponse(req: AIRequest): Promise<AIAction> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildPrompt(req) }
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const { action } = parseAIResponse(text, req.blockId);
  return action;
}
