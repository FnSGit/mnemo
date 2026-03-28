// SPDX-License-Identifier: MIT
/**
 * Tests for MNEMO_SCOPE environment variable parsing
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { parseMNEMO_SCOPE } from "../dist/src/config.js";
import { createScopeManager } from "../dist/src/scopes.js";

describe("MNEMO_SCOPE Environment Variable", () => {
  const originalEnv = process.env.MNEMO_SCOPE;

  beforeEach(() => {
    delete process.env.MNEMO_SCOPE;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.MNEMO_SCOPE = originalEnv;
    } else {
      delete process.env.MNEMO_SCOPE;
    }
  });

  describe("parseMNEMO_SCOPE", () => {
    it("should return null for undefined env", () => {
      const result = parseMNEMO_SCOPE(undefined);
      assert.strictEqual(result, null);
    });

    it("should return null for empty string", () => {
      const result = parseMNEMO_SCOPE("");
      assert.strictEqual(result, null);
    });

    it("should parse single scope and auto-include global", () => {
      const result = parseMNEMO_SCOPE("mnemoai");
      assert.deepStrictEqual(result, {
        defaultScope: "mnemoai",
        accessibleScopes: ["mnemoai", "global"],
      });
    });

    it("should parse multiple scopes and auto-include global", () => {
      const result = parseMNEMO_SCOPE("claude|memory");
      assert.deepStrictEqual(result, {
        defaultScope: "claude",
        accessibleScopes: ["claude", "memory", "global"],
      });
    });

    it("should not duplicate global if already specified", () => {
      const result = parseMNEMO_SCOPE("scope1|global|scope2");
      assert.deepStrictEqual(result, {
        defaultScope: "scope1",
        accessibleScopes: ["scope1", "global", "scope2"],
      });
    });

    it("should trim whitespace from scopes", () => {
      const result = parseMNEMO_SCOPE("  scope1  |  scope2  ");
      assert.deepStrictEqual(result, {
        defaultScope: "scope1",
        accessibleScopes: ["scope1", "scope2", "global"],
      });
    });

    it("should filter out empty scopes", () => {
      const result = parseMNEMO_SCOPE("scope1||scope2|");
      assert.deepStrictEqual(result, {
        defaultScope: "scope1",
        accessibleScopes: ["scope1", "scope2", "global"],
      });
    });
  });

  describe("ScopeManager with accessibleScopes", () => {
    it("should use accessibleScopes when set", () => {
      const manager = createScopeManager({
        default: "mnemoai",
        accessibleScopes: ["mnemoai", "global"],
      });

      assert.deepStrictEqual(manager.getAccessibleScopes(), ["mnemoai", "global"]);
    });

    it("should use default scope from accessibleScopes", () => {
      const manager = createScopeManager({
        default: "mnemoai",
        accessibleScopes: ["mnemoai", "claude", "global"],
      });

      assert.strictEqual(manager.getDefaultScope(), "mnemoai");
    });

    it("should verify global is always accessible", () => {
      const manager = createScopeManager({
        default: "mnemoai",
        accessibleScopes: ["mnemoai", "global"],
      });

      assert.strictEqual(manager.isAccessible("mnemoai"), true);
      assert.strictEqual(manager.isAccessible("global"), true);
      assert.strictEqual(manager.isAccessible("other"), false);
    });

    it("should fall back to all scopes when accessibleScopes is not set", () => {
      const manager = createScopeManager({
        default: "global",
        definitions: {
          global: { description: "Global scope" },
          custom: { description: "Custom scope" },
        },
      });

      assert.deepStrictEqual(manager.getAccessibleScopes(), ["global", "custom"]);
    });
  });
});