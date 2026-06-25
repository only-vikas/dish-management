
# 🍽️ Euphotic LAb Kitchen: Real-Time Menu Management
<img width="1917" height="950" alt="Home p age1" src="https://github.com/user-attachments/assets/603d8756-5bc2-4b01-8e62-81d5d1182e42" />
<img width="1917" height="965" alt="Home_page2" src="https://github.com/user-attachments/assets/633ff30e-4d34-48e5-b1ec-60a34c9f366b" />
<img width="1872" height="923" alt="workSpace settings" src="https://github.com/user-attachments/assets/5cec15aa-33e0-4ee7-a20b-6d7278d09327" />
<img width="1917" height="955" alt="Support and System Health" src="https://github.com/user-attachments/assets/25de6890-5bfe-48c5-a807-6b121636e956" />




![React](https://img.shields.io/badge/React-18-blue.svg) ![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg) ![MongoDB](https://img.shields.io/badge/MongoDB-Change_Streams-47A248.svg) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-Layouts-black.svg)

A commercial-grade full-stack dashboard built to manage restaurant menu items. This project goes beyond basic CRUD operations by implementing **Optimistic UI mutations** on the frontend and **native MongoDB Change Streams** on the backend to achieve flawless, zero-latency real-time synchronization.

## ✨ Architectural Highlights & Features

* ⚡ **The Real-Time Bonus (SSE + Change Streams):** Solves the bonus requirement natively. Instead of relying on API-level WebSockets, the backend uses a native MongoDB Change Stream. If a dish is modified *directly* in the database, the stream catches it and pipes the update to the frontend via a Server-Sent Events (SSE) pool with an automatic 25s heartbeat.
* 🚀 **Optimistic UI Updates:** Toggling a dish instantly mutates the React state and triggers Framer Motion layout transitions before the network request resolves. If the API fails, the custom hook gracefully rolls back the UI state.
* 🛡️ **Atomic Operations:** Backend toggles utilize single-step MongoDB aggregation pipelines (`$not: "$isPublished"`) to entirely eliminate race conditions.
* 🎨 **Fluid Micro-Interactions:** Fully animated grid-to-list transitions and layout sorting powered by Framer Motion. 
* 🩺 **System Diagnostics:** Includes a live health-check API (`/api/health`) that monitors database connectivity, active SSE clients, and change stream status.

---

## 💻 Tech Stack

**Frontend:**
* React 18 (Vite) + TypeScript
* Tailwind CSS (Styling)
* Framer Motion (Fluid layout animations)
* Sonner (Premium toast notifications)

**Backend:**
* Node.js + Express.js
* MongoDB + Mongoose
* Zod (Strict schema validation)
* Pino (Structured JSON logging)

---

## 📂 Key High-Value Files

If you are reviewing the codebase, these four files represent the core engineering logic:

1. `src/services/realtime.service.js` — The MongoDB Change Stream engine (`updateLookup`).
2. `src/utils/ssePool.js` — The custom Server-Sent Events manager.
3. `src/hooks/useDishes.ts` — The frontend Optimistic UI and state rollback logic.
4. `scripts/simulate-change.js` — The standalone script proving the backend detects direct database alterations.

---

## 🚀 Quick Start Guide

### 1. Environment Setup
Create a `.env` file in the root of your backend directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<your-username>:<your-password>@cluster.mongodb.net/DishDashboard?retryWrites=true&w=majority

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
