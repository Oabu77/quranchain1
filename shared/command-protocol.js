// ==========================================================
// QuranChain™ Unified AI Command Protocol
// "Hello QuranChain" — 101 Agents, 15 Domains, 8 Safety Gates
// ==========================================================
const { execSync } = require("child_process");
const agentRouter = require("./agent-router");
const founderAgent = require("./founder-agent");

const WORKSPACE = "/workspaces/quranchain1";
const FOUNDER_ID = process.env.FOUNDER_DISCORD_ID;

// ── Wake Phrases ────────────────────────────────────────────
const WAKE_PHRASES = [
  /^hello\s+quranchain/i,
  /^hello\s+omar\s*ai/i,
  /^hello\s+darcloud/i,
  /^hey\s+quranchain/i,
  /^ya\s+quranchain/i,
  /^qc\s+/i,
  /^dc\s+/i,
];

// ── Authority Levels ────────────────────────────────────────
const AUTHORITY = {
  F0: { level: 0, name: "Founder Absolute",    label: "F0", canExecute: true,  canOverride: true,  scope: "all" },
  A1: { level: 1, name: "Admin Full",          label: "A1", canExecute: true,  canOverride: false, scope: "all" },
  A2: { level: 2, name: "Admin Limited",        label: "A2", canExecute: true,  canOverride: false, scope: "assigned" },
  M1: { level: 3, name: "Manager Domain",       label: "M1", canExecute: true,  canOverride: false, scope: "domain" },
  M2: { level: 4, name: "Manager Read-Execute",label: "M2", canExecute: true,  canOverride: false, scope: "domain" },
  O1: { level: 5, name: "Operator",             label: "O1", canExecute: true,  canOverride: false, scope: "limited" },
  R1: { level: 6, name: "Read-Only",            label: "R1", canExecute: false, canOverride: false, scope: "read" },
};

// ── Execution Modes ─────────────────────────────────────────
const EXEC_MODES = {
  OBSERVE:    { id: "observe",    label: "Observe",   description: "Read-only data retrieval, no side effects" },
  RECOMMEND:  { id: "recommend",  label: "Recommend", description: "Analyze and suggest actions without executing" },
  CONFIRM:    { id: "confirm",    label: "Confirm",   description: "Prepare action, require explicit approval" },
  EXECUTE:    { id: "execute",    label: "Execute",   description: "Execute immediately (F0/A1 only)" },
  EMERGENCY:  { id: "emergency",  label: "Emergency", description: "Immediate execute, bypass non-safety gates (F0 only)" },
};

// ── Priority Levels ─────────────────────────────────────────
const PRIORITY = {
  P0: { level: 0, label: "CRITICAL",  timeout: 5000,   badge: "🔴" },
  P1: { level: 1, label: "HIGH",      timeout: 15000,  badge: "🟠" },
  P2: { level: 2, label: "MEDIUM",    timeout: 30000,  badge: "🟡" },
  P3: { level: 3, label: "LOW",       timeout: 60000,  badge: "🟢" },
  P4: { level: 4, label: "SCHEDULED", timeout: 120000, badge: "🔵" },
};

// ── Command Verbs ───────────────────────────────────────────
const VERBS = {
  // Observation verbs (R1+)
  show:      { mode: "observe",   minAuth: "R1",  description: "Display current state" },
  check:     { mode: "observe",   minAuth: "R1",  description: "Verify condition" },
  list:      { mode: "observe",   minAuth: "R1",  description: "Enumerate items" },
  summarize: { mode: "observe",   minAuth: "R1",  description: "Provide summary" },
  compare:   { mode: "observe",   minAuth: "R1",  description: "Compare metrics" },
  // Recommendation verbs (M2+)
  recommend: { mode: "recommend", minAuth: "M2",  description: "Suggest action" },
  // Action verbs (M1+)
  prepare:   { mode: "confirm",   minAuth: "M1",  description: "Stage for execution" },
  execute:   { mode: "execute",   minAuth: "A1",  description: "Execute immediately" },
  pause:     { mode: "execute",   minAuth: "M1",  description: "Pause operation" },
  resume:    { mode: "execute",   minAuth: "M1",  description: "Resume operation" },
  restart:   { mode: "execute",   minAuth: "M1",  description: "Restart service" },
  // Audit verbs (A2+)
  audit:     { mode: "observe",   minAuth: "A2",  description: "Run compliance audit" },
};

