// Cardprint engine - deterministic legality + rotation-risk screener for the
// Standard format. Seeded PRNG, zero network calls in the deterministic core.
// The Composio MCP tool node (server.js) shells into this engine so an agent
// can call it as a tool.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Regulation-point marks rotate each season; list is data, not logic.
const ROTATION_MARKS = ["A", "E", "H", "K", "N", "R", "T", "V"];

function screenSet(mark, seed) {
  const rnd = mulberry32(seed);
  const legal = ROTATION_MARKS.includes(mark);
  const risk = Math.round(rnd() * 1000) / 10; // 0-100 rotation-risk score
  return { mark, legal, risk };
}

function screenDeck(marks, seed) {
  if (!Array.isArray(marks) || marks.length === 0) {
    throw new Error("marks must be a non-empty array of single-letter set marks");
  }
  const seedNum = (typeof seed === "number") ? seed : 2026;
  const cards = marks.map((m, i) => screenSet(String(m).toUpperCase(), seedNum + i));
  const legalCount = cards.filter(c => c.legal).length;
  return {
    seed: seedNum,
    cards: cards,
    legalCount,
    total: cards.length,
    legalityPct: Math.round((legalCount / cards.length) * 1000) / 10,
    avgRisk: Math.round((cards.reduce((s, c) => s + c.risk, 0) / cards.length) * 10) / 10
  };
}

module.exports = { mulberry32, screenSet, screenDeck, ROTATION_MARKS };

if (require.main === module) {
  const res = screenDeck(["A", "E", "H", "K", "N", "R", "T", "V", "X", "Z"], 2026);
  console.log(JSON.stringify(res, null, 1));
}
