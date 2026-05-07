import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const testResultsDir = join(root, 'test-results');
const reportsDir = join(root, 'qa-reports');

const THRESHOLDS = {
  minTests: { threshold: 422, operator: '>=' },
  zeroFailures: { threshold: 0, operator: '<=' },
  maxSkipped: { threshold: 8, operator: '<=' },
};

function attrValue(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["'](\\d+)["']`);
  const m = xml.match(re);
  return m ? parseInt(m[1]) : -1;
}

function countChildFailures(xml) {
  const failures = (xml.match(/<failure[^>]*\/>/g) || xml.match(/<failure[^>]*>[\s\S]*?<\/failure>/g) || []).length;
  const errors = (xml.match(/<error[^>]*\/>/g) || xml.match(/<error[^>]*>[\s\S]*?<\/error>/g) || []).length;
  return failures + errors;
}

function parseJUnit(xmlPath) {
  if (!existsSync(xmlPath)) return null;
  const xml = readFileSync(xmlPath, 'utf-8');

  // Try root <testsuites> aggregate first (Playwright, some runners)
  let rootTests = attrValue(xml, 'testsuites', 'tests');
  let rootFailures = attrValue(xml, 'testsuites', 'failures');
  let rootErrors = attrValue(xml, 'testsuites', 'errors');
  let rootSkipped = attrValue(xml, 'testsuites', 'skipped');

  if (rootTests >= 0) {
    const childFailures = countChildFailures(xml);
    return {
      tests: rootTests,
      failures: Math.max(rootFailures, 0),
      errors: Math.max(rootErrors, 0),
      skipped: Math.max(rootSkipped, 0),
      totalFailures: Math.max(Math.max(rootFailures, 0) + Math.max(rootErrors, 0), childFailures),
    };
  }

  // Aggregate across all <testsuite> elements
  let tests = 0, failures = 0, errors = 0, skipped = 0;
  const suites = xml.matchAll(/<testsuite[^>]*>/g);
  let found = false;
  for (const match of suites) {
    const attr = match[0];
    tests += parseInt(attr.match(/tests=["'](\d+)["']/)?.[1] || '0');
    failures += parseInt(attr.match(/failures=["'](\d+)["']/)?.[1] || '0');
    errors += parseInt(attr.match(/errors=["'](\d+)["']/)?.[1] || '0');
    skipped += parseInt(attr.match(/skipped=["'](\d+)["']/)?.[1] || '0');
    found = true;
  }

  if (!found) return null;

  const childFailures = countChildFailures(xml);
  const totalFailures = Math.max(failures + errors, childFailures);

  return { tests, failures, errors, skipped, totalFailures };
}

function generateReport() {
  const vitestReport = parseJUnit(join(testResultsDir, 'vitest-junit.xml'));
  const e2eReport = parseJUnit(join(testResultsDir, 'junit.xml'));

  const combined = {
    tests: (vitestReport?.tests || 0) + (e2eReport?.tests || 0),
    failures: (vitestReport?.totalFailures || 0) + (e2eReport?.totalFailures || 0),
    skipped: (vitestReport?.skipped || 0) + (e2eReport?.skipped || 0),
  };

  const evaluateGate = (actual, config) => {
    const passed = config.operator === '>=' ? actual >= config.threshold : actual <= config.threshold;
    return { passed, actual, threshold: config.threshold, operator: config.operator };
  };

  const gates = {
    minTests: evaluateGate(combined.tests, THRESHOLDS.minTests),
    zeroFailures: evaluateGate(combined.failures, THRESHOLDS.zeroFailures),
    maxSkipped: evaluateGate(combined.skipped, THRESHOLDS.maxSkipped),
  };

  const allPassed = Object.values(gates).every(g => g.passed);
  const gatesSummary = {};
  for (const [k, g] of Object.entries(gates)) {
    gatesSummary[k] = { passed: g.passed, actual: g.actual, threshold: g.threshold };
  }

  const report = {
    timestamp: new Date().toISOString(),
    sourceReports: {
      vitest: vitestReport || { status: 'not-found' },
      playwright: e2eReport || { status: 'not-found' },
    },
    combined,
    thresholds: { minTests: 422, maxFailures: 0, maxSkipped: 8 },
    gates: gatesSummary,
    verdict: allPassed ? 'PASS' : 'FAIL',
  };

  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

  const jsonPath = join(reportsDir, 'qa-gate-report.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const mdPath = join(reportsDir, 'qa-gate-report.md');
  const lines = [
    '# QA Gate Report',
    '',
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.verdict}`,
    '',
    '## Thresholds',
    '',
    '| Gate | Threshold | Actual | Status |',
    '|------|-----------|--------|--------|',
    ...Object.entries(gates).map(([k, g]) => `| ${k} | ${g.threshold} | ${g.actual} | ${g.passed ? ':white_check_mark:' : ':x:'} |`),
    '',
    '## Combined Results',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Tests | ${combined.tests} |`,
    `| Failures | ${combined.failures} |`,
    `| Skipped | ${combined.skipped} |`,
    '',
    '## Source Reports',
    '',
    `**Vitest:** ${vitestReport ? `${vitestReport.tests} tests, ${vitestReport.failures} failures, ${vitestReport.skipped} skipped` : 'not found'}`,
    `**Playwright:** ${e2eReport ? `${e2eReport.tests} tests, ${e2eReport.failures} failures, ${e2eReport.skipped} skipped` : 'not found'}`,
  ];
  writeFileSync(mdPath, lines.join('\n') + '\n');

  console.log(report.verdict === 'PASS' ? `QA Gate: PASS (${combined.tests} tests, ${combined.failures} failures)` : `QA Gate: FAIL`);
  if (report.verdict !== 'PASS') {
    for (const [k, g] of Object.entries(gates)) {
      if (!g.passed) console.error(`  ${k}: expected ${g.operator} ${g.threshold}, got ${g.actual}`);
    }
    process.exit(1);
  }
}

generateReport();