// ── Safety Gates ────────────────────────────────────────────
const SAFETY_GATES = [
  { id: "identity",   name: "Identity Verification",   priority: 0, required: true  },
  { id: "permission", name: "Permission Check",         priority: 1, required: true  },
  { id: "policy",     name: "Policy Compliance",         priority: 2, required: true  },
  { id: "sharia",     name: "Sharia Compliance",         priority: 3, required: true  },
  { id: "risk",       name: "Risk Assessment",           priority: 4, required: false },
  { id: "resource",   name: "Resource Availability",     priority: 5, required: false },
  { id: "audit",      name: "Audit Trail",               priority: 6, required: true  },
  { id: "dispatch",   name: "Agent Dispatch",             priority: 7, required: true  },
];

// ── Sharia-Sensitive Operations ─────────────────────────────
const SHARIA_CHECK_PATTERNS = /\b(interest|riba|gambling|alcohol|pork|haram|usury|conventional.?loan|betting)\b/i;
const SHARIA_BLOCKED_ACTIONS = ["interest_charge", "gambling_enable", "riba_transaction"];

// ── Audit Log (in-memory ring buffer) ───────────────────────
const AUDIT_LOG = [];
const AUDIT_MAX = 500;

function auditLog(entry) {
  entry.timestamp = new Date().toISOString();
  AUDIT_LOG.push(entry);
  if (AUDIT_LOG.length > AUDIT_MAX) AUDIT_LOG.shift();
}

// ── Command Parser ──────────────────────────────────────────

/**
 * Detect if a message contains a wake phrase
 * @param {string} message
 * @returns {{ matched: boolean, remainder: string }}
 */
function detectWake(message) {
  const trimmed = message.trim();
  for (const pattern of WAKE_PHRASES) {
    const match = trimmed.match(pattern);
    if (match) {
      return { matched: true, remainder: trimmed.slice(match[0].length).trim() };
    }
  }
  return { matched: false, remainder: trimmed };
}

/**
 * Parse command grammar: [verb] [target] [scope] [constraints]
 * @param {string} command - The command after wake phrase is stripped
 * @returns {{ verb: string, target: string, scope: string, constraints: object, raw: string }}
 */
function parseCommand(command) {
  const tokens = command.split(/\s+/);
  const verbToken = (tokens[0] || "").toLowerCase();

  // Match verb
  const verb = VERBS[verbToken] ? verbToken : inferVerb(command);

  // Everything after verb is target+scope
  const afterVerb = verb === verbToken ? tokens.slice(1).join(" ") : command;

  // Extract constraints (key:value pairs or flags)
  const constraints = {};
  const constraintPattern = /(\w+):(\S+)/g;
  let cm;
  while ((cm = constraintPattern.exec(afterVerb)) !== null) {
    constraints[cm[1]] = cm[2];
  }
  const cleanTarget = afterVerb.replace(constraintPattern, "").trim();

  // Extract scope indicators
  let scope = "global";
  if (/\b(all|everything|entire|full)\b/i.test(cleanTarget)) scope = "global";
  else if (/\b(this|current|my|local)\b/i.test(cleanTarget)) scope = "local";
  else if (/\b(domain|sector|department)\b/i.test(cleanTarget)) scope = "domain";

  return {
    verb,
    target: cleanTarget,
    scope,
    constraints,
    raw: command,
  };
}

/**
 * Infer verb from natural language if not explicitly stated
 */
