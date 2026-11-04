#!/usr/bin/env node
/**
 * Cardprint MCP tool node.
 *
 * Exposes one tool, screen_deck, over the Model Context Protocol streamable
 * HTTP transport. Protocol framing goes through @modelcontextprotocol/sdk;
 * the actual work is the deterministic engine in engine.js, and tool
 * definitions come from Composio's MCP registry pattern (one JSON-schema
 * tool per capability, stdio or streamable HTTP).
 *
 * Env:
 *   COMPOSIO_API_KEY  consumer API key from dashboard.composio.dev
 *                     (sent as x-consumer-api-key when Composio fronts MCP)
 *   PORT              default 8914
 *
 * Run: node server.js   (then POST an initialize JSON-RPC to /mcp)
 */
const http = require("http");
const { screenDeck } = require("./engine");

const PORT = Number(process.env.PORT || 8914);
const API_KEY = process.env.COMPOSIO_API_KEY || "";

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

const JSON_HEADERS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

function ok(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function err(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function toolCall(params) {
  const res = screenDeck(params.marks, params.seed);
  return {
    content: [{ type: "text", text: JSON.stringify(res, null, 1) }]
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({
      ok: true,
      tool: TOOL.name,
      composio_configured: Boolean(API_KEY),
      header_in_use: API_KEY ? "x-consumer-api-key" : null
    }));
    return;
  }
  if (req.method !== "POST" || req.url !== "/mcp") {
    res.writeHead(404, JSON_HEADERS);
    res.end(JSON.stringify({ error: "POST /mcp or GET /health only" }));
    return;
  }
  let body = "";
  req.on("data", c => { body += c; });
  req.on("end", () => {
    let msg;
    try {
      msg = JSON.parse(body);
    } catch (e) {
      res.writeHead(400, JSON_HEADERS);
      res.end(JSON.stringify({ error: "bad json" }));
      return;
    }
    const { id, method, params } = msg;
    if (method === "initialize") {
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify(ok(id, {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "cardprint", version: "0.1.0" }
      })));
      return;
    }
    if (method === "tools/list") {
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify(ok(id, { tools: [TOOL] })));
      return;
    }
    if (method === "tools/call") {
      try {
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify(ok(id, toolCall(params.arguments || {}))));
      } catch (e) {
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify(err(id, -32000, String(e.message || e))));
      }
      return;
    }
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify(err(id, -32601, "method not implemented: " + method)));
  });
});

server.listen(PORT, () => {
  console.log(`cardprint MCP node on :${PORT} (composio key ${API_KEY ? "set" : "absent"})`);
});
