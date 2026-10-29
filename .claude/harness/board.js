#!/usr/bin/env node
// Reads the task board (tasks/, docs/prd.md, docs/wbs.md) with plain code — no model, no tokens.
// Usage: node .claude/harness/board.js [project dir] [--json]
//        node .claude/harness/board.js claim <task id> [--worktree session-N]    (run from the main checkout)
//        node .claude/harness/board.js lock <task id> | unlock
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const STATUSES = ['todo', 'doing', 'review', 'done', 'blocked'];
const PRIORITY_RANK = { must: 0, should: 1, could: 2 };
const REQ_ID = /^N?FR-\d+$/;
const WBS_CODE = /^\d+(\.\d+)*$/;
const WORKTREES_DIR = '.claude/worktrees';
const MERGE_LOCK = 'prd-harness-merge.lock';
const CLAIM_LOCK = 'prd-harness-claim.lock';
// Lockfiles and dependency lists: when one changes between tasks, a reused worktree needs a reinstall.
const DEPENDENCY_FILE = /lock|^requirements.*\.txt$|^go\.sum$/i;

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].replace(/\s+#.*$/, '').trim();
    if (value.startsWith('[')) value = value.slice(1, -1).split(',').map((v) => v.trim()).filter(Boolean);
    data[m[1]] = value;
  }
  return data;
}

function toList(value) {
  if (Array.isArray(value)) return value;
  return value ? String(value).split(/[,\s]+/).filter(Boolean) : [];
}