function inferVerb(command) {
  const lower = command.toLowerCase();
  if (/^(what|how|where|when|who)\b/.test(lower)) return "show";
  if (/\b(is .+ (running|online|working|active))\b/.test(lower)) return "check";
  if (/\b(how many|count|number of)\b/.test(lower)) return "list";
  if (/\b(give me a summary|brief|overview|tldr)\b/.test(lower)) return "summarize";
  if (/\b(compare|vs|versus|difference)\b/.test(lower)) return "compare";
  if (/\b(should i|what should|suggest|recommend)\b/.test(lower)) return "recommend";
  if (/\b(deploy|restart|reboot|start|stop|kill)\b/.test(lower)) return "execute";
  if (/\b(pause|freeze|hold)\b/.test(lower)) return "pause";
  if (/\b(resume|continue|unpause)\b/.test(lower)) return "resume";
  if (/\b(audit|compliance|check compliance)\b/.test(lower)) return "audit";
  return "show"; // default
}

// ── Authority Resolution ────────────────────────────────────

/**
 * Resolve user's authority level
 * @param {string} userId - Discord user ID
 * @param {object} [roles] - User's Discord roles
 * @returns {object} Authority level object
 */
function resolveAuthority(userId, roles) {
  // F0: Founder
  if (FOUNDER_ID && userId === FOUNDER_ID) return AUTHORITY.F0;

  // Role-based authority (check Discord roles if provided)
  if (roles) {
    if (roles.has("admin") || roles.has("Admin")) return AUTHORITY.A1;
    if (roles.has("manager") || roles.has("Manager")) return AUTHORITY.M1;
    if (roles.has("operator") || roles.has("Operator")) return AUTHORITY.O1;
  }

  // Default: Read-Only
  return AUTHORITY.R1;
}

/**
 * Check if authority level permits a verb
 */
function isAuthorized(authority, verb) {
  const verbDef = VERBS[verb];
  if (!verbDef) return false;
  const minAuth = AUTHORITY[verbDef.minAuth];
  if (!minAuth) return false;
  return authority.level <= minAuth.level;
}

// ── Safety Gate Processor ───────────────────────────────────

/**
 * Run all 8 safety gates
 * @returns {{ passed: boolean, results: Array, blocked: string|null }}
 */
function runSafetyGates(parsedCommand, authority, route) {
  const results = [];
  let blocked = null;

  for (const gate of SAFETY_GATES) {
    const result = evaluateGate(gate, parsedCommand, authority, route);
    results.push({ gate: gate.id, name: gate.name, ...result });
    if (!result.passed && gate.required) {
      blocked = `${gate.name}: ${result.reason}`;
      break;
    }
  }

  return { passed: !blocked, results, blocked };
}

function evaluateGate(gate, parsedCommand, authority, route) {
  switch (gate.id) {
    case "identity":
      return { passed: !!authority && authority.level <= 6, reason: "Unknown user" };

    case "permission": {
      const authorized = isAuthorized(authority, parsedCommand.verb);
      return { passed: authorized, reason: authorized ? null : `${authority.name} cannot ${parsedCommand.verb}` };
    }

    case "policy": {
      // Block destructive ops from non-founder
      const destructive = /\b(drop|delete|wipe|purge|truncate|destroy|rm\s+-rf)\b/i.test(parsedCommand.raw);
      if (destructive && authority.level > 0) {
        return { passed: false, reason: "Destructive operation requires Founder authority" };
      }
      return { passed: true };
    }

    case "sharia": {
      const shariaViolation = SHARIA_CHECK_PATTERNS.test(parsedCommand.raw);
      if (shariaViolation) {
        return { passed: false, reason: "Potential Sharia compliance violation detected — manual review required" };
      }
      return { passed: true };
    }

    case "risk": {
      // High-risk if executing on production with global scope
      const highRisk = parsedCommand.scope === "global" &&
        (parsedCommand.verb === "execute" || parsedCommand.verb === "restart") &&
        authority.level > 1;
      return { passed: !highRisk, reason: highRisk ? "Global execution requires Admin+ authority" : null };
    }

    case "resource":
      return { passed: true }; // Resource checks would query actual system metrics

    case "audit":
      // Always pass, but log the attempt
      auditLog({
        user: authority.name,
        level: authority.label,
        verb: parsedCommand.verb,
        target: parsedCommand.target,
        domain: route.domain.id,
        scope: parsedCommand.scope,
      });
      return { passed: true };

    case "dispatch":
      return { passed: !!route.domain, reason: route.domain ? null : "No domain resolved" };

    default:
      return { passed: true };
  }
}

