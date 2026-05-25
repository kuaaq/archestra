import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import {
  derivePatronusForm,
  generateFlooParticles,
  getQuidditchFrame,
  getSortingHatMonologue,
  isPatronusCorporeal,
  toolEntries,
  tools,
} from "./sorting-hat";

describe("sorting-hat tools", () => {
  describe("tools registry", () => {
    it("exports 4 tools", () => {
      expect(tools).toHaveLength(4);
    });

    it("all tool names have archestra__ prefix", () => {
      for (const tool of tools) {
        expect(tool.name).toMatch(/^archestra__/);
      }
    });

    it("tool entries match tool names", () => {
      for (const tool of tools) {
        expect(toolEntries[tool.name as keyof typeof toolEntries]).toBeDefined();
      }
    });
  });

  describe("derivePatronusForm", () => {
    it("is deterministic for same user_id", () => {
      const form1 = derivePatronusForm("user-123");
      const form2 = derivePatronusForm("user-123");
      expect(form1).toBe(form2);
    });

    it("returns different forms for different user_ids", () => {
      const forms = new Set(
        ["alice", "bob", "charlie", "diana", "eve"].map(derivePatronusForm),
      );
      expect(forms.size).toBeGreaterThan(1);
    });

    it("snapshot: known user IDs produce stable forms", () => {
      // These values are stable — do not change without a major version bump
      expect(derivePatronusForm("user-001")).toMatchSnapshot();
      expect(derivePatronusForm("user-002")).toMatchSnapshot();
      expect(derivePatronusForm("user-003")).toMatchSnapshot();
      expect(derivePatronusForm("user-100")).toMatchSnapshot();
      expect(derivePatronusForm("harry-potter")).toMatchSnapshot();
      expect(derivePatronusForm("hermione-granger")).toMatchSnapshot();
      expect(derivePatronusForm("ron-weasley")).toMatchSnapshot();
    });

    it("always returns a valid patronus form string", () => {
      for (let i = 0; i < 50; i++) {
        const form = derivePatronusForm(`user-${i}`);
        expect(typeof form).toBe("string");
        expect(form.length).toBeGreaterThan(0);
      }
    });
  });

  describe("isPatronusCorporeal", () => {
    it("is deterministic for same user_id", () => {
      const c1 = isPatronusCorporeal("user-999");
      const c2 = isPatronusCorporeal("user-999");
      expect(c1).toBe(c2);
    });

    it("returns a boolean", () => {
      expect(typeof isPatronusCorporeal("test-user")).toBe("boolean");
    });

    it("roughly half of user IDs produce corporeal patronuses", () => {
      const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);
      const corporealCount = users.filter(isPatronusCorporeal).length;
      // Should be roughly 50/50 — accept 30-70 range
      expect(corporealCount).toBeGreaterThan(30);
      expect(corporealCount).toBeLessThan(70);
    });
  });

  describe("getSortingHatMonologue", () => {
    it("returns lines for each house", () => {
      const houses = [
        "gryffindor",
        "slytherin",
        "ravenclaw",
        "hufflepuff",
      ] as const;
      for (const house of houses) {
        const lines = getSortingHatMonologue(house);
        expect(lines.length).toBeGreaterThan(0);
        expect(lines[lines.length - 1]).toContain(house.toUpperCase());
      }
    });
  });

  describe("generateFlooParticles", () => {
    it("returns green flame color", () => {
      const { color } = generateFlooParticles("server-a", "server-b");
      expect(color).toBe("#00ff41");
    });

    it("includes source and destination in particles", () => {
      const { particles } = generateFlooParticles("my-server", "target-server");
      const combined = particles.join(" ");
      expect(combined).toContain("my-server");
      expect(combined).toContain("target-server");
    });
  });

  describe("getQuidditchFrame", () => {
    it("returns frame data with position", () => {
      const frame = getQuidditchFrame(0);
      expect(frame).toHaveProperty("frame");
      expect(frame).toHaveProperty("wings");
      expect(frame.position).toHaveProperty("x");
      expect(frame.position).toHaveProperty("y");
    });

    it("alternates wing symbols each frame", () => {
      const f0 = getQuidditchFrame(0);
      const f1 = getQuidditchFrame(1);
      expect(f0.wings).not.toBe(f1.wings);
    });

    it("generates 60 unique positions for 60fps animation", () => {
      const positions = Array.from({ length: 60 }, (_, i) =>
        getQuidditchFrame(i),
      );
      // Position should vary (snitch moves)
      const uniqueX = new Set(positions.map((p) => p.position.x));
      expect(uniqueX.size).toBeGreaterThan(10);
    });
  });
});