// Rows of every markdown table whose first cell matches idPattern, as arrays of trimmed cells.
function tableRows(text, idPattern) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('|'))
    .map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()))
    .filter((cells) => idPattern.test(cells[0]));
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function lastLogLine(text) {
  const log = text.split(/^## Log\s*$/m)[1];
  const lines = log ? log.split(/\r?\n/).filter((l) => l.trim().startsWith('- ')) : [];
  return lines.length ? lines[lines.length - 1].trim().slice(2) : '';
}

function compareWbs(a, b) {
  const pa = String(a || '').split('.').map(Number);
  const pb = String(b || '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

function readBoard(dir) {
  const tasksDir = path.join(dir, 'tasks');
  if (!fs.existsSync(tasksDir)) throw new Error(`No tasks/ folder in ${dir}. Run: prd-harness init`);

  const gaps = [];

  // Requirements from the PRD
  const prdText = readIfExists(path.join(dir, 'docs', 'prd.md'));
  const requirements = new Map();
  if (prdText) {
    for (const cells of tableRows(prdText, REQ_ID)) {
      const isFunctional = cells[0].startsWith('FR-');
      requirements.set(cells[0], {
        priority: isFunctional ? cells[2].toLowerCase() : '',
        status: cells[cells.length - 1].toLowerCase(),
      });
    }
    if (!requirements.size) gaps.push('docs/prd.md has no requirement rows in the template format (| FR-001 | … |) — run /prd import');
  }

  // Work packages from the WBS
  const wbsText = readIfExists(path.join(dir, 'docs', 'wbs.md'));
  const packages = new Map();
  if (wbsText) {
    for (const cells of tableRows(wbsText, WBS_CODE)) {
      packages.set(cells[0], {
        name: cells[1],
        requirements: (cells[3] || '').split(/[,\s]+/).filter((id) => REQ_ID.test(id)),
        status: cells[cells.length - 1].toLowerCase(),
      });
    }
    if (!packages.size) gaps.push('docs/wbs.md has no work package rows in the template format (| 1.1 | … |) — run /wbs import');
  }

  // Tasks
  const tasks = [];
  for (const status of STATUSES) {
    const folder = path.join(tasksDir, status);
    if (!fs.existsSync(folder)) continue;
    for (const name of fs.readdirSync(folder).filter((f) => f.endsWith('.md'))) {
      const file = path.join('tasks', status, name);
      const text = fs.readFileSync(path.join(dir, file), 'utf8');
      const fm = parseFrontmatter(text);
      if (!fm || !fm.id) {
        gaps.push(`${file}: no frontmatter id`);
        continue;
      }
      tasks.push({
        id: fm.id,
        title: fm.title || '',
        type: fm.type || 'task',
        wbs: fm.wbs || '',
        requirements: toList(fm.requirements),
        dependsOn: toList(fm.depends_on),
        approval: fm.approval || 'none',
        risk: fm.risk || 'normal',
        status: fm.status || '',
        worktree: fm.worktree || '',
        folder: status,
        file,
        lastLog: lastLogLine(text),
      });
    }
  }

  const byId = new Map();
  for (const task of tasks) {
    if (byId.has(task.id)) gaps.push(`Duplicate task ID ${task.id}: ${byId.get(task.id).file} and ${task.file}`);
    byId.set(task.id, task);
  }
  const doneIds = new Set(tasks.filter((t) => t.folder === 'done').map((t) => t.id));

  // Per-task checks
  for (const task of tasks) {
    if (task.status !== task.folder) gaps.push(`${task.id}: status "${task.status}" but file is in tasks/${task.folder}/`);
    if (wbsText && task.wbs && !packages.has(task.wbs)) gaps.push(`${task.id}: WBS ${task.wbs} not found in docs/wbs.md`);
    if (prdText) {
      for (const req of task.requirements) {
        if (!requirements.has(req)) gaps.push(`${task.id}: requirement ${req} not found in docs/prd.md`);
      }
    }
    for (const dep of task.dependsOn) {
      if (!byId.has(dep)) gaps.push(`${task.id}: depends on unknown task ${dep}`);
    }
    if ((task.folder === 'doing' || task.folder === 'review') && task.worktree && !fs.existsSync(path.join(dir, task.worktree))) {
      gaps.push(`${task.id}: in progress, but its worktree ${task.worktree} is missing`);
    }
  }

  // Dependency cycles
  const visiting = new Set();
  const visited = new Set();
  const visit = (id, trail) => {
    if (visiting.has(id)) return gaps.push(`Dependency cycle: ${[...trail, id].join(' → ')}`);
    if (visited.has(id) || !byId.has(id)) return;
    visiting.add(id);
    for (const dep of byId.get(id).dependsOn) visit(dep, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const task of tasks) visit(task.id, []);

  // Traceability between layers
  const livePackages = [...packages].filter(([, p]) => p.status !== 'dropped');
  for (const [id, req] of requirements) {
    if (req.status === 'approved' && !livePackages.some(([, p]) => p.requirements.includes(id))) {
      gaps.push(`${id}: approved but not in any work package`);
    }
  }
  for (const [code, pkg] of livePackages) {
    if (pkg.status !== 'done' && !tasks.some((t) => t.wbs === code)) gaps.push(`WBS ${code} (${pkg.name}): no tasks yet`);
  }

  // Ready tasks, in the order /next picks them: PRD priority, bugs before features, then WBS order
  const rank = (task) => Math.min(3, ...task.requirements.map((r) => PRIORITY_RANK[requirements.get(r)?.priority] ?? 3));
  const ready = tasks
    .filter((t) => t.folder === 'todo' && t.dependsOn.every((dep) => doneIds.has(dep)))
    .sort((a, b) =>
      rank(a) - rank(b) ||
      (a.type === 'bug' ? 0 : 1) - (b.type === 'bug' ? 0 : 1) ||
      compareWbs(a.wbs, b.wbs) ||
      a.id.localeCompare(b.id));

  const counts = Object.fromEntries(STATUSES.map((s) => [s, tasks.filter((t) => t.folder === s).length]));
  return { counts, tasks, ready, gaps };
}

function formatBoard({ counts, tasks, ready, gaps }) {
  const line = (t) => `  ${t.id.padEnd(10)} ${t.title}${t.type === 'bug' ? '  [bug]' : ''}${t.approval === 'required' ? '  [needs approval]' : ''}`;
  const out = [`Board   ${Object.entries(counts).map(([s, n]) => `${s} ${n}`).join(' · ')}`];

  for (const status of ['doing', 'review', 'blocked']) {
    const list = tasks.filter((t) => t.folder === status);
    if (!list.length) continue;
    out.push('', `${status[0].toUpperCase()}${status.slice(1)}:`);
    for (const t of list) out.push(line(t) + (status !== 'blocked' && t.worktree ? `  (${t.worktree})` : '') + (status === 'blocked' && t.lastLog ? `\n             ↳ ${t.lastLog}` : ''));
  }

  out.push('', ready.length ? 'Ready (in /next order):' : 'Ready: none');
  for (const t of ready) out.push(line(t));

  out.push('', gaps.length ? `Gaps (${gaps.length}):` : 'Gaps: none');
  for (const gap of gaps) out.push(`  - ${gap}`);
  return out.join('\n');
}

function run(dir, json) {
  const board = readBoard(dir);
  if (!json) return console.log(formatBoard(board));
  const brief = (t) => ({ id: t.id, title: t.title, type: t.type, file: t.file, risk: t.risk, approval: t.approval, worktree: t.worktree });
  console.log(JSON.stringify({
    counts: board.counts,
    inProgress: board.tasks.filter((t) => t.folder === 'doing' || t.folder === 'review').map(brief),
    ready: board.ready.map(brief),
    gaps: board.gaps,
  }, null, 2));
}

function git(dir, args) {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// The .git folder shared by every worktree, or null when this isn't a git repo (or git isn't installed).
function gitCommonDir(dir) {
  try {
    return path.resolve(dir, git(dir, ['rev-parse', '--git-common-dir']));
  } catch (err) {
    if (err.status === 128 || err.code === 'ENOENT') return null;
    throw err;
  }
}

function setField(text, key, value) {
  const line = `${key}: ${value}`;
  const pattern = new RegExp(`^${key}:.*$`, 'm');
  return pattern.test(text) ? text.replace(pattern, line) : text.replace(/^status:.*$/m, (m) => `${m}\n${line}`);
}

// Lock files live in the .git folder all worktrees share (tasks/ without git).
function lockPath(dir, name) {
  return path.join(gitCommonDir(dir) || path.join(dir, 'tasks'), name);
}

// Creating a file with the 'wx' flag fails if it exists, so only one session can hold the lock.
function tryLock(file, owner) {
  try {
    fs.writeFileSync(file, `${owner} ${new Date().toISOString()}\n`, { flag: 'wx' });
    return true;
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    return false;
  }
}

// Claims take turns behind a short lock, so two sessions starting at once can't take the same task.
function claim(dir, id, preferred) {
  const file = lockPath(dir, CLAIM_LOCK);
  const deadline = Date.now() + 15000;
  while (!tryLock(file, id)) {
    if (Date.now() > deadline) {
      throw new Error(`Another session is claiming a task (${fs.readFileSync(file, 'utf8').trim()}); delete ${file} if none is`);
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  try {
    claimTask(dir, id, preferred);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

// Picks a session worktree no in-progress task is using (the preferred one if it's free), or creates the next session-N.
// Worktrees with uncommitted changes are skipped — they may hold someone's unsaved work.
function pickWorktree(dir, tasks, preferred) {
  const inUse = new Set(tasks.filter((t) => t.folder === 'doing' || t.folder === 'review').map((t) => t.worktree));
  const root = path.join(dir, WORKTREES_DIR);
  const names = fs.existsSync(root) ? fs.readdirSync(root).filter((n) => /^session-\d+$/.test(n)) : [];
  names.sort((a, b) => (a === preferred ? -1 : b === preferred ? 1 : Number(a.slice(8)) - Number(b.slice(8))));

  for (const name of names) {
    const worktree = `${WORKTREES_DIR}/${name}`;
    if (inUse.has(worktree)) continue;
    const dirty = git(path.join(dir, worktree), ['status', '--porcelain']);
    if (dirty) {
      console.log(`skipped  ${worktree} (uncommitted changes — check them, then commit or discard)`);
      continue;
    }
    return { worktree, isNew: false };
  }
  let n = 1;
  while (names.includes(`session-${n}`)) n++;
  const worktree = `${WORKTREES_DIR}/session-${n}`;
  git(dir, ['worktree', 'add', '--detach', worktree, 'HEAD']);
  return { worktree, isNew: true };
}

// Moves a todo task to doing/ and, in a git repo, checks out its branch task/<id> in a free session worktree.
function claimTask(dir, id, preferred) {
  const { tasks } = readBoard(dir);
  const task = tasks.find((t) => t.id === id);
  if (!task) throw new Error(`No task ${id}`);
  if (task.folder !== 'todo') throw new Error(`${id} is in tasks/${task.folder}/, not todo/ — another session may be working on it`);

  const doingFile = path.join(dir, 'tasks', 'doing', path.basename(task.file));
  fs.renameSync(path.join(dir, task.file), doingFile);

  let worktree = '';
  const notes = [];
  if (gitCommonDir(dir)) {
    const branch = `task/${id}`;
    try {
      const picked = pickWorktree(dir, tasks, preferred);
      worktree = picked.worktree;
      const wt = path.join(dir, worktree);
      const before = git(wt, ['rev-parse', 'HEAD']);
      if (git(dir, ['branch', '--list', branch])) {
        git(wt, ['checkout', branch]);
        notes.push(`continuing existing branch ${branch}`);
      } else {
        git(wt, ['checkout', '-b', branch, git(dir, ['rev-parse', 'HEAD'])]);
        notes.push(`new branch ${branch}`);
      }
      if (picked.isNew) {
        notes.push('setup: new worktree — install dependencies');
      } else {
        const changed = git(wt, ['diff', '--name-only', before, 'HEAD']).split('\n').filter((f) => DEPENDENCY_FILE.test(path.basename(f)));
        notes.push(changed.length ? `setup: dependency files changed (${changed.join(', ')}) — reinstall` : 'setup: none needed');
      }
    } catch (err) {
      fs.renameSync(doingFile, path.join(dir, task.file)); // undo the claim so the board stays accurate
      throw new Error(`Could not prepare a worktree for ${id}: ${(err.stderr || err.message).trim()}`);
    }
  }

  let text = setField(fs.readFileSync(doingFile, 'utf8'), 'status', 'doing');
  if (worktree) text = setField(text, 'worktree', worktree);
  const date = new Date().toISOString().slice(0, 10);
  text = `${text.trimEnd()}\n- ${date} — claimed by /next${worktree ? ` (worktree ${worktree})` : ''}\n`;
  fs.writeFileSync(doingFile, text);

  console.log(`claimed  ${id} → tasks/doing/${path.basename(task.file)}`);
  if (worktree) console.log(`worktree ${worktree} (${notes.join('; ')})`);
}

// Only one session merges into the main checkout at a time.
function lock(dir, id) {
  const file = lockPath(dir, MERGE_LOCK);
  if (!tryLock(file, id)) {
    throw new Error(`Merge locked by another session: ${fs.readFileSync(file, 'utf8').trim()} (delete ${file} if that session is gone)`);
  }
  console.log(`locked   ${id}`);
}

function unlock(dir) {
  fs.rmSync(lockPath(dir, MERGE_LOCK), { force: true });
  console.log('unlocked');
}

module.exports = { readBoard, formatBoard, run, claim, lock, unlock };

if (require.main === module) {
  const args = process.argv.slice(2);
  const flagAt = args.indexOf('--worktree');
  const preferred = flagAt >= 0 ? args.splice(flagAt, 2)[1] : '';
  const [command, arg] = args.filter((a) => !a.startsWith('-'));
  try {
    if ((command === 'claim' || command === 'lock') && !arg) throw new Error(`Usage: board.js ${command} <task id>`);
    if (command === 'claim') claim(process.cwd(), arg, preferred);
    else if (command === 'lock') lock(process.cwd(), arg);
    else if (command === 'unlock') unlock(process.cwd());
    else run(path.resolve(command || '.'), args.includes('--json'));
  } catch (err) {
    console.error(`board: ${err.message}`);
    process.exit(1);
  }
}
