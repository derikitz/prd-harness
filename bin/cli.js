#!/usr/bin/env node
// Installs the PRD -> WBS -> tasks harness into a project. No dependencies.
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { SUPPORTED, parseAgents, adapterFiles, agentNames, isKitFile } = require('./adapters');

const SOURCE = path.resolve(__dirname, '..');
const HARNESS_DIRS = ['.claude/agents', '.claude/commands', '.claude/harness', '.claude/skills'];
const PROJECT_DIRS = ['docs', 'tasks/todo', 'tasks/doing', 'tasks/review', 'tasks/done', 'tasks/blocked'];
const CLAUDE_IMPORTS = ['@AGENTS.md', '@.claude/harness/WORKFLOW.md'];

const LOCAL_FILE = '.claude/harness/local.md';
// Existing planning docs to offer for import: checked by file name only, in the project root and docs/.
const PLANNING_DOC = /(prd|requirement|spec|wbs|work.?breakdown)[^/\\]*\.(md|txt|pdf|docx|csv|xlsx)$/i;
const HARNESS_DOCS = ['docs/prd.md', 'docs/wbs.md'];
const WORKTREES_IGNORE = '.claude/worktrees/';

const HELP = `Usage:
  prd-harness init [dir] [--force] [--agent=<tools>]   Install the harness into a project (default: current folder)
  prd-harness status [dir] [--json]                    Show the task board, ready tasks and traceability gaps

Options:
  --force     init: overwrite the kit's files (.claude/agents, commands, harness, skills) with this version
  --agent=    init: also write files for other coding agents, comma-separated: ${SUPPORTED.join(', ')}
  --json      status: machine-readable output
  --help      Show this help
  --version   Show version

init never overwrites AGENTS.md, CLAUDE.md, .gitignore or ${LOCAL_FILE}; it only appends the workflow lines.`;

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

const CODEX_MODELS_HEADING = '## Codex models';
const CODEX_MODEL_SAMPLES = 'gpt-6-astra, gpt-6.1-sol, gpt-6.1-terra';

