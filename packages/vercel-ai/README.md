# @mnemoai/vercel-ai

Mnemo memory tools for the [Vercel AI SDK](https://ai-sdk.dev). Give your AI agents long-term memory in 3 lines.

## Installation

```bash
npm install @mnemoai/core @mnemoai/vercel-ai ai zod
```

## Quick Start

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createMnemo } from '@mnemoai/core';
import { createMnemoTools } from '@mnemoai/vercel-ai';

// Create memory instance
const mnemo = await createMnemo({
  embedding: {
    provider: 'openai-compatible',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
  dbPath: './agent-memory',
});

// Create AI SDK tools
const tools = createMnemoTools(mnemo);

// Use with any AI SDK function
const { text } = await generateText({
  model: openai('gpt-4o'),
  tools,
  prompt: 'Remember that I prefer TypeScript over JavaScript',
});
```

The AI will automatically use `memoryStore` to save the preference, and `memoryRecall` in future conversations to retrieve it.

## Tools

### `memoryStore`
Stores information in long-term memory. The AI uses this when users share preferences, facts, or decisions.

### `memoryRecall`
Searches memory for relevant information. The AI uses this to recall what it knows about the user.

### `memoryDelete`
Deletes a memory by ID. The AI uses this when asked to forget something.

## Options

```typescript
const tools = createMnemoTools(mnemo, {
  recallLimit: 10,          // max results per recall (default: 5)
  defaultScope: 'user:123', // scope for multi-user isolation (default: 'global')
});
```

## Links

- [Mnemo Documentation](https://docs.m-nemo.ai)
- [GitHub](https://github.com/Methux/mnemo)
- [npm: @mnemoai/core](https://www.npmjs.com/package/@mnemoai/core)
