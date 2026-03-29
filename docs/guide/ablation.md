# Ablation Tests

Every core module in Mnemo has been validated through ablation experiments — systematically removing each component and measuring the impact on retrieval quality.

**35 tests, 3 suites, 100% pass.**

## Why Ablation?

Most memory frameworks claim features without proving they help. Mnemo takes a different approach: every module must earn its place through measurable contribution. If removing a component doesn't degrade performance, it shouldn't exist.

## Results Summary

| Suite | Tests | Key Finding |
|-------|-------|-------------|
| Decay & Tier system | 12 | Each tier provides measurable score separation; flat models lose discrimination |
| Emotional salience | 12 | Removing salience collapses ranking spread to zero — essential signal |
| Parameter A/B test | 11 | Current parameters confirmed optimal via 4-horizon comparison |

## Key Findings

1. **Every module is load-bearing** — no component can be safely removed without measurable quality loss
2. **Parameters are at the sweet spot** — A/B testing confirmed no adjustment needed
3. **Tier system is essential** — flat decay loses both preservation of important memories and cleanup of noise
4. **Emotional salience is not optional** — without it, the system cannot distinguish emotional from routine memories

## Running the Tests

```bash
node --test packages/core/test/reflection-ablation.test.mjs
node --test packages/core/test/salience-ablation.test.mjs
node --test packages/core/test/salience-ab-test.mjs
```
