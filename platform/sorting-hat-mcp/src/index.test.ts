import {
  authorizeToolCall,
  castPatronus,
  createQuidditchProgressFrames,
  encodeSortingHatSse,
  flooTravel,
  registerSortingHatTools,
  type SortingHatToolRegistrar,
  sortTool,
} from "./index.js";

describe("sorting_hat.sort", () => {
  test("classifies destructive tools as Slytherin and low-risk reads as Hufflepuff", () => {
    expect(
      sortTool({
        toolName: "delete_database",
        toolDescription: "Irreversibly deletes production database rows",
      }),
    ).toMatchObject({ house: "slytherin" });

    expect(
      sortTool({
        toolName: "read_docs",
        toolDescription: "Reads public documentation and returns a summary",
      }),
    ).toMatchObject({ house: "hufflepuff" });
  });

  test("respects the please_not_slytherin whisper for non-destructive tools", () => {
    const result = sortTool({
      toolName: "inspect_admin_policy",
      toolDescription: "Inspect admin policy metadata without making changes",
      headers: { please_not_slytherin: "true" },
    });

    expect(result.house).not.toBe("slytherin");
    expect(result.reasoning.join(" ")).toContain("whisper");
  });
});

describe("patronus.cast", () => {
  test("returns a deterministic Patronus form for a user id", () => {
    const first = castPatronus({
      userId: "user_albus",
      charm: "expecto_patronum",
    });
    const second = castPatronus({
      userId: "user_albus",
      charm: "expecto_patronum",
    });

    expect(second).toEqual(first);
    expect(first.form.length).toBeGreaterThan(0);
  });

  test("rejects charms other than expecto_patronum", () => {
    expect(() =>
      castPatronus({ userId: "user_albus", charm: "accio" as never }),
    ).toThrow("expecto_patronum");
  });
});

describe("tool authorization", () => {
  test("blocks Slytherin-sorted tools when the Patronus is non-corporeal", () => {
    const decision = authorizeToolCall({
      userId: "user_neville",
      toolName: "delete_database",
      toolDescription: "Permanently delete a customer database",
      patronus: { form: "mist", corporeal: false },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("corporeal Patronus");
  });

  test("allows low-risk Hufflepuff tools without requiring a corporeal Patronus", () => {
    const decision = authorizeToolCall({
      userId: "user_neville",
      toolName: "read_docs",
      toolDescription: "Read public docs",
      patronus: { form: "mist", corporeal: false },
    });

    expect(decision.allowed).toBe(true);
  });
});

describe("streaming helpers", () => {
  test("encodes Sorting Hat monologue chunks as SSE events", () => {
    const result = sortTool({
      toolName: "deploy_hotfix",
      toolDescription: "Deploy a time-sensitive production hotfix",
    });

    const sse = encodeSortingHatSse(result);

    expect(sse).toContain("event: sorting_hat.monologue");
    expect(sse).toContain("event: sorting_hat.result");
    expect(sse).toContain(result.house);
  });

  test("creates Snitch-shaped progress frames at a 60fps cadence", () => {
    const frames = createQuidditchProgressFrames({
      toolCallId: "tool_call_1",
      durationMs: 50,
    });

    expect(frames).toHaveLength(4);
    expect(frames[0]).toMatchObject({
      type: "golden_snitch",
      toolCallId: "tool_call_1",
      frame: 0,
      elapsedMs: 0,
    });
    expect(frames[1]?.elapsedMs).toBe(16);
  });

  test("routes authorized payloads through Floo travel with green flame particles", () => {
    const result = flooTravel({
      fromServer: "sorting-hat-mcp",
      toServer: "github",
      payload: { action: "read_issue" },
      authorization: { allowed: true, reason: "Hufflepuff tools are safe" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected Floo travel to be authorized");
    expect(
      result.particles.every((particle) => particle.color === "green"),
    ).toBe(true);
    expect(result.payload).toEqual({ action: "read_issue" });
  });
});

describe("MCP tool registration", () => {
  test("registers the four Sorting Hat MCP tools", () => {
    const names: string[] = [];
    const registrar: SortingHatToolRegistrar = {
      tool(name) {
        names.push(name);
      },
    };

    registerSortingHatTools(registrar);

    expect(names).toEqual([
      "sorting_hat.sort",
      "patronus.cast",
      "floo.travel",
      "quidditch.stream",
    ]);
  });
});
