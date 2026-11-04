# Cardprint

A deterministic legality and rotation-risk screener for the Pokemon TCG
Standard format, wired as an MCP tool node so coding agents can call it the
same way they call any Composio tool: JSON-schema in, JSON out.

## Why

Set rotation is the single most annoying part of deckbuilding: half the cards
in a binder go stale every season, and the answer is always buried in
regulation-mark folklore. Cardprint reduces it to one call. Feed it the set
marks you are considering and it returns per-card legality, a seeded rotation
risk score, and deck-wide percentages. Same seed, same answer, every time -
which makes it usable inside agent pipelines where flaky outputs break runs.

## The Composio wiring

The tool node speaks MCP over streamable HTTP (`POST /mcp`):

- `initialize` / `tools/list` follow the standard MCP handshake.
- `tools/call` with `{"name": "screen_deck", "arguments": {"marks": ["A","E","H"]}}`
  runs the engine and returns the screen as tool content.
- When the node is fronted by Composio, the dashboard consumer API key rides
  along as the `x-consumer-api-key` header; `COMPOSIO_API_KEY` is read from
  the environment and `/health` reports whether it is set, never its value.

## Run it

```bash
node server.js
# separate shell
curl -s localhost:8914/health
curl -s -X POST localhost:8914/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"screen_deck","arguments":{"marks":["A","E","V","X"],"seed":2026}}}'
```

## Repository layout

- `engine.js` - the deterministic core (seeded PRNG, regulation marks, screener)
- `server.js` - MCP framing and the `screen_deck` tool definition
- `demo/` - a worked screen of the current rotation window

## Scope notes

Regulation marks are data, not logic: the list lives in one array and rotates
each season. The risk score is seeded per set, so it is stable across runs and
machines but is a modeling artifact, not a prediction. Legality screening is
exact for the marks on file.

## Security

Found a security issue? Open a GitHub issue on this repository and mark it
clearly as a security report; it gets triaged before feature work.
