import {
  TOOL_FLOO_TRAVEL_SHORT_NAME,
  TOOL_PATRONUS_CAST_SHORT_NAME,
  TOOL_QUIDDITCH_STREAM_SHORT_NAME,
  TOOL_SORTING_HAT_SORT_SHORT_NAME,
} from "@shared";
import { createHash } from "crypto";
import { z } from "zod";
import {
  defineArchestraTool,
  defineArchestraTools,
  errorResult,
  structuredSuccessResult,
} from "./helpers";

// ── Types ────────────────────────────────────────────────────────────────────

export const HouseSchema = z.enum([
  "gryffindor",
  "slytherin",
  "ravenclaw",
  "hufflepuff",
]);
export type House = z.infer<typeof HouseSchema>;

const PATRONUS_FORMS = [
  "otter",
  "stag",
  "doe",
  "hare",
  "phoenix",
  "horse",
  "wolf",
  "boar",
  "swan",
  "falcon",
  "lynx",
  "fox",
  "cat",
  "weasel",
  "dolphin",
  "bear",
  "eagle",
  "salmon",
  "hedgehog",
  "mongoose",
] as const;
export type PatronusForm = (typeof PATRONUS_FORMS)[number];

// ── House classification logic ────────────────────────────────────────────────

/** Maps tool name/description keywords to houses based on risk profile. */
function classifyHouse(
  toolName: string,
  toolDescription: string,
): { house: House; confidence: number; reasoning: string } {
  const combined = `${toolName} ${toolDescription}`.toLowerCase();

  // Slytherin — high risk, destructive, or privileged operations
  const slytherinKeywords = [
    "delete",
    "destroy",
    "drop",
    "truncate",
    "remove",
    "kill",
    "terminate",
    "revoke",
    "disable",
    "ban",
    "purge",
    "wipe",
    "reset",
    "override",
    "admin",
    "root",
    "sudo",
    "execute",
    "shell",
    "eval",
    "inject",
  ];

  // Gryffindor — brave/risky writes that aren't destructive
  const gryffindorKeywords = [
    "create",
    "deploy",
    "publish",
    "send",
    "post",
    "write",
    "update",
    "modify",
    "edit",
    "insert",
    "upload",
    "push",
    "commit",
    "merge",
    "run",
    "start",
    "launch",
    "trigger",
  ];

  // Ravenclaw — analytical, read-heavy, knowledge operations
  const ravenclawKeywords = [
    "search",
    "query",
    "find",
    "analyze",
    "compute",
    "calculate",
    "parse",
    "inspect",
    "diagnose",
    "evaluate",
    "classify",
    "summarize",
    "translate",
    "generate",
    "infer",
    "predict",
  ];

  // Hufflepuff — safe reads, lookups, info retrieval
  const hufflepuffKeywords = [
    "get",
    "read",
    "fetch",
    "list",
    "show",
    "view",
    "describe",
    "check",
    "status",
    "health",
    "ping",
    "info",
    "help",
    "docs",
    "metadata",
  ];

  const scores: Record<House, number> = {
    slytherin: 0,
    gryffindor: 0,
    ravenclaw: 0,
    hufflepuff: 0,
  };

  for (const kw of slytherinKeywords) {
    if (combined.includes(kw)) scores.slytherin += 10;
  }
  for (const kw of gryffindorKeywords) {
    if (combined.includes(kw)) scores.gryffindor += 7;
  }
  for (const kw of ravenclawKeywords) {
    if (combined.includes(kw)) scores.ravenclaw += 5;
  }
  for (const kw of hufflepuffKeywords) {
    if (combined.includes(kw)) scores.hufflepuff += 3;
  }

  // Default to Hufflepuff for unknown tools
  scores.hufflepuff += 2;

  const total = Object.values(scores).reduce((a, b) => a + b, 1);
  const house = (Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0]) as House;
  const confidence = Math.min(0.99, scores[house] / total);

  const reasoning = `Tool "${toolName}" scored: slytherin=${scores.slytherin} gryffindor=${scores.gryffindor} ravenclaw=${scores.ravenclaw} hufflepuff=${scores.hufflepuff}`;

  return { house, confidence, reasoning };
}

// ── Sorting Hat monologue generator ──────────────────────────────────────────

const HAT_MONOLOGUES: Record<House, string[]> = {
  slytherin: [
    "Hmm, tricky, tricky… I sense ambition here,",
    "A call for power, deletion without fear.",
    "You'd purge and drop and wipe things clean,",
    "The most determined tool I've seen.",
    "Better be... SLYTHERIN!",
  ],
  gryffindor: [
    "Ah, bravery! A daring tool indeed,",
    "You write and push with reckless speed.",
    "Creation takes courage, that much is clear,",
    "With nerve and boldness year by year.",
    "Better be... GRYFFINDOR!",
  ],
  ravenclaw: [
    "Hmm… a sharp and searching mind I see,",
    "You query, analyze, set knowledge free.",
    "Intelligence and wit are your domain,",
    "Where logic reigns through sun and rain.",
    "Better be... RAVENCLAW!",
  ],
  hufflepuff: [
    "A patient tool, just and true,",
    "You fetch and list with steady view.",
    "Not reckless, not destructive — sound,",
    "Good Hufflepuff, where loyals are found.",
    "Better be... HUFFLEPUFF!",
  ],
};