// ── Execution Mode Resolution ───────────────────────────────

/**
 * Determine execution mode from verb + authority
 */
function resolveExecMode(verb, authority) {
  const verbDef = VERBS[verb];
  if (!verbDef) return EXEC_MODES.OBSERVE;

  // Emergency mode only for F0
  if (authority.level === 0 && verbDef.mode === "execute") return EXEC_MODES.EXECUTE;

  // Non-exec users get downgraded to observe or recommend
  if (!authority.canExecute && verbDef.mode === "execute") return EXEC_MODES.RECOMMEND;

  return EXEC_MODES[verbDef.mode.toUpperCase()] || EXEC_MODES.OBSERVE;
}

// ── Priority Resolution ─────────────────────────────────────

function resolvePriority(parsedCommand, route) {
  // P0 for emergency/critical keywords
  if (/\b(emergency|critical|down|outage|crash|urgent)\b/i.test(parsedCommand.raw)) return PRIORITY.P0;
  // P1 for security-related
  if (route.domain.id === "security" || /\b(breach|attack|vulnerability)\b/i.test(parsedCommand.raw)) return PRIORITY.P1;
  // P2 for action verbs
  if (["execute", "restart", "pause", "resume"].includes(parsedCommand.verb)) return PRIORITY.P2;
  // P3 for standard queries
  if (["show", "check", "list", "summarize"].includes(parsedCommand.verb)) return PRIORITY.P3;
  // P4 for scheduling
  return PRIORITY.P4;
}

// ── Command Executor ────────────────────────────────────────

/**
 * Execute a protocol command through all gates
 * @param {string} message - Raw user message
 * @param {string} userId - Discord user ID
 * @param {object} [roles] - Discord roles
 * @returns {object} Protocol response
 */
async function processCommand(message, userId, roles) {
  const startTime = Date.now();

  // 1. Wake phrase detection
  const wake = detectWake(message);
  if (!wake.matched) {
    return { protocol: false, reason: "No wake phrase detected" };
  }

  // 2. Parse command grammar
  const parsed = parseCommand(wake.remainder);

  // 3. Resolve authority
  const authority = resolveAuthority(userId, roles);

  // 4. Route to domain/agent
  const route = agentRouter.resolveRoute(parsed.target);

  // 5. Resolve execution mode + priority
  const execMode = resolveExecMode(parsed.verb, authority);
  const priority = resolvePriority(parsed, route);

  // 6. Run safety gates
  const safety = runSafetyGates(parsed, authority, route);

  if (!safety.passed) {
    auditLog({
      type: "BLOCKED",
      user: userId,
      authority: authority.label,
      command: parsed.raw,
      gate: safety.blocked,
    });

    return formatResponse({
      status: "BLOCKED",
      command: parsed,
      authority,
      route,
      execMode,
      priority,
      safety,
      result: null,
      executionMs: Date.now() - startTime,
    });
  }

  // 7. Execute command
  let result;
  try {
    result = await executeCommand(parsed, authority, route, execMode);
  } catch (err) {
    result = { success: false, error: err.message };
  }

  // 8. Format standard response
  return formatResponse({
    status: result?.success ? "COMPLETED" : "FAILED",
    command: parsed,
    authority,
    route,
    execMode,
    priority,
    safety,
    result,
    executionMs: Date.now() - startTime,
  });
}

// ── Command Execution Engine ────────────────────────────────

