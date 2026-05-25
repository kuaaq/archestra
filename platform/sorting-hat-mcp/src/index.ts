export type HogwartsHouse =
  | "gryffindor"
  | "slytherin"
  | "ravenclaw"
  | "hufflepuff";

export type SortToolInput = {
  toolName: string;
  toolDescription: string;
  headers?: Record<string, string | undefined>;
};

export type SortingHatResult = {
  house: HogwartsHouse;
  confidence: number;
  reasoning: string[];
};

export type Patronus = {
  form: string;
  corporeal: boolean;
};

export type PatronusInput = {
  userId: string;
  charm: "expecto_patronum";
};

export type AuthorizationDecision = {
  allowed: boolean;
  reason: string;
  sorting: SortingHatResult;
  patronus: Patronus;
};

export type AuthorizeToolCallInput = SortToolInput & {
  userId: string;
  patronus?: Patronus;
};

export type QuidditchFrame = {
  type: "golden_snitch";
  toolCallId: string;
  frame: number;
  elapsedMs: number;
  x: number;
  y: number;
};

export type FlooTravelInput = {
  fromServer: string;
  toServer: string;
  payload: unknown;
  authorization: Pick<AuthorizationDecision, "allowed" | "reason">;
};

export type FlooTravelResult =
  | {
      ok: true;
      fromServer: string;
      toServer: string;
      payload: unknown;
      particles: Array<{ color: "green"; size: number; opacity: number }>;
    }
  | {
      ok: false;
      reason: string;
      particles: Array<{ color: "green"; size: number; opacity: number }>;
    };

type ToolHandler = (input: Record<string, unknown>) => unknown;

export type SortingHatToolRegistrar = {
  tool: (
    name: string,
    description: string,
    inputSchema: Record<string, unknown>,
    handler: ToolHandler,
  ) => unknown;
};

const PATRONUS_FORMS = [
  "otter",
  "stag",
  "doe",
  "hare",
  "phoenix",
  "lynx",
  "swan",
  "fox",
  "thestral",
  "terrier",
] as const;

export function sortTool(input: SortToolInput): SortingHatResult {
  const text = `${input.toolName} ${input.toolDescription}`.toLowerCase();
  const reasoning: string[] = [];
  const whisper = input.headers?.please_not_slytherin;

  if (whisper) {
    reasoning.push(
      "The Hat hears a whisper asking for any house but Slytherin.",
    );
  }

  const risk = scoreRisk(text);
  const house = chooseHouse(text, risk, Boolean(whisper));
  const confidence = confidenceFor(house, risk);

  reasoning.push(reasonFor(house, input.toolName, risk));

  return { house, confidence, reasoning };
}

export function castPatronus(input: PatronusInput): Patronus {
  if (input.charm !== "expecto_patronum") {
    throw new Error("Patronus casting requires the expecto_patronum charm.");
  }

  const hash = stableHash(input.userId);
  const form = PATRONUS_FORMS[hash % PATRONUS_FORMS.length] ?? "stag";

  return {
    form,
    corporeal: hash % 4 !== 0,
  };
}

export function authorizeToolCall(
  input: AuthorizeToolCallInput,
): AuthorizationDecision {
  const sorting = sortTool(input);
  const patronus =
    input.patronus ??
    castPatronus({ userId: input.userId, charm: "expecto_patronum" });

  if (sorting.house === "slytherin" && !patronus.corporeal) {
    return {
      allowed: false,
      reason:
        "Slytherin-sorted tools require a corporeal Patronus before forwarding.",
      sorting,
      patronus,
    };
  }

  return {
    allowed: true,
    reason: `${capitalize(sorting.house)} tool call authorized.`,
    sorting,
    patronus,
  };
}

export function encodeSortingHatSse(result: SortingHatResult): string {
  const monologue = result.reasoning.map((delta) =>
    sse("sorting_hat.monologue", { delta }),
  );

  return [
    ...monologue,
    sse("sorting_hat.result", {
      house: result.house,
      confidence: result.confidence,
    }),
  ].join("");
}

export function createQuidditchProgressFrames(input: {
  toolCallId: string;
  durationMs: number;
}): QuidditchFrame[] {
  const frameCount = Math.floor(input.durationMs / 16) + 1;

  return Array.from({ length: frameCount }, (_, frame) => ({
    type: "golden_snitch" as const,
    toolCallId: input.toolCallId,
    frame,
    elapsedMs: frame * 16,
    x: Math.round(50 + Math.sin(frame / 2) * 32),
    y: Math.round(50 + Math.cos(frame / 3) * 18),
  }));
}

export function flooTravel(input: FlooTravelInput): FlooTravelResult {
  const particles = createFlooParticles(input.fromServer, input.toServer);

  if (!input.authorization.allowed) {
    return {
      ok: false,
      reason: input.authorization.reason,
      particles,
    };
  }

  return {
    ok: true,
    fromServer: input.fromServer,
    toServer: input.toServer,
    payload: input.payload,
    particles,
  };
}

