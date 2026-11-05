// Builds Cursor and Codex CLI files from the Claude Code agents and commands, so there is one source of truth.
// Commands and the kit's own skills go to .agents/skills/ (read by both tools); each agent becomes the tool's own subagent file.
const fs = require('fs');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..');
const SUPPORTED = ['cursor', 'codex'];

// Claude Code wording that other tools don't understand. Each must match somewhere, or the source text has drifted.
const REWRITES = [
  ['SendMessage to its agent ID', "resume it by its agent ID (if your tool can't resume a subagent, start a new engineer and give it the findings and the task file)"],
  ['(pass `model: haiku`)', '(use a cheaper model if your tool lets you choose)'],
];
const ARGUMENTS_NOTE = 'ARGUMENTS means whatever the user typed after invoking this skill (blank if nothing).';

function parseAgents(list) {
  const agents = list.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
  const unknown = agents.filter((a) => !SUPPORTED.includes(a));
  if (!agents.length || unknown.length) {
    throw new Error(`Unknown --agent value "${unknown.join(',') || list}". Supported: ${SUPPORTED.join(', ')}.`);
  }
  return agents;
}

function readMarkdown(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${path.relative(SOURCE, file)} has no frontmatter.`);
  const fields = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon > 0) fields[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return { fields, body: match[2].trim() };
}

function listMarkdown(dir) {
  return fs.readdirSync(path.join(SOURCE, dir)).filter((f) => f.endsWith('.md')).sort()
    .map((f) => ({ name: f.slice(0, -3), ...readMarkdown(path.join(SOURCE, dir, f)) }));
}

function skillFiles() {
  const used = new Set();
  const files = listMarkdown('.claude/commands').map(({ name, fields, body }) => {
    let text = body;
    for (const [from, to] of REWRITES) {
      if (!text.includes(from)) continue;
      text = text.replaceAll(from, to);
      used.add(from);
    }
    const hasArguments = text.includes('$ARGUMENTS');
    text = text.replaceAll('$ARGUMENTS', 'ARGUMENTS');
    const note = hasArguments ? `${ARGUMENTS_NOTE}${fields['argument-hint'] ? ` Expected: ${fields['argument-hint']}` : ''}\n\n` : '';
    const frontmatter = [`name: ${name}`, `description: ${JSON.stringify(fields.description)}`];
    if (fields['disable-model-invocation'] === 'true') frontmatter.push('disable-model-invocation: true');
    return { rel: `.agents/skills/${name}/SKILL.md`, content: `---\n${frontmatter.join('\n')}\n---\n\n${note}${text}\n` };
  });
  const unused = REWRITES.filter(([from]) => !used.has(from));
  if (unused.length) throw new Error(`Adapter rewrite not found in .claude/commands (source text changed?): ${unused.map(([from]) => from).join('; ')}`);
  return files;
}

// The kit's skills (.claude/skills/<name>/...) copied as they are, so the other tools can discover them too.
function copiedSkillFiles() {
  const root = path.join(SOURCE, '.claude/skills');
  const list = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? list(full) : [full];
  });
  return list(root).map((file) => ({
    rel: path.posix.join('.agents/skills', path.relative(root, file).split(path.sep).join('/')),
    content: fs.readFileSync(file, 'utf8'),
  }));
}

function cursorAgent({ name, fields, body }) {
  return { rel: `.cursor/agents/${name}.md`, content: `---\nname: ${name}\ndescription: ${JSON.stringify(fields.description)}\n---\n\n${body}\n` };
}

function codexAgent({ name, fields, body }, models) {
  if (body.includes("'''")) throw new Error(`.claude/agents/${name}.md contains ''' which can't be written to a Codex TOML file.`);
  return {
    rel: `.codex/agents/${name}.toml`,
    content: `name = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(fields.description)}\n${models[name] ? `model = ${JSON.stringify(models[name])}
` : ''}developer_instructions = '''\n${body}\n'''\n`,
  };
}

// The files to write for the chosen tools: [{ rel, content }]
// models: optional { <agent name>: <Codex model ID> }; agents without an entry use the session's model.
function adapterFiles(agents, models = {}) {
  const files = [...skillFiles(), ...copiedSkillFiles()];
  const subagents = listMarkdown('.claude/agents');
  if (agents.includes('cursor')) files.push(...subagents.map(cursorAgent));
  if (agents.includes('codex')) files.push(...subagents.map((agent) => codexAgent(agent, models)));
  return files;
}

function agentNames() {
  return listMarkdown('.claude/agents').map((a) => a.name);
}

module.exports = { SUPPORTED, parseAgents, adapterFiles, agentNames };