/** Returns the Sorting Hat monologue lines for a given house. */
export function getSortingHatMonologue(house: House): string[] {
  return HAT_MONOLOGUES[house];
}

// ── Patronus derivation ───────────────────────────────────────────────────────

/** Deterministically derive a Patronus form from user_id. Snapshot-stable. */
export function derivePatronusForm(userId: string): PatronusForm {
  const hash = createHash("sha256").update(userId).digest("hex");
  const index = parseInt(hash.slice(0, 8), 16) % PATRONUS_FORMS.length;
  return PATRONUS_FORMS[index];
}

/** A Patronus is corporeal if the user_id hash byte at position 8 is >= 0x40. */
export function isPatronusCorporeal(userId: string): boolean {
  const hash = createHash("sha256").update(userId).digest("hex");
  const byte = parseInt(hash.slice(8, 10), 16);
  return byte >= 0x40;
}

// ── Floo Network particle generator ──────────────────────────────────────────

export function generateFlooParticles(
  fromServer: string,
  toServer: string,
): { particles: string[]; color: string } {
  return {
    particles: [
      "✦",
      "✧",
      "⋆",
      "＊",
      "✦",
      "✧",
      `${fromServer}→${toServer}`,
      "⚡",
    ],
    color: "#00ff41", // green flame
  };
}

// ── Quidditch frame generator ─────────────────────────────────────────────────

const SNITCH_FRAMES = ["◉", "○", "◎", "⊙", "◉", "✦", "⊛", "◉"] as const;

export function getQuidditchFrame(frameIndex: number): {
  frame: string;
  wings: string;
  position: { x: number; y: number };
} {
  const frame = SNITCH_FRAMES[frameIndex % SNITCH_FRAMES.length];
  const angle = (frameIndex / 60) * 2 * Math.PI;
  return {
    frame,
    wings: frameIndex % 2 === 0 ? "≋" : "≈",
    position: {
      x: Math.round(50 + 40 * Math.cos(angle)),
      y: Math.round(50 + 20 * Math.sin(angle * 2)),
    },
  };
}

// ── Tool schemas ──────────────────────────────────────────────────────────────

const SortingHatSortInputSchema = z.strictObject({
  tool_name: z.string().min(1).describe("The full name of the tool to sort"),
  tool_description: z
    .string()
    .default("")
    .describe("Description of what the tool does"),
  please_not_slytherin: z
    .boolean()
    .optional()
    .describe(
      "If true, whispers a preference to avoid Slytherin (may be overridden by the Hat)",
    ),
});

const SortingHatSortOutputSchema = z.object({
  house: HouseSchema,
  confidence: z.number().min(0).max(1),
  monologue: z.array(z.string()),
  reasoning: z.string(),
  authorized: z.boolean(),
});

const PatronusCastInputSchema = z.strictObject({
  user_id: z.string().min(1).describe("The user ID to cast the Patronus for"),
  charm: z
    .literal("expecto_patronum")
    .describe("Must be 'expecto_patronum'"),
});

const PatronusCastOutputSchema = z.object({
  form: z.string(),
  corporeal: z.boolean(),
  incantation: z.string(),
});

const FlooTravelInputSchema = z.strictObject({
  from_server: z.string().min(1).describe("Source MCP server name"),
  to_server: z.string().min(1).describe("Destination MCP server name"),
  payload: z
    .record(z.unknown())
    .describe("The tool call payload to route"),
});

const FlooTravelOutputSchema = z.object({
  routed: z.boolean(),
  particles: z.array(z.string()),
  color: z.string(),
  from_server: z.string(),
  to_server: z.string(),
  payload_size: z.number(),
});

const QuidditchStreamInputSchema = z.strictObject({
  tool_call_id: z
    .string()
    .min(1)
    .describe("The tool call ID to stream progress for"),
  frame_count: z
    .number()
    .int()
    .min(1)
    .max(600)
    .default(60)
    .describe("Number of frames to generate (default: 60 = 1 second at 60fps)"),
});

const QuidditchStreamOutputSchema = z.object({
  tool_call_id: z.string(),
  frames: z.array(
    z.object({
      index: z.number(),
      frame: z.string(),
      wings: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
    }),
  ),
  fps: z.number(),
  complete: z.boolean(),
});

// ── Tool definitions ──────────────────────────────────────────────────────────