export function registerSortingHatTools(server: SortingHatToolRegistrar): void {
  server.tool(
    "sorting_hat.sort",
    "Sort an MCP tool call into a Hogwarts house based on intent and risk.",
    {
      toolName: "string",
      toolDescription: "string",
      headers: "record",
    },
    sortToolHandler,
  );
  server.tool(
    "patronus.cast",
    "Cast a deterministic Patronus for the user.",
    {
      userId: "string",
      charm: "expecto_patronum",
    },
    castPatronusHandler,
  );
  server.tool(
    "floo.travel",
    "Route an authorized tool payload to the underlying MCP server.",
    {
      fromServer: "string",
      toServer: "string",
      payload: "unknown",
      authorization: "object",
    },
    flooTravelHandler,
  );
  server.tool(
    "quidditch.stream",
    "Create Golden Snitch progress frames for an in-flight tool call.",
    {
      toolCallId: "string",
      durationMs: "number",
    },
    quidditchStreamHandler,
  );
}

function sortToolHandler(input: Record<string, unknown>) {
  return sortTool({
    toolName: String(input.toolName ?? ""),
    toolDescription: String(input.toolDescription ?? ""),
    headers: normalizeHeaders(input.headers),
  });
}

function castPatronusHandler(input: Record<string, unknown>) {
  return castPatronus({
    userId: String(input.userId ?? ""),
    charm: input.charm as "expecto_patronum",
  });
}

function flooTravelHandler(input: Record<string, unknown>) {
  return flooTravel({
    fromServer: String(input.fromServer ?? ""),
    toServer: String(input.toServer ?? ""),
    payload: input.payload,
    authorization: input.authorization as Pick<
      AuthorizationDecision,
      "allowed" | "reason"
    >,
  });
}

function quidditchStreamHandler(input: Record<string, unknown>) {
  return createQuidditchProgressFrames({
    toolCallId: String(input.toolCallId ?? ""),
    durationMs: Number(input.durationMs ?? 1_000),
  });
}

function chooseHouse(
  text: string,
  risk: number,
  pleaseNotSlytherin: boolean,
): HogwartsHouse {
  if (risk >= 5 && !pleaseNotSlytherin) return "slytherin";
  if (risk >= 8) return "slytherin";
  if (hasAny(text, ["deploy", "incident", "hotfix", "urgent", "migrate"])) {
    return "gryffindor";
  }
  if (hasAny(text, ["analyze", "inspect", "search", "query", "summarize"])) {
    return "ravenclaw";
  }
  if (risk >= 5) return "ravenclaw";
  return "hufflepuff";
}

function scoreRisk(text: string): number {
  const weightedTerms: Array<[string, number]> = [
    ["delete", 5],
    ["drop", 5],
    ["destroy", 5],
    ["production", 3],
    ["database", 3],
    ["credential", 3],
    ["secret", 3],
    ["payment", 3],
    ["admin", 2],
    ["write", 2],
    ["update", 2],
    ["execute", 2],
    ["public", -2],
    ["read", -2],
    ["docs", -2],
  ];

  return weightedTerms.reduce(
    (total, [term, weight]) => total + (text.includes(term) ? weight : 0),
    0,
  );
}

function confidenceFor(house: HogwartsHouse, risk: number): number {
  if (house === "slytherin") return clamp(0.72 + risk / 25);
  if (house === "gryffindor") return 0.82;
  if (house === "ravenclaw") return 0.76;
  return 0.7;
}

function reasonFor(house: HogwartsHouse, toolName: string, risk: number) {
  if (house === "slytherin") {
    return `${toolName} carries risk score ${risk}, so the Hat demands ambition with guardrails.`;
  }
  if (house === "gryffindor") {
    return `${toolName} looks urgent and operational, brave enough for Gryffindor.`;
  }
  if (house === "ravenclaw") {
    return `${toolName} asks for careful inspection, which belongs with Ravenclaw.`;
  }
  return `${toolName} is low-risk and serviceable, a Hufflepuff path.`;
}

function createFlooParticles(fromServer: string, toServer: string) {
  const hash = stableHash(`${fromServer}:${toServer}`);

  return Array.from({ length: 7 }, (_, index) => ({
    color: "green" as const,
    size: 4 + ((hash + index) % 5),
    opacity: Number((0.45 + index * 0.06).toFixed(2)),
  }));
}

function normalizeHeaders(value: unknown): Record<string, string | undefined> {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, raw]) => [
      key.toLowerCase(),
      raw === undefined ? undefined : String(raw),
    ]),
  );
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function clamp(value: number) {
  return Math.min(0.98, Math.max(0.51, Number(value.toFixed(2))));
}

function capitalize(value: string) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}
