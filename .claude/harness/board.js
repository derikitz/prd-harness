#!/usr/bin/env node
// Reads the task board (tasks/, docs/prd.md, docs/wbs.md) with plain code — no model, no tokens.
// Usage: node .claude/harness/board.js [project dir] [--json]
const fs = require('fs');
const path = require('path');

const STATUSES = ['todo', 'doing', 'review', 'done', 'blocked'];
const PRIORITY_RANK = { must: 0, should: 1, could: 2 };
const REQ_ID = /^N?FR-\d+$/;
const WBS_CODE = /^\d+(\.\d+)*$/;

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
    for (const t of list) out.push(line(t) + (status === 'blocked' && t.lastLog ? `\n             ↳ ${t.lastLog}` : ''));
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
  const brief = (t) => ({ id: t.id, title: t.title, type: t.type, file: t.file, risk: t.risk, approval: t.approval });
  console.log(JSON.stringify({
    counts: board.counts,
    inProgress: board.tasks.filter((t) => t.folder === 'doing' || t.folder === 'review').map(brief),
    ready: board.ready.map(brief),
    gaps: board.gaps,
  }, null, 2));
}

module.exports = { readBoard, formatBoard, run };

if (require.main === module) {
  const args = process.argv.slice(2);
  try {
    run(path.resolve(args.find((a) => !a.startsWith('-')) || '.'), args.includes('--json'));
  } catch (err) {
    console.error(`board: ${err.message}`);
    process.exit(1);
  }
}
