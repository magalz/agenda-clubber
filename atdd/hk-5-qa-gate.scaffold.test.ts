import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

describe.skip('HK.5 — QA Gate Scaffolds (RED PHASE)', () => {

  describe('AC1 — Dual-entry Murat documentado', () => {
    it('docs/qa-workflow.md deve conter seção QA-Design com comandos ATDD', () => {
      const content = fs.readFileSync(path.join(repoRoot, 'docs', 'qa-workflow.md'), 'utf-8');
      expect(content).toContain('QA-Design');
      expect(content).toContain('bmad-testarch-atdd');
      expect(content).toContain('bmad-testarch-test-design');
    });

    it('docs/qa-workflow.md deve conter seção QA-Verify com comandos review/trace/automate', () => {
      const content = fs.readFileSync(path.join(repoRoot, 'docs', 'qa-workflow.md'), 'utf-8');
      expect(content).toContain('QA-Verify');
      expect(content).toContain('bmad-testarch-test-review');
      expect(content).toContain('bmad-testarch-trace');
      expect(content).toContain('bmad-testarch-automate');
    });

    it('docs/qa-workflow.md deve ter diagrama do ciclo com posições de Murat', () => {
      const content = fs.readFileSync(path.join(repoRoot, 'docs', 'qa-workflow.md'), 'utf-8');
      expect(content).toMatch(/```mermaid/);
    });
  });

  describe('AC2 — QA Maturity Checklist no template', () => {
    const templatePath = path.join(repoRoot, '_bmad-output', 'implementation-artifacts', 'hk-5-gate-de-qa-automatizado.md');

    it('story deve conter seção QA Maturity Checklist', () => {
      const content = fs.readFileSync(templatePath, 'utf-8');
      expect(content).toContain('QA Maturity Checklist');
    });

    it('checklist deve cobrir ATDD scaffolds, test strategy, unit coverage, E2E coverage, thresholds, regressions, gate report', () => {
      const content = fs.readFileSync(templatePath, 'utf-8');
      const requiredTopics = [
        'ATDD',
        'estratégia de teste',
        'cobertura',
        'thresholds',
        'regressões',
        'gate report',
      ];
      for (const topic of requiredTopics) {
        expect(content.toLowerCase()).toContain(topic);
      }
    });
  });

  describe('AC3 — CI qa-gate job', () => {
    const ciPath = path.join(repoRoot, '.github', 'workflows', 'ci.yml');

    it('ci.yml deve conter job qa-gate', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('qa-gate');
    });

    it('qa-gate job deve depender de unit-tests e e2e-tests', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('unit-tests');
      expect(content).toContain('e2e-tests');
    });

    it('qa-gate deve publicar artifact qa-gate-report', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('qa-gate-report');
    });

    it('workflow deve falhar se qa-gate falhar', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toMatch(/if:.*failure\(\)/);
    });
  });

  describe('AC3b — Script local qa:gate', () => {
    const pkgPath = path.join(repoRoot, 'package.json');

    it('package.json deve conter script qa:gate', () => {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.scripts).toHaveProperty('qa:gate');
    });

    it('scripts/qa-gate.mjs deve existir e ser executável', () => {
      const scriptPath = path.join(repoRoot, 'scripts', 'qa-gate.mjs');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });
  });

  describe('AC4 — docs/qa-workflow.md', () => {
    it('deve existir', () => {
      const docPath = path.join(repoRoot, 'docs', 'qa-workflow.md');
      expect(fs.existsSync(docPath)).toBe(true);
    });

    it('deve conter critérios de aprovação/reprovação', () => {
      const content = fs.readFileSync(path.join(repoRoot, 'docs', 'qa-workflow.md'), 'utf-8');
      expect(content).toMatch(/aprovação|approval|pass|fail/i);
      expect(content).toMatch(/reprovação|rejection|fail/i);
    });

    it('deve conter exemplos de QA Gate Report', () => {
      const content = fs.readFileSync(path.join(repoRoot, 'docs', 'qa-workflow.md'), 'utf-8');
      expect(content).toMatch(/exemplo|example|QA Gate Report/i);
    });
  });
});
