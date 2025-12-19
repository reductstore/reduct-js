/**
 * Tests for module exports
 * These tests verify that expected types and values are properly exported
 */

import { ReplicationMode } from "../src/index";

describe("Module Exports", () => {
  describe("ReplicationMode", () => {
    it("should export ReplicationMode as a runtime value", () => {
      expect(ReplicationMode).toBeDefined();
      expect(typeof ReplicationMode).toBe("object");
    });

    it("should have ENABLED constant", () => {
      expect(ReplicationMode.ENABLED).toBe("enabled");
    });

    it("should have PAUSED constant", () => {
      expect(ReplicationMode.PAUSED).toBe("paused");
    });

    it("should have DISABLED constant", () => {
      expect(ReplicationMode.DISABLED).toBe("disabled");
    });

    it("should allow type usage for string literals", () => {
      // This test verifies that the type alias still works for type checking
      const mode1: ReplicationMode = "enabled";
      const mode2: ReplicationMode = ReplicationMode.ENABLED;
      const mode3: ReplicationMode = ReplicationMode.PAUSED;

      expect(mode1).toBe("enabled");
      expect(mode2).toBe("enabled");
      expect(mode3).toBe("paused");
    });
  });
});
