// SPDX-License-Identifier: MIT
/**
 * Mnemo Pro License Validation
 *
 * Validates MNEMO_PRO_KEY using Ed25519 signature verification.
 * Free users get full Core functionality; Pro features degrade gracefully.
 */

import { createVerify } from "node:crypto";

// Ed25519 public key for license verification (base64)
// The corresponding private key is held by Mnemo team for signing licenses.
const PUBLIC_KEY_B64 =
  "MCowBQYDK2VwAyEAMnemoProKeyPlaceholder_ReplaceWithRealKey==";

let _cachedResult: boolean | null = null;
let _warnedOnce = false;

/**
 * Check whether a valid Mnemo Pro license key is present.
 * Result is cached for the lifetime of the process.
 */
export function isProLicensed(): boolean {
  if (_cachedResult !== null) return _cachedResult;

  const key = process.env.MNEMO_PRO_KEY?.trim();
  if (!key) {
    _cachedResult = false;
    return false;
  }

  // Key format: base64(payload).base64(signature)
  const dotIdx = key.indexOf(".");
  if (dotIdx < 1) {
    _cachedResult = false;
    return false;
  }

  try {
    const payload = key.slice(0, dotIdx);
    const signature = key.slice(dotIdx + 1);

    const verify = createVerify("Ed25519");
    verify.update(Buffer.from(payload, "base64"));
    const pubKey = Buffer.from(PUBLIC_KEY_B64, "base64");

    _cachedResult = verify.verify(
      { key: pubKey, format: "der", type: "spki" },
      Buffer.from(signature, "base64"),
    );
  } catch {
    _cachedResult = false;
  }

  return _cachedResult;
}

/**
 * Guard for Pro features. Returns true if licensed, false if not.
 * Logs a one-time warning when Pro feature is accessed without a license.
 */
export function requirePro(featureName: string): boolean {
  if (isProLicensed()) return true;

  if (!_warnedOnce) {
    console.warn(
      `[mnemo] Pro features disabled — set MNEMO_PRO_KEY to enable. ` +
      `Core functionality is fully available.`,
    );
    _warnedOnce = true;
  }
  if (process.env.MNEMO_DEBUG) {
    console.debug(`[mnemo] Pro feature skipped: ${featureName}`);
  }
  return false;
}

/**
 * Reset cached license result (for testing).
 */
export function _resetLicenseCache(): void {
  _cachedResult = null;
  _warnedOnce = false;
}