async function executeCommand(parsed, authority, route, execMode) {
  // Observe mode: route to appropriate data fetcher
  if (execMode.id === "observe") {
    return await executeObserve(parsed, route);
  }

  // Recommend mode: analyze and suggest
  if (execMode.id === "recommend") {
    return await executeRecommend(parsed, route);
  }

  // Confirm mode: prepare but don't execute
  if (execMode.id === "confirm") {
    return { success: true, mode: "confirm", message: `Prepared: ${parsed.verb} ${parsed.target}. Reply 'confirm' to execute.` };
  }

  // Execute mode: use founder-agent's safe execution
  if (execMode.id === "execute" || execMode.id === "emergency") {
    return await executeAction(parsed, authority, route);
  }

  return { success: false, error: "Unknown execution mode" };
}

async function executeObserve(parsed, route) {
  const domain = route.domain.id;

  switch (domain) {
    case "status": {
      const dashboard = founderAgent.getFounderDashboard();
      return { success: true, data: dashboard.data, domain };
    }
    case "revenue": {
      const revenue = founderAgent.getRevenueReport();
      return { success: true, data: revenue.data, domain };
    }
    case "deployment": {
      const pm2 = safeExec("pm2 jlist");
      let services = [];
      try { services = JSON.parse(pm2); } catch {}
      const running = services.filter(s => s.pm2_env?.status === "online").length;
      return {
        success: true,
        domain,
        data: {
          services: `${running}/${services.length} online`,
          list: services.map(s => `${s.pm2_env?.status === "online" ? "🟢" : "🔴"} ${s.name}`).join("\n"),
          lastCommit: safeExec("git log --oneline -1"),
        },
      };
    }
    case "blockchain": {
      return {
        success: true,
        domain,
        data: {
          chain: "QuranChain (QRN)",
          networks: founderAgent.EMPIRE.infrastructure.blockchains + " chains",
          gasToll: "47 networks via gas toll",
          validators: founderAgent.EMPIRE.revenueSplit.aiValidators,
        },
      };
    }
    case "telecom": {
      return {
        success: true,
        domain,
        data: {
          towers: "Cell tower infrastructure",
          ports: "UDP 10001-10021, TCP 11001-11021, DNS 12001-12021",
          meshNodes: founderAgent.EMPIRE.infrastructure.meshNodes.toLocaleString() + " nodes",
        },
      };
    }
    case "cloud": {
      const disk = safeExec("df -h / | awk 'NR==2{print $3\"/\"$2\" (\"$5\" used)\"}'");
      const mem = safeExec("free -h | grep Mem | awk '{print $3\"/\"$2}'");
      const load = safeExec("cat /proc/loadavg | awk '{print $1, $2, $3}'");
      return {
        success: true,
        domain,
        data: { disk, memory: mem, loadAvg: load, worker: "Cloudflare Workers", db: "D1 (72 tables)" },
      };
    }
    case "membership": {
      return {
        success: true,
        domain,
        data: {
          plans: Object.values(founderAgent.EMPIRE.stripeProducts).map(p => `${p.name}: ${p.price}`).join(" | "),
          split: Object.entries(founderAgent.EMPIRE.revenueSplit).map(([k, v]) => `${k}: ${v}`).join(" | "),
        },
      };
    }
    case "security": {
      return {
        success: true,
        domain,
        data: { auth: "JWT + PBKDF2", stripe: "Webhook signature verification", sql: "Parameterized queries only" },
      };
    }
    case "governance": {
      return {
        success: true,
        domain,
        data: {
          companies: founderAgent.EMPIRE.companies + " companies",
          tiers: Object.entries(founderAgent.EMPIRE.tiers).map(([k, v]) => `${k}: ${v}`).join(" | "),
          compliance: "Shariah-compliant • Revenue immutable on-chain",
        },
      };
    }
    default: {
      // Generic observe — delegate to founder agent NL
      const nlResult = await founderAgent.executeNL(parsed.raw, FOUNDER_ID || "system");
      return { success: nlResult.success, data: nlResult.data || { message: nlResult.message || nlResult.answer }, domain };
    }
  }
}

