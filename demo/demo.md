# Demo: current rotation window screen

Run recorded 2026-11-04, seed 2026, node 18+.

```bash
$ node engine.js
```

Output (verbatim from the run above):

```json
{
 "seed": 2026,
 "cards": [
  {"mark": "A", "legal": true, "risk": 45.5},
  {"mark": "E", "legal": true, "risk": 98.8},
  {"mark": "H", "legal": true, "risk": 5},
  {"mark": "K", "legal": true, "risk": 40.1},
  {"mark": "N", "legal": true, "risk": 93.3},
  {"mark": "R", "legal": true, "risk": 10.4},
  {"mark": "T", "legal": true, "risk": 20.5},
  {"mark": "V", "legal": true, "risk": 94.5},
  {"mark": "X", "legal": false, "risk": 61.1},
  {"mark": "Z", "legal": false, "risk": 79.8}
 ],
 "legalCount": 8,
 "total": 10,
 "legalityPct": 80,
 "avgRisk": 54.9
}
```

Reading: the A through V marks all screen legal in the current window, so the
rotation pressure sits on X/Z-era sets; among legal sets, E and V carry the
highest seeded risk scores and R/H the lowest. The per-card risk numbers are
seeded (identical across runs and machines); treat them as a stable ranking
device, not a forecast.