// Models saved in LOCAL_FILE under "## Codex models" as "- <agent>: <model ID>" lines.
function savedCodexModels(localPath) {
  if (!fs.existsSync(localPath)) return {};
  const section = fs.readFileSync(localPath, 'utf8').replace(/\r\n/g, '\n').split(/^## /m).find((part) => part.startsWith('Codex models\n'));
  const models = {};
  for (const line of (section || '').split('\n')) {
    const match = line.match(/^- ([\w-]+): (\S+)\s*$/);
    if (match) models[match[1]] = match[2];
  }
  return models;
}

function saveCodexModels(localPath, models) {
  const text = fs.readFileSync(localPath, 'utf8').replace(/\r\n/g, '\n');
  const rest = text.replace(/\n?## Codex models\n[\s\S]*?(?=\n## |$)/, '').trimEnd();
  const lines = Object.entries(models).map(([name, model]) => '- ' + name + ': ' + model);
  fs.writeFileSync(localPath, rest + '\n\n' + CODEX_MODELS_HEADING + '\n' + lines.join('\n') + '\n');
}

// Asks which Codex model each subagent should use. Enter keeps the saved model (or the session model if none), "-" clears it.
async function askCodexModels(saved) {
  if (!process.stdin.isTTY) {
    log('note', 'not a terminal: Codex subagents use the models saved in ' + LOCAL_FILE + ', else the session model');
    return { models: saved, asked: false };
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const models = {};
  try {
    console.log('\nCodex model per subagent: type the exact model ID (e.g. ' + CODEX_MODEL_SAMPLES + ').');
    console.log('Enter = keep the shown value or use the session model, "-" = clear.');
    for (const name of agentNames()) {
      const shown = saved[name] ? ' [' + saved[name] + ']' : '';
      const answer = (await rl.question('  ' + name + shown + ': ')).trim();
      const model = answer === '-' ? '' : answer || saved[name];
      if (model) models[name] = model;
    }
  } finally {
    rl.close();
  }
  return { models, asked: true };
}

async function init(target, force, agents) {
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

  // Files for other coding agents, generated from the Claude Code ones
  let codex = { models: {}, asked: false };
  if (agents.length) {
    if (agents.includes('codex')) codex = await askCodexModels(savedCodexModels(path.join(target, LOCAL_FILE)));
    for (const { rel, content, generated } of adapterFiles(agents, codex.models)) {
      const dest = path.join(target, rel);
      if (fs.existsSync(dest) && !force) {
        log('skip', `${rel} (exists; use --force to overwrite)`);
        continue;
      }
      // --force replaces the kit's own files, never a same-named file the project wrote itself
      if (fs.existsSync(dest) && generated && !isKitFile(fs.readFileSync(dest, 'utf8'))) {
        log('skip', `${rel} (not written by prd-harness; delete it to let init replace it)`);
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, content);
      log('created', rel);
    }
  }

  // Project customizations: created once, never overwritten (not even with --force)
  const localPath = path.join(target, LOCAL_FILE);
  if (!fs.existsSync(localPath)) {
    fs.copyFileSync(path.join(SOURCE, '.claude/harness/templates/local.md'), localPath);
    log('created', LOCAL_FILE);
  }
  if (codex.asked) saveCodexModels(localPath, codex.models);

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

  // 5. .gitignore: each /next session builds in its own worktree under .claude/worktrees/
  const ignorePath = path.join(target, '.gitignore');
  const ignore = fs.existsSync(ignorePath) ? fs.readFileSync(ignorePath, 'utf8') : '';
  if (!ignore.split(/\r?\n/).includes(WORKTREES_IGNORE)) {
    fs.appendFileSync(ignorePath, `${ignore && !ignore.endsWith('\n') ? '\n' : ''}${WORKTREES_IGNORE}\n`);
    log('updated', `.gitignore (added ${WORKTREES_IGNORE})`);
  }

  const existing = findPlanningDocs(target);
  if (existing.length) {
    console.log('\nFound existing planning docs:');
    for (const file of existing) console.log(`  ${file}`);
    console.log('\nDone. In the project, run: claude, then /prd import <file> (and /wbs import <file> for a WBS — the same file if it holds both)');
  } else {
    console.log('\nDone. In the project, run: claude, then /prd');
  }
}

function findPlanningDocs(target) {
  return ['.', 'docs']
    .filter((dir) => fs.existsSync(path.join(target, dir)))
    .flatMap((dir) => fs.readdirSync(path.join(target, dir), { withFileTypes: true })
      .filter((entry) => entry.isFile() && PLANNING_DOC.test(entry.name))
      .map((entry) => path.posix.join(dir, entry.name)))
    .filter((file) => !HARNESS_DOCS.includes(file));
}

async function main(argv) {
  const flags = argv.filter((a) => a.startsWith('-'));
  const [command, dir = '.'] = argv.filter((a) => !a.startsWith('-'));

  if (flags.includes('--version')) return console.log(require('../package.json').version);
  if (flags.includes('--help') || !command) return console.log(HELP);
  const agentFlag = flags.find((f) => f === '--agent' || f.startsWith('--agent='));
  if (agentFlag === '--agent') throw new Error('Use --agent=<tools>, e.g. --agent=cursor,codex.');
  if (command === 'init') return init(path.resolve(dir), flags.includes('--force'), agentFlag ? parseAgents(agentFlag.slice('--agent='.length)) : []);
  if (command === 'status') return require('../.claude/harness/board.js').run(path.resolve(dir), flags.includes('--json'));
  console.log(HELP);
  process.exit(1);
}

main(process.argv.slice(2)).catch((err) => {
  console.error(`prd-harness: ${err.message}`);
  process.exit(1);
});
