// Fetches Cloudflare's security-audit skill from GitHub. Needs git and network access.
// Used by `init --update-skills` and by scripts/update-security-audit.js (the maintainer refresh of the bundled copy).
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = 'https://github.com/cloudflare/security-audit-skill';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// ref = branch, tag or FULL commit hash (default: the repo's default branch).
// Returns { commit, files: { <name>: <Buffer> }, notice } without touching the project.
function fetchSecurityAudit(ref = 'HEAD') {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'security-audit-'));
  try {
    try {
      git(tmp, 'init', '--quiet');
      git(tmp, 'fetch', '--quiet', '--depth', '1', REPO, ref);
      git(tmp, 'checkout', '--quiet', 'FETCH_HEAD');
    } catch (err) {
      throw new Error(`Could not fetch ${REPO} at "${ref}" (needs git and network access; a commit must be the full hash): ${String(err.stderr || err.message).trim()}`);
    }
    const commit = git(tmp, 'rev-parse', '--short', 'HEAD');
    const source = path.join(tmp, 'skills/security-audit');
    if (!fs.existsSync(path.join(source, 'SKILL.md'))) throw new Error(`No skills/security-audit/SKILL.md at "${ref}": the upstream layout changed.`);

    const files = {};
    for (const file of fs.readdirSync(source)) {
      if (!file.endsWith('.test.cjs')) files[file] = fs.readFileSync(path.join(source, file));
    }
    files.LICENSE = fs.readFileSync(path.join(tmp, 'LICENSE'));
    const notice = `\n\`.claude/skills/security-audit/\` is vendored unmodified from ${REPO} (commit ${commit}; test files omitted). MIT, (c) Cloudflare, Inc. — see \`LICENSE\` in that folder.\n`;
    return { commit, files, notice };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// Replaces the skill folder at dest with the fetched files.
function writeSecurityAudit(dest, { files, notice }) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dest, name), content);
  fs.writeFileSync(path.join(dest, 'NOTICE.md'), notice);
}

module.exports = { fetchSecurityAudit, writeSecurityAudit };
