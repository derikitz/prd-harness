#!/usr/bin/env node
// Installs the PRD -> WBS -> tasks harness into a project. No dependencies.
const fs = require('fs');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..');
const HARNESS_DIRS = ['.claude/agents', '.claude/commands', '.claude/harness', '.claude/skills'];
const PROJECT_DIRS = ['docs', 'tasks/todo', 'tasks/doing', 'tasks/review', 'tasks/done', 'tasks/blocked'];
const CLAUDE_IMPORTS = ['@AGENTS.md', '@.claude/harness/WORKFLOW.md'];

const HELP = `Usage: prd-harness init [dir] [--force]

Installs the PRD -> WBS -> tasks harness into a project (default: current folder).

  --force     Overwrite harness files (.claude/agents, commands, harness, skills) with this version
  --help      Show this help
  --version   Show version

Existing AGENTS.md / CLAUDE.md are never overwritten; only the workflow lines are appended.`;

function log(action, target) {
  console.log(`${action.padEnd(8)} ${target}`);
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

// The "## Project Workflow" section of AGENTS.md, so the appended text always matches the source.
function workflowSection() {
  const agents = fs.readFileSync(path.join(SOURCE, 'AGENTS.md'), 'utf8');
  const match = agents.match(/## Project Workflow[\s\S]*?(?=\n## |\n---|$)/);
  if (!match) throw new Error('AGENTS.md in the package has no "## Project Workflow" section.');
  return match[0].trim();
}

function init(target, force) {
  if (!fs.existsSync(target)) throw new Error(`Target folder does not exist: ${target}`);
  if (path.resolve(target) === SOURCE) throw new Error('Target is the harness package itself. Pass a project folder.');

  // 1. Harness-owned files
  for (const dir of HARNESS_DIRS) {
    for (const file of listFiles(path.join(SOURCE, dir))) {
      const rel = path.relative(SOURCE, file);
      const dest = path.join(target, rel);
      if (fs.existsSync(dest) && !force) {
        log('skip', `${rel} (exists; use --force to overwrite)`);
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(file, dest);
      log('copied', rel);
    }
  }

  // 2. Project folders
  for (const dir of PROJECT_DIRS) {
    const full = path.join(target, dir);
    if (fs.existsSync(full)) continue;
    fs.mkdirSync(full, { recursive: true });
    if (dir.startsWith('tasks/')) fs.writeFileSync(path.join(full, '.gitkeep'), '');
    log('created', `${dir}/`);
  }

  // 3. AGENTS.md
  const agentsPath = path.join(target, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    fs.copyFileSync(path.join(SOURCE, 'AGENTS.md'), agentsPath);
    log('created', 'AGENTS.md');
  } else if (!fs.readFileSync(agentsPath, 'utf8').includes('harness/WORKFLOW.md')) {
    fs.appendFileSync(agentsPath, `\n\n${workflowSection()}\n`);
    log('updated', 'AGENTS.md (appended Project Workflow section)');
  }

  // 4. CLAUDE.md
  const claudePath = path.join(target, 'CLAUDE.md');
  if (!fs.existsSync(claudePath)) {
    fs.copyFileSync(path.join(SOURCE, 'CLAUDE.md'), claudePath);
    log('created', 'CLAUDE.md');
  } else {
    for (const line of CLAUDE_IMPORTS) {
      if (fs.readFileSync(claudePath, 'utf8').includes(line)) continue;
      fs.appendFileSync(claudePath, `\n${line}\n`);
      log('updated', `CLAUDE.md (added ${line})`);
    }
    log('note', 'If CLAUDE.md repeats rules that are now in AGENTS.md, remove the duplicates.');
  }

  console.log('\nDone. In the project, run: claude, then /prd');
}

function main(argv) {
  const flags = argv.filter((a) => a.startsWith('-'));
  const [command, dir = '.'] = argv.filter((a) => !a.startsWith('-'));

  if (flags.includes('--version')) return console.log(require('../package.json').version);
  if (flags.includes('--help') || command !== 'init') {
    console.log(HELP);
    return command && command !== 'init' && !flags.includes('--help') ? process.exit(1) : undefined;
  }
  init(path.resolve(dir), flags.includes('--force'));
}

try {
  main(process.argv.slice(2));
} catch (err) {
  console.error(`prd-harness: ${err.message}`);
  process.exit(1);
}
