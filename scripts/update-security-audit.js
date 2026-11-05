#!/usr/bin/env node
// Maintainer script: refreshes the bundled Cloudflare skill in .claude/skills/security-audit/.
// Usage: node scripts/update-security-audit.js [ref]   (ref = branch, tag or FULL commit hash; default: the repo's default branch)
// Needs git. Not shipped in the npm package. Review `git diff` afterwards: the skill's files are instructions agents will follow.
const path = require('path');
const { fetchSecurityAudit, writeSecurityAudit } = require('../bin/update-skill');

const fetched = fetchSecurityAudit(process.argv[2]);
writeSecurityAudit(path.resolve(__dirname, '../.claude/skills/security-audit'), fetched);
console.log(`Updated .claude/skills/security-audit to ${fetched.commit}. Review with: git diff -- .claude/skills/security-audit`);
