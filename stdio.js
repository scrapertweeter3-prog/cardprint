#!/usr/bin/env node
/**
 * Cardprint stdio entry for containerized MCP clients (Docker MCP Toolkit
 * and friends). Frames the same screen_deck tool as server.js over stdio:
 * newline-delimited JSON-RPC on stdin, responses on stdout. The Composio
 * HTTP node (server.js) stays untouched; both entries share engine.js.
 */
const readline = require("readline");
const { screenDeck, ROTATION_MARKS } = require("./engine");

const TOOL = {
  name: "screen_deck",
  description:
    "Screen a list of Pokemon TCG set marks for Standard-format legality and " +
    "score each card's rotation risk on a seeded 0-100 scale.",
  inputSchema: {
    type: "object",
    properties: {
      marks: {
        type: "array",
        items: { type: "string" },
        description: "Set marks to screen, e.g. [\"A\",\"E\",\"H\"]"
      },
      seed: { type: "number", description: "Deterministic seed, default 2026" }
    },
    required: ["marks"]
  }
};

function ok(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function err(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on("line", line => {
  const raw = line.trim();
  if (!raw) return;
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch (e) {
    process.stdout.write(JSON.stringify(err(null, -32700, "parse error")) + "\n");
    return;
  }
  const { id, method, params } = msg;
  if (method === "initialize") {
    process.stdout.write(JSON.stringify(ok(id, {
      protocolVersion: "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: "cardprint", version: "0.1.0" }
    })) + "\n");
    return;
  }
  if (method === "notifications/initialized") return;
  if (method === "tools/list") {
    process.stdout.write(JSON.stringify(ok(id, { tools: [TOOL] })) + "\n");
    return;
  }
  if (method === "tools/call") {
    try {
      const args = params.arguments || {};
      const res = screenDeck(args.marks, args.seed);
      process.stdout.write(JSON.stringify(ok(id, {
        content: [{ type: "text", text: JSON.stringify(res, null, 1) }]
      })) + "\n");
    } catch (e) {
      process.stdout.write(JSON.stringify(err(id, -32000, String(e.message || e))) + "\n");
    }
    return;
  }
  process.stdout.write(JSON.stringify(err(id, -32601, "method not implemented: " + method)) + "\n");
});