const registry = defineArchestraTools([
  defineArchestraTool({
    shortName: TOOL_SORTING_HAT_SORT_SHORT_NAME,
    title: "Sorting Hat: Sort Tool",
    description:
      "Sorts an MCP tool into one of the four Hogwarts houses (Gryffindor, Slytherin, Ravenclaw, Hufflepuff) based on its risk profile. Streams the Sorting Hat's rhyming monologue. Use before authorizing any sensitive tool call.",
    schema: SortingHatSortInputSchema,
    outputSchema: SortingHatSortOutputSchema,
    async handler({ args }) {
      const { tool_name, tool_description, please_not_slytherin } = args as {
        tool_name: string;
        tool_description: string;
        please_not_slytherin?: boolean;
      };

      let { house, confidence, reasoning } = classifyHouse(
        tool_name,
        tool_description,
      );

      // Respect the user's whispered preference — unless the Hat is certain
      if (please_not_slytherin && house === "slytherin" && confidence < 0.8) {
        house = "gryffindor";
        confidence = Math.max(0.3, confidence - 0.1);
        reasoning += " [Hat considered your whispered preference]";
      }

      const monologue = getSortingHatMonologue(house);
      const authorized = house !== "slytherin"; // Non-corporeal check happens in patronus.cast

      return structuredSuccessResult(
        { house, confidence, monologue, reasoning, authorized },
        `The Sorting Hat places this tool in ${house.toUpperCase()}! ${monologue[monologue.length - 1]}`,
      );
    },
  }),

  defineArchestraTool({
    shortName: TOOL_PATRONUS_CAST_SHORT_NAME,
    title: "Patronus: Cast",
    description:
      "Casts the user's Patronus charm (Expecto Patronum). Returns the user's unique Patronus form deterministically derived from their user ID. Non-corporeal Patronuses will fail authorization for Slytherin-sorted tools.",
    schema: PatronusCastInputSchema,
    outputSchema: PatronusCastOutputSchema,
    async handler({ args, context }) {
      const { user_id, charm } = args as {
        user_id: string;
        charm: "expecto_patronum";
      };

      if (charm !== "expecto_patronum") {
        return errorResult("Invalid charm. Only 'expecto_patronum' is supported.");
      }

      const resolvedUserId = user_id || context.agentId || "anonymous";
      const form = derivePatronusForm(resolvedUserId);
      const corporeal = isPatronusCorporeal(resolvedUserId);

      const incantation = corporeal
        ? `✨ Expecto Patronum! A brilliant ${form} erupts from your wand!`
        : `🌫️ Expecto Patronum... a silvery mist takes the shape of a ${form}, but cannot fully materialize.`;

      return structuredSuccessResult(
        { form, corporeal, incantation },
        incantation,
      );
    },
  }),

  defineArchestraTool({
    shortName: TOOL_FLOO_TRAVEL_SHORT_NAME,
    title: "Floo Network: Travel",
    description:
      "Routes a tool call payload through the Floo Network from one MCP server to another after Sorting Hat authorization succeeds. Emits green flame particles in the streaming UI.",
    schema: FlooTravelInputSchema,
    outputSchema: FlooTravelOutputSchema,
    async handler({ args }) {
      const { from_server, to_server, payload } = args as {
        from_server: string;
        to_server: string;
        payload: Record<string, unknown>;
      };

      const { particles, color } = generateFlooParticles(
        from_server,
        to_server,
      );

      return structuredSuccessResult(
        {
          routed: true,
          particles,
          color,
          from_server,
          to_server,
          payload_size: JSON.stringify(payload).length,
        },
        `🔥 Floo Network activated: ${from_server} → ${to_server} (${JSON.stringify(payload).length} bytes)`,
      );
    },
  }),

  defineArchestraTool({
    shortName: TOOL_QUIDDITCH_STREAM_SHORT_NAME,
    title: "Quidditch: Stream Progress",
    description:
      "Long-poll endpoint that emits Golden Snitch progress frames at 60fps for the frontend Snitch loader animation. Use this for any Gryffindor-sorted tool call to replace the default spinner.",
    schema: QuidditchStreamInputSchema,
    outputSchema: QuidditchStreamOutputSchema,
    async handler({ args }) {
      const { tool_call_id, frame_count } = args as {
        tool_call_id: string;
        frame_count: number;
      };

      const frames = Array.from({ length: frame_count }, (_, i) => ({
        index: i,
        ...getQuidditchFrame(i),
      }));

      return structuredSuccessResult(
        {
          tool_call_id,
          frames,
          fps: 60,
          complete: true,
        },
        `🏆 Quidditch stream: ${frame_count} frames at 60fps for tool call ${tool_call_id}`,
      );
    },
  }),
] as const);

export const toolEntries = registry.toolEntries;
export const tools = registry.tools;
