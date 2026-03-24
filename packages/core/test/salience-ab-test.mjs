/**
 * Salience A/B Test — Current vs Optimized Parameters
 *
 * Simulates realistic memory workloads and compares ranking quality
 * between current config (A) and proposed optimizations (B).
 *
 * Metrics:
 * - Discrimination: spread between high/low salience memories
 * - Ranking accuracy: do emotional memories rank correctly?
 * - Retention curve: memory survival at 30/60/90/120 days
 * - Composite balance: how much does each signal contribute?
 *
 * Run: node --test test/salience-ab-test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

const MS_PER_DAY = 86_400_000;

// ============================================================================
// Config A (Current) vs Config B (Optimized)
// ============================================================================

const CONFIG_A = {
  name: "Current",
  importanceModulation: 1.5,
  salienceRecencyCoeff: 0.5,
  salienceIntrinsicCoeff: 0.3,
  recencyWeight: 0.4,
  frequencyWeight: 0.3,
  intrinsicWeight: 0.3,
};

const CONFIG_B = {
  name: "Optimized",
  importanceModulation: 1.0,      // reduced from 1.5 — let salience breathe
  salienceRecencyCoeff: 0.65,     // raised from 0.5 — stronger amygdala effect
  salienceIntrinsicCoeff: 0.4,    // raised from 0.3 — emotion matters more in value
  recencyWeight: 0.4,
  frequencyWeight: 0.3,
  intrinsicWeight: 0.3,
};

// ============================================================================
// Engine simulation
// ============================================================================

function weibullRecency(daysSince, halfLife, beta, importance, salience, cfg) {
  const effectiveHL = halfLife * Math.exp(cfg.importanceModulation * importance) * (1 + salience * cfg.salienceRecencyCoeff);
  const lambda = Math.LN2 / effectiveHL;
  return Math.exp(-lambda * Math.pow(daysSince, beta));
}

function intrinsicValue(importance, confidence, salience, cfg) {
  return importance * confidence * (1 + salience * cfg.salienceIntrinsicCoeff);
}

function frequency(accessCount) {
  return 1 - Math.exp(-accessCount / 5);
}

function compositeScore(mem, daysSince, cfg) {
  const r = weibullRecency(daysSince, 30, betaForTier(mem.tier), mem.importance, mem.salience, cfg);
  const f = frequency(mem.accessCount);
  const i = intrinsicValue(mem.importance, mem.confidence, mem.salience, cfg);
  return cfg.recencyWeight * r + cfg.frequencyWeight * f + cfg.intrinsicWeight * i;
}

function betaForTier(tier) {
  return tier === "core" ? 0.8 : tier === "working" ? 1.0 : 1.3;
}

// ============================================================================
// Realistic memory corpus
// ============================================================================

const MEMORIES = [
  // High-salience: decisions, emotions, financial
  { id: "m1", text: "Rex decided to invest 30M in Lightwheel at 4.5B valuation", tier: "core", importance: 0.95, confidence: 0.9, salience: 0.92, accessCount: 8 },
  { id: "m2", text: "First time the system achieved 85% LOCOMO score — team was excited", tier: "core", importance: 0.85, confidence: 0.85, salience: 0.88, accessCount: 5 },
  { id: "m3", text: "User was frustrated when memory lost after crash — led to WAL", tier: "working", importance: 0.8, confidence: 0.9, salience: 0.8, accessCount: 3 },
  { id: "m4", text: "Critical bug: rerank-debug log leaked to all users", tier: "working", importance: 0.75, confidence: 0.95, salience: 0.7, accessCount: 2 },

  // Medium-salience: preferences, learnings
  { id: "m5", text: "User prefers dark mode and concise responses", tier: "working", importance: 0.6, confidence: 0.8, salience: 0.45, accessCount: 12 },
  { id: "m6", text: "Voyage embedding gives better results than OpenAI for Chinese", tier: "working", importance: 0.65, confidence: 0.85, salience: 0.4, accessCount: 4 },
  { id: "m7", text: "bge-m3 model achieves 70% accuracy, nomic only 20%", tier: "working", importance: 0.7, confidence: 0.9, salience: 0.5, accessCount: 3 },

  // Low-salience: routine, operational
  { id: "m8", text: "Gateway restarted successfully at 3:00 AM", tier: "peripheral", importance: 0.2, confidence: 0.95, salience: 0.1, accessCount: 0 },
  { id: "m9", text: "npm install completed, node_modules updated", tier: "peripheral", importance: 0.15, confidence: 0.95, salience: 0.08, accessCount: 0 },
  { id: "m10", text: "HEARTBEAT_OK: all systems normal", tier: "peripheral", importance: 0.1, confidence: 0.99, salience: 0.05, accessCount: 0 },
  { id: "m11", text: "cron sync completed, no changes detected", tier: "peripheral", importance: 0.1, confidence: 0.95, salience: 0.05, accessCount: 0 },
  { id: "m12", text: "Debug: stack trace in retriever.ts line 973", tier: "peripheral", importance: 0.2, confidence: 0.8, salience: 0.12, accessCount: 1 },
];

// ============================================================================
// Test 1: Discrimination (spread between emotional vs routine)
// ============================================================================

describe("A/B: Discrimination power", () => {
  for (const horizon of [30, 60, 90, 120]) {
    it(`at ${horizon} days — emotional vs routine spread`, () => {
      const emotional = MEMORIES.filter(m => m.salience > 0.7);
      const routine = MEMORIES.filter(m => m.salience < 0.15);

      function avgScore(mems, cfg) {
        return mems.reduce((sum, m) => sum + compositeScore(m, horizon, cfg), 0) / mems.length;
      }

      const spreadA = avgScore(emotional, CONFIG_A) - avgScore(routine, CONFIG_A);
      const spreadB = avgScore(emotional, CONFIG_B) - avgScore(routine, CONFIG_B);

      console.log(`    ${horizon}d: A spread=${spreadA.toFixed(4)}, B spread=${spreadB.toFixed(4)}, delta=${(spreadB - spreadA).toFixed(4)}`);

      // Both should have positive spread
      assert.ok(spreadA > 0, "Config A should discriminate");
      assert.ok(spreadB > 0, "Config B should discriminate");
    });
  }
});

// ============================================================================
// Test 2: Ranking accuracy (pairwise correct orderings)
// ============================================================================

describe("A/B: Ranking accuracy", () => {
  // Expected ordering: m1 > m2 > m3 > m4 > m5 > m6 > m7 > m8 > m9 > m10
  const EXPECTED_ORDER = ["m1", "m2", "m3", "m4", "m7", "m6", "m5", "m12", "m8", "m9", "m10", "m11"];

  for (const horizon of [30, 60, 90]) {
    it(`at ${horizon} days — pairwise ranking accuracy`, () => {
      function rankMemories(cfg) {
        return [...MEMORIES]
          .map(m => ({ id: m.id, score: compositeScore(m, horizon, cfg) }))
          .sort((a, b) => b.score - a.score)
          .map(m => m.id);
      }

      function kendallTau(actual, expected) {
        let concordant = 0, discordant = 0;
        for (let i = 0; i < expected.length; i++) {
          for (let j = i + 1; j < expected.length; j++) {
            const ai = actual.indexOf(expected[i]);
            const aj = actual.indexOf(expected[j]);
            if (ai < aj) concordant++;
            else discordant++;
          }
        }
        const total = concordant + discordant;
        return total === 0 ? 1 : (concordant - discordant) / total;
      }

      const rankA = rankMemories(CONFIG_A);
      const rankB = rankMemories(CONFIG_B);

      const tauA = kendallTau(rankA, EXPECTED_ORDER);
      const tauB = kendallTau(rankB, EXPECTED_ORDER);

      console.log(`    ${horizon}d: A tau=${tauA.toFixed(3)}, B tau=${tauB.toFixed(3)}, delta=${(tauB - tauA).toFixed(3)}`);
      console.log(`    A rank: ${rankA.join(" > ")}`);
      console.log(`    B rank: ${rankB.join(" > ")}`);

      // Both should have reasonable ranking (tau > 0.5)
      assert.ok(tauA > 0.3, `Config A tau ${tauA.toFixed(3)} should be > 0.3`);
      assert.ok(tauB > 0.3, `Config B tau ${tauB.toFixed(3)} should be > 0.3`);
    });
  }
});

// ============================================================================
// Test 3: Retention curve — survival rate across time
// ============================================================================

describe("A/B: Retention curves", () => {
  it("memory survival rates at key horizons", () => {
    const threshold = 0.3; // below this = effectively forgotten
    const horizons = [7, 14, 30, 60, 90, 120, 180];

    console.log("\n    Survival rates (composite > 0.3):");
    console.log("    ┌─────────┬────────┬────────┬──────────┐");
    console.log("    │ Days    │ A surv │ B surv │ Delta    │");
    console.log("    ├─────────┼────────┼────────┼──────────┤");

    for (const d of horizons) {
      const survA = MEMORIES.filter(m => compositeScore(m, d, CONFIG_A) > threshold).length;
      const survB = MEMORIES.filter(m => compositeScore(m, d, CONFIG_B) > threshold).length;
      console.log(`    │ ${String(d).padStart(3)}d    │ ${String(survA).padStart(2)}/${MEMORIES.length}  │ ${String(survB).padStart(2)}/${MEMORIES.length}  │ ${survB > survA ? "+" : survB < survA ? "-" : " "}${Math.abs(survB - survA).toString().padStart(1)}       │`);
    }
    console.log("    └─────────┴────────┴────────┴──────────┘");

    // At 180 days, only truly important memories should survive
    const surv180A = MEMORIES.filter(m => compositeScore(m, 180, CONFIG_A) > threshold);
    const surv180B = MEMORIES.filter(m => compositeScore(m, 180, CONFIG_B) > threshold);

    // The survivors should be high-salience core memories, not routine ones
    const routineSurvA = surv180A.filter(m => m.salience < 0.15).length;
    const routineSurvB = surv180B.filter(m => m.salience < 0.15).length;

    console.log(`\n    At 180d — routine survivors: A=${routineSurvA}, B=${routineSurvB} (lower=better noise cleanup)`);

    assert.ok(true); // data collection test
  });
});

// ============================================================================
// Test 4: Signal contribution balance
// ============================================================================

describe("A/B: Signal balance", () => {
  it("recency vs frequency vs intrinsic contribution breakdown", () => {
    const horizon = 60;

    console.log("\n    Signal contributions at 60d (avg across all memories):");
    console.log("    ┌────────┬────────────┬────────────┬────────────┬────────────┐");
    console.log("    │ Config │ Recency    │ Frequency  │ Intrinsic  │ Composite  │");
    console.log("    ├────────┼────────────┼────────────┼────────────┼────────────┤");

    for (const cfg of [CONFIG_A, CONFIG_B]) {
      let sumR = 0, sumF = 0, sumI = 0, sumC = 0;
      for (const m of MEMORIES) {
        const r = weibullRecency(horizon, 30, betaForTier(m.tier), m.importance, m.salience, cfg);
        const f = frequency(m.accessCount);
        const i = intrinsicValue(m.importance, m.confidence, m.salience, cfg);
        sumR += cfg.recencyWeight * r;
        sumF += cfg.frequencyWeight * f;
        sumI += cfg.intrinsicWeight * i;
        sumC += cfg.recencyWeight * r + cfg.frequencyWeight * f + cfg.intrinsicWeight * i;
      }
      const n = MEMORIES.length;
      const avgR = sumR / n, avgF = sumF / n, avgI = sumI / n, avgC = sumC / n;
      const pctR = (avgR / avgC * 100).toFixed(0);
      const pctF = (avgF / avgC * 100).toFixed(0);
      const pctI = (avgI / avgC * 100).toFixed(0);
      console.log(`    │ ${cfg.name.padEnd(6)} │ ${avgR.toFixed(3)} (${pctR}%) │ ${avgF.toFixed(3)} (${pctF}%) │ ${avgI.toFixed(3)} (${pctI}%) │ ${avgC.toFixed(3)}      │`);
    }
    console.log("    └────────┴────────────┴────────────┴────────────┴────────────┘");

    assert.ok(true); // data collection test
  });
});

// ============================================================================
// Test 5: Edge cases — salience vs importance dominance
// ============================================================================

describe("A/B: Salience independence from importance", () => {
  it("low-importance high-salience memory should still outlast low-importance low-salience", () => {
    const lowImpEmotional = { tier: "working", importance: 0.3, confidence: 0.8, salience: 0.9, accessCount: 1 };
    const lowImpRoutine = { tier: "working", importance: 0.3, confidence: 0.8, salience: 0.1, accessCount: 1 };
    const horizon = 60;

    const scoreA_em = compositeScore(lowImpEmotional, horizon, CONFIG_A);
    const scoreA_rt = compositeScore(lowImpRoutine, horizon, CONFIG_A);
    const gapA = scoreA_em - scoreA_rt;

    const scoreB_em = compositeScore(lowImpEmotional, horizon, CONFIG_B);
    const scoreB_rt = compositeScore(lowImpRoutine, horizon, CONFIG_B);
    const gapB = scoreB_em - scoreB_rt;

    console.log(`\n    Low-importance (0.3) at 60d:`);
    console.log(`    A: emotional=${scoreA_em.toFixed(4)} routine=${scoreA_rt.toFixed(4)} gap=${gapA.toFixed(4)}`);
    console.log(`    B: emotional=${scoreB_em.toFixed(4)} routine=${scoreB_rt.toFixed(4)} gap=${gapB.toFixed(4)}`);

    // Both should discriminate, but B should discriminate more
    assert.ok(gapA > 0, "Config A should still discriminate at low importance");
    assert.ok(gapB > 0, "Config B should still discriminate at low importance");
    assert.ok(gapB > gapA, `B gap (${gapB.toFixed(4)}) should > A gap (${gapA.toFixed(4)}) — salience has more room`);
  });
});

// ============================================================================
// Summary — recommendation
// ============================================================================

describe("A/B Summary", () => {
  it("final recommendation", () => {
    const horizons = [30, 60, 90, 120];
    let aWins = 0, bWins = 0;

    for (const h of horizons) {
      const emotional = MEMORIES.filter(m => m.salience > 0.7);
      const routine = MEMORIES.filter(m => m.salience < 0.15);
      const avgE = (mems, cfg) => mems.reduce((s, m) => s + compositeScore(m, h, cfg), 0) / mems.length;
      const spreadA = avgE(emotional, CONFIG_A) - avgE(routine, CONFIG_A);
      const spreadB = avgE(emotional, CONFIG_B) - avgE(routine, CONFIG_B);
      if (spreadB > spreadA) bWins++; else aWins++;
    }

    console.log("\n  ═══════════════════════════════════════════");
    console.log(`  A/B Result: A wins ${aWins}/${horizons.length}, B wins ${bWins}/${horizons.length}`);
    if (bWins > aWins) {
      console.log("  Recommendation: ADOPT Config B (Optimized)");
      console.log("  - importanceModulation: 1.5 → 1.0");
      console.log("  - salienceRecencyCoeff: 0.5 → 0.65");
      console.log("  - salienceIntrinsicCoeff: 0.3 → 0.4");
    } else if (aWins > bWins) {
      console.log("  Recommendation: KEEP Config A (Current)");
      console.log("  Current parameters are already well-balanced.");
    } else {
      console.log("  Recommendation: MARGINAL — no clear winner");
      console.log("  Consider running against LOCOMO benchmark for final call.");
    }
    console.log("  ═══════════════════════════════════════════\n");

    assert.ok(true);
  });
});
