# Dish Management — Full Stack

```
dish-management/
├── dish-management-backend/    ← Phase 1: Node.js + Express + MongoDB
└── dish-management-frontend/   ← Phase 2: React 18 + Vite + TypeScript
```

---

## Quick Start (run both together)

### Terminal 1 — Backend
```bash
cd dish-management-backend
npm install
npm run seed        # populate MongoDB Atlas with 10 dishes
npm run dev         # start on http://localhost:5000
```

### Terminal 2 — Frontend
```bash
cd dish-management-frontend
npm install
npm run dev         # start on http://localhost:3000
```

### Terminal 3 — Real-Time Demo
```bash
cd dish-management-backend
npm run simulate    # bypass API, write directly to MongoDB
                    # watch the dashboard update in real-time
```

---

## Architecture

```
Browser (React)
   │  GET /api/dishes         → REST initial fetch
   │  PATCH /api/dishes/:id/toggle → Optimistic toggle
   │  GET /api/stream         → SSE persistent connection
   └──────────────────────────────────────────────────

Backend (Express)
   │  REST routes → controllers → dish.service.js
   │  SSE pool (ssePool.js) → heartbeat, broadcast
   └──────────────────────────────────────────────────

MongoDB Atlas (Change Streams)
   │  realtime.service.js watches oplog
   │  ANY write (API, Compass, simulate.js) fires SSE broadcast
   └──────────────────────────────────────────────────
```

## Design System (from Stitch MCP)
- **Palette:** Deep Slate `#111319` · Amber `#F59E0B` · Emerald `#10B981` · Zinc `#6B7280`
- **Fonts:** Inter (UI) + JetBrains Mono (operational data/badges)
- **Signature:** Live Order Rail — scrolling kitchen ticket strip at top of dashboard
