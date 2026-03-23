/**
 * @mnemoai/vercel-ai — Mnemo memory tools for the Vercel AI SDK
 *
 * Usage:
 * ```typescript
 * import { generateText } from 'ai';
 * import { createMnemoTools } from '@mnemoai/vercel-ai';
 * import { createMnemo } from '@mnemoai/core';
 *
 * const mnemo = await createMnemo({ ... });
 * const tools = createMnemoTools(mnemo);
 *
 * const { text } = await generateText({
 *   model: yourModel,
 *   tools,
 *   prompt: 'What do you remember about the user?',
 * });
 * ```
 */

import { tool } from "ai";
import { z } from "zod";
import type { MnemoInstance } from "@mnemoai/core";

/**
 * Create Vercel AI SDK tools for memory store, recall, and delete.
 *
 * @param mnemo - A MnemoInstance created by `createMnemo()`
 * @param options - Optional configuration
 * @returns An object containing `memoryStore`, `memoryRecall`, and `memoryDelete` tools
 *
 * @example
 * ```typescript
 * const tools = createMnemoTools(mnemo);
 * // Use with generateText, streamText, or any AI SDK function
 * const { text } = await generateText({
 *   model: openai('gpt-4o'),
 *   tools,
 *   prompt: 'Remember that I prefer dark mode',
 * });
 * ```
 */
export function createMnemoTools(
  mnemo: MnemoInstance,
  options: {
    /** Maximum results for recall. Default: 5. */
    recallLimit?: number;
    /** Default scope for stored memories. Default: "global". */
    defaultScope?: string;
  } = {},
) {
  const { recallLimit = 5, defaultScope = "global" } = options;

  return {
    memoryStore: tool({
      description:
        "Store a piece of information in long-term memory. Use this when the user shares preferences, facts about themselves, decisions, or anything worth remembering for future conversations.",
      parameters: z.object({
        text: z.string().describe("The information to remember"),
        category: z
          .enum(["preference", "fact", "decision", "entity", "other", "reflection"])
          .default("fact")
          .describe("Category of the memory"),
        importance: z
          .number()
          .min(0)
          .max(1)
          .default(0.7)
          .describe("Importance score from 0.0 to 1.0"),
      }),
      execute: async ({ text, category, importance }) => {
        const { id } = await mnemo.store({
          text,
          category,
          importance,
          scope: defaultScope,
        });
        return { success: true, id, message: `Stored memory: "${text}"` };
      },
    }),

    memoryRecall: tool({
      description:
        "Search long-term memory for relevant information. Use this to recall what you know about the user, their preferences, past decisions, or any previously stored facts.",
      parameters: z.object({
        query: z.string().describe("What to search for in memory"),
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(recallLimit)
          .describe("Maximum number of results"),
      }),
      execute: async ({ query, limit }) => {
        const results = await mnemo.recall(query, { limit });
        if (results.length === 0) {
          return { found: false, memories: [], message: "No relevant memories found." };
        }
        return {
          found: true,
          count: results.length,
          memories: results.map((r) => ({
            text: r.text,
            score: Math.round(r.score * 100) / 100,
            category: r.category,
            importance: r.importance,
          })),
        };
      },
    }),

    memoryDelete: tool({
      description:
        "Delete a specific memory by ID. Use this when the user asks to forget something or when information is no longer relevant.",
      parameters: z.object({
        id: z.string().describe("The memory ID to delete"),
      }),
      execute: async ({ id }) => {
        const deleted = await mnemo.delete(id);
        return {
          success: deleted,
          message: deleted ? `Memory ${id} deleted.` : `Memory ${id} not found.`,
        };
      },
    }),
  };
}

export type MnemoTools = ReturnType<typeof createMnemoTools>;