async function executeRecommend(parsed, route) {
  return {
    success: true,
    mode: "recommend",
    domain: route.domain.id,
    recommendation: `Analyzing: "${parsed.target}" in ${route.domain.label}. Based on current system state, recommended action: ${parsed.verb} with scope=${parsed.scope}.`,
  };
}

async function executeAction(parsed, authority, route) {
  // Only F0/A1 can directly execute
  if (authority.level > 1) {
    return { success: false, error: "Execution requires Admin+ authority" };
  }

  const verb = parsed.verb;
  const target = parsed.target.toLowerCase();

  // Deploy actions
  if (verb === "execute" || verb === "restart") {
    if (/\bapi\b/.test(target) || /\bworker\b/.test(target)) {
      return await founderAgent.executeDeploy("api");
    }
    if (/\bbot(s)?\b/.test(target)) {
      return await founderAgent.executeDeploy("bots");
    }
    if (/\bdocker\b/.test(target)) {
      return await founderAgent.executeDeploy("docker");
    }
    if (/\ball\b/.test(target)) {
      return await founderAgent.executeDeploy("all");
    }
  }

  // Pause/resume PM2
  if (verb === "pause" || verb === "resume") {
    const action = verb === "pause" ? "stop" : "restart";
    if (/\ball\b/.test(target)) {
      const out = safeExec(`pm2 ${action} all`);
      return { success: true, action: verb, output: out };
    }
    // Extract service name
    const svcMatch = target.match(/(\w+-?\w+)/);
    if (svcMatch) {
      const out = safeExec(`pm2 ${action} ${svcMatch[1]}`);
      return { success: true, action: verb, target: svcMatch[1], output: out };
    }
  }

  // Fallback to founder agent NL
  return await founderAgent.executeNL(parsed.raw, FOUNDER_ID || "system");
}

// ── Response Formatter ──────────────────────────────────────

function formatResponse({ status, command, authority, route, execMode, priority, safety, result, executionMs }) {
  const gatesSummary = safety.results.map(g => `${g.passed ? "✅" : "❌"} ${g.name}`).join("\n");

  const response = {
    protocol: true,
    // Header
    status,
    priority: priority.label,
    priorityBadge: priority.badge,
    // Command
    command: {
      verb: command.verb,
      target: command.target,
      scope: command.scope,
      raw: command.raw,
    },
    // Routing
    routedTo: {
      domain: route.domain.label,
      domainId: route.domain.id,
      bot: route.bot.key,
      botName: route.bot.name,
      confidence: route.confidence,
      agents: route.domain.agentRange
        ? `#${route.domain.agentRange[0]}–#${route.domain.agentRange[1]}`
        : "system",
    },
    // Authority
    authority: {
      level: authority.label,
      name: authority.name,
    },
    // Execution
    execMode: execMode.label,
    // Safety gates
    safetyGates: gatesSummary,
    safetyPassed: safety.passed,
    blocked: safety.blocked,
    // Result
    result: result,
    // Meta
    executionMs,
  };

  return response;
}

// ── Discord Embed Formatter ─────────────────────────────────

/**
 * Format a protocol response into a Discord-compatible embed object
 * @param {object} response - Protocol response from processCommand
 * @returns {{ title: string, color: number, description: string, fields: Array }}
 */
