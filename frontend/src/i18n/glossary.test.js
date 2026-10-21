/**
 * Automated test script for glossary integrity
 * Run with: node src/i18n/glossary.test.js
 */

import { GLOSSARY } from './glossary.js';

const FINGERPRINT_KEYS = [
  'flatline',
  'correlation_break',
  'drift',
  'limit_hugging',
  'copy_paste',
  'coordinated_missing_data',
  'inspection_dip',
  'impossible_sensor_values'
];

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    passed++;
  }
}

console.log('🧪 Starting Glossary Integrity Tests...\n');

// 1. Verify all entries have simple, technical, and simpleHelp
Object.entries(GLOSSARY).forEach(([key, term]) => {
  assert(typeof term.simple === 'string' && term.simple.trim().length > 0, `${key}: missing or empty 'simple' text`);
  assert(typeof term.technical === 'string' && term.technical.trim().length > 0, `${key}: missing or empty 'technical' text`);
  assert(typeof term.simpleHelp === 'string' && term.simpleHelp.trim().length > 0, `${key}: missing or empty 'simpleHelp' tooltip text`);
});

// 2. Verify all 8 fingerprints have causes and checks
FINGERPRINT_KEYS.forEach((key) => {
  const fp = GLOSSARY[key];
  assert(fp !== undefined, `Fingerprint ${key} must exist in GLOSSARY`);
  if (fp) {
    assert(Array.isArray(fp.possibleInnocentCauses) && fp.possibleInnocentCauses.length >= 2, `${key}: must have at least 2 possibleInnocentCauses`);
    assert(Array.isArray(fp.possibleTamperingCauses) && fp.possibleTamperingCauses.length >= 2, `${key}: must have at least 2 possibleTamperingCauses`);
    assert(Array.isArray(fp.inspectionChecks) && fp.inspectionChecks.length >= 3, `${key}: must have at least 3 inspectionChecks`);
  }
});

console.log(`\nTest Results: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ All Glossary integrity checks passed successfully!');
}
