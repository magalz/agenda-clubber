#!/usr/bin/env node

/**
 * create-tech-debt-issues.mjs
 *
 * Lê _bmad-output/implementation-artifacts/tech-debt.yaml e cria:
 * 1. Labels no repositório (se não existirem)
 * 2. GitHub Issues para cada item (se não existirem)
 *
 * Uso:
 *   GITHUB_TOKEN=ghp_xxx npm run create:tech-debt-issues
 *   GITHUB_TOKEN=ghp_xxx npm run create:tech-debt-issues -- --dry-run
 *
 * Flags:
 *   --dry-run   Simula sem criar nada, gera relatório
 *   --repo      Repositório alvo (default: magalz/agenda-clubber)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Octokit } from '@octokit/rest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const CONFIG = {
  repo: 'magalz/agenda-clubber',
  yamlPath: resolve(PROJECT_ROOT, '_bmad-output/implementation-artifacts/tech-debt.yaml'),
  reportPath: resolve(PROJECT_ROOT, '_bmad-output/tech-debt-issues-report.json'),
};

const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('[DRY-RUN] Modo de simulação — nenhuma label ou issue será criada.\n');
}

function parseYaml(yaml) {
  const lines = yaml.split('\n');
  const items = [];
  let currentItem = null;
  let inBody = false;
  let bodyLines = [];
  const ITEM_RE = /^\s+- id:\s*(\S+)/;

  for (const line of lines) {
    const itemMatch = line.match(ITEM_RE);
    if (itemMatch) {
      if (currentItem) {
        if (inBody) {
          currentItem.body = bodyLines.join('\n').trim();
          inBody = false;
          bodyLines = [];
        }
        items.push(currentItem);
      }
      currentItem = { id: itemMatch[1] };
    } else if (currentItem) {
      if (inBody) {
        if (line.startsWith('    ') || line.trim() === '') {
          bodyLines.push(line);
          continue;
        }
        inBody = false;
      }

      const trimmed = line.trim();
      const titleM = trimmed.match(/^title:\s*"(.+)"$/);
      if (titleM) {
        currentItem.title = titleM[1];
        continue;
      }
      const sevM = trimmed.match(/^severity:\s*(.+)/);
      if (sevM) { currentItem.severity = sevM[1]; continue; }
      const labM = trimmed.match(/^label:\s*(.+)/);
      if (labM) { currentItem.label = labM[1]; continue; }
      const stM = trimmed.match(/^status:\s*(.+)/);
      if (stM) { currentItem.status = stM[1]; continue; }
      if (trimmed.match(/^body:\s*\|/)) {
        inBody = true;
        continue;
      }
    }
  }
  if (currentItem) {
    if (inBody) currentItem.body = bodyLines.join('\n').trim();
    items.push(currentItem);
  }
  return items;
}

function extractLabels(yaml) {
  const labels = [];
  const labelSection = yaml.match(/labels:\n((?:  .+\n)*)/);
  if (labelSection) {
    const lines = labelSection[1].split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/  (\S+):\s+"(.+)"$/);
      if (match) labels.push({ name: match[1], description: match[2] });
    }
  }
  return labels;
}

const LABEL_COLORS = {
  'tech-debt': 'B60205',
  'decision-pending': 'FBCA04',
  critical: 'E99695',
  high: 'FF9F1C',
  medium: '168700',
  low: 'CFD3D7',
};

async function ensureLabel(octokit, owner, repo, name) {
  const color = LABEL_COLORS[name] || 'EDEDED';
  try {
    await octokit.rest.issues.getLabel({ owner, repo, name });
    console.log(`  [OK] Label já existe: ${name}`);
  } catch {
    if (DRY_RUN) {
      console.log(`  [DRY] Criaria label: ${name} (${color})`);
      return;
    }
    await octokit.rest.issues.createLabel({ owner, repo, name, color });
    console.log(`  [CRIADO] Label: ${name} (${color})`);
  }
}

async function issueExists(octokit, owner, repo, title) {
  const { data } = await octokit.rest.issues.listForRepo({ owner, repo, state: 'all', per_page: 100 });
  return data.some((issue) => issue.title === title);
}

async function ensureIssue(octokit, owner, repo, item) {
  const title = `[${item.id}] ${item.title}`;
  const labels = [item.label, item.severity];
  const body = item.body || '';

  if (await issueExists(octokit, owner, repo, title)) {
    console.log(`  [OK] Issue já existe: ${title}`);
    return { id: item.id, title, action: 'skipped' };
  }

  if (DRY_RUN) {
    console.log(`  [DRY] Criaria issue: ${title}`);
    return { id: item.id, title, action: 'dry-run' };
  }

  const { data } = await octokit.rest.issues.create({ owner, repo, title, body, labels });
  console.log(`  [CRIADO] Issue: ${title}`);
  return { id: item.id, title, action: 'created', url: data.html_url };
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('ERRO: GITHUB_TOKEN não definido. Exporte como variável de ambiente.');
    console.error('  Windows PowerShell: $env:GITHUB_TOKEN = "ghp_xxx"');
    process.exit(1);
  }

  if (!existsSync(CONFIG.yamlPath)) {
    console.error(`ERRO: Arquivo YAML não encontrado: ${CONFIG.yamlPath}`);
    process.exit(1);
  }

  const yamlContent = readFileSync(CONFIG.yamlPath, 'utf-8').replace(/\r\n/g, '\n');
  const items = parseYaml(yamlContent);
  const labels = extractLabels(yamlContent);
  const [owner, repo] = CONFIG.repo.split('/');

  console.log(`Repositório: ${CONFIG.repo}`);
  console.log(`Itens encontrados no YAML: ${items.length}`);
  console.log(`Labels definidas: ${labels.length}`);
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN' : 'REAL'}\n`);

  const octokit = new Octokit({ auth: token });

  // Step 1: Ensure all labels exist
  console.log('=== Verificando/Criando Labels ===');
  for (const label of labels) {
    await ensureLabel(octokit, owner, repo, label.name);
  }
  // Also ensure severity labels exist
  for (const sev of ['critical', 'high', 'medium', 'low']) {
    if (!labels.find((l) => l.name === sev)) {
      await ensureLabel(octokit, owner, repo, sev);
    }
  }

  // Step 2: Create issues
  console.log('\n=== Verificando/Criando Issues ===');
  const report = [];

  for (const item of items) {
    if (!item.title) continue;
    const result = await ensureIssue(octokit, owner, repo, item);
    report.push(result);
  }

  // Step 3: Generate report
  const summary = {
    total: items.length,
    created: report.filter((r) => r.action === 'created').length,
    skipped: report.filter((r) => r.action === 'skipped').length,
    dryRun: DRY_RUN && report.filter((r) => r.action === 'dry-run').length,
    timestamp: new Date().toISOString(),
    repo: CONFIG.repo,
  };

  const reportOutput = { summary, issues: report };

  if (!DRY_RUN) {
    writeFileSync(CONFIG.reportPath, JSON.stringify(reportOutput, null, 2));
  }

  console.log('\n=== Resumo ===');
  console.log(`Total: ${summary.total}`);
  console.log(`Criadas: ${summary.created}`);
  console.log(`Puladas (já existem): ${summary.skipped}`);
  if (DRY_RUN) console.log(`Dry-run: ${summary.dryRun}`);
  console.log(`Relatório: ${CONFIG.reportPath}`);

  if (!DRY_RUN) {
    const openIssues = report.filter((r) => r.url);
    if (openIssues.length > 0) {
      console.log('\nIssues criadas:');
      openIssues.forEach((r) => console.log(`  ${r.url}`));
    }
  }
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