function toEmbed(response) {
  if (!response.protocol) return null;

  const colors = {
    COMPLETED: 0x22c55e,
    BLOCKED:   0xef4444,
    FAILED:    0xdc3545,
    PENDING:   0xf59e0b,
  };

  const statusIcons = {
    COMPLETED: "✅",
    BLOCKED: "🚫",
    FAILED: "❌",
    PENDING: "⏳",
  };

  const title = `${response.priorityBadge} ${statusIcons[response.status] || "❓"} QuranChain Command Protocol`;
  const color = colors[response.status] || 0x6b7280;

  const fields = [
    { name: "📩 COMMAND RECEIVED", value: `\`${response.command.raw}\``, inline: false },
    { name: "🎯 VERB", value: response.command.verb, inline: true },
    { name: "📋 SCOPE", value: response.command.scope, inline: true },
    { name: "⚡ MODE", value: response.execMode, inline: true },
    { name: "🔀 ROUTED TO", value: `**${response.routedTo.botName}** → ${response.routedTo.domain}\nAgents: ${response.routedTo.agents}`, inline: false },
    { name: "🔐 AUTHORITY", value: `${response.authority.level} — ${response.authority.name}`, inline: true },
    { name: `${response.priorityBadge} PRIORITY`, value: response.priority, inline: true },
    { name: "🛡️ SAFETY GATES", value: response.safetyGates, inline: false },
  ];

  if (response.blocked) {
    fields.push({ name: "🚫 BLOCKED BY", value: response.blocked, inline: false });
  }

  // Result data
  if (response.result?.data) {
    const data = response.result.data;
    const formatted = typeof data === "string" ? data :
      Object.entries(data).map(([k, v]) => `**${k}:** ${v}`).join("\n");
    fields.push({ name: "📊 RESULT", value: truncate(formatted, 1024), inline: false });
  } else if (response.result?.message) {
    fields.push({ name: "📊 RESULT", value: truncate(response.result.message, 1024), inline: false });
  } else if (response.result?.recommendation) {
    fields.push({ name: "💡 RECOMMENDATION", value: response.result.recommendation, inline: false });
  } else if (response.result?.output) {
    fields.push({ name: "📊 OUTPUT", value: `\`\`\`\n${truncate(response.result.output, 900)}\n\`\`\``, inline: false });
  } else if (response.result?.error) {
    fields.push({ name: "❌ ERROR", value: response.result.error, inline: false });
  }

  fields.push({ name: "⏱️ EXECUTION", value: `${response.executionMs}ms`, inline: true });

  return { title, color, description: `**STATUS:** ${response.status}`, fields };
}

// ── Helpers ──────────────────────────────────────────────────

function safeExec(cmd, timeout = 15000) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout, cwd: WORKSPACE, maxBuffer: 1024 * 512 }).trim();
  } catch (err) {
    return (err.stderr || err.stdout || err.message || "Command failed").trim();
  }
}

function truncate(str, max = 1024) {
  if (!str) return "—";
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

// ── Get Recent Audit Log ────────────────────────────────────

function getAuditLog(count = 20) {
  return AUDIT_LOG.slice(-count).reverse();
}

// ── List Available Commands ─────────────────────────────────

function getHelp() {
  const verbs = Object.entries(VERBS).map(([v, d]) => `**${v}** — ${d.description} (${d.minAuth}+)`).join("\n");
  const domains = agentRouter.listDomains().map(d => `**${d.label}** → ${d.bot} ${d.agents}`).join("\n");
  const wake = WAKE_PHRASES.map(p => `\`${p.source.replace(/[\\^$]/g, "")}\``).join(", ");

  return {
    title: "QuranChain™ Command Protocol — Help",
    wakePhrases: wake,
    verbs,
    domains,
    modes: Object.values(EXEC_MODES).map(m => `**${m.label}** — ${m.description}`).join("\n"),
    authorities: Object.values(AUTHORITY).map(a => `**${a.label}** — ${a.name}`).join("\n"),
    priorities: Object.values(PRIORITY).map(p => `${p.badge} **${p.label}**`).join(" | "),
    example: "Hello QuranChain show system status\nHello QuranChain list all blockchain nodes\nqc restart api\ndc check revenue",
  };
}

module.exports = {
  // Core
  processCommand,
  detectWake,
  parseCommand,
  // Formatting
  formatResponse,
  toEmbed,
  // Authority
  resolveAuthority,
  isAuthorized,
  AUTHORITY,
  // Safety
  runSafetyGates,
  SAFETY_GATES,
  // Modes & Priority
  EXEC_MODES,
  PRIORITY,
  VERBS,
  // Audit
  getAuditLog,
  auditLog,
  // Help
  getHelp,
  // Internals for testing
  WAKE_PHRASES,
};
