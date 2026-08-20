#!/bin/bash
# =============================================================================
# VidyutChain Phase 1 — Unified Services Orchestration Script
# =============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚀 Starting VidyutChain Phase 1 Platform from: $PROJECT_DIR"

# 1. MongoDB check
echo "👉 1/5 Checking MongoDB..."
if ! mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "Starting MongoDB Community service..."
    brew services start mongodb/brew/mongodb-community
    sleep 2
fi
echo "   ✅ MongoDB running on mongodb://127.0.0.1:27017"

# 2. Start Blockchain EVM Node
echo "👉 2/5 Starting Hardhat Local EVM Chain..."
cd "$PROJECT_DIR/blockchain"
npx hardhat node > "$PROJECT_DIR/hardhat.log" 2>&1 &
HARDHAT_PID=$!
sleep 2

# Deploy contract if needed
echo "   Deploying EnergyAudit.sol..."
npx hardhat run scripts/deploy.mjs --network localhost

# 3. Start AI Service (FastAPI)
echo "👉 3/5 Starting FastAPI AI Service..."
cd "$PROJECT_DIR/ai"
source "$PROJECT_DIR/.venv/bin/activate"
uvicorn main:app --host 127.0.0.1 --port 8000 > "$PROJECT_DIR/ai.log" 2>&1 &
AI_PID=$!
sleep 2

# 4. Start Platform Backend (Express)
echo "👉 4/5 Starting Node.js / Express Backend..."
cd "$PROJECT_DIR/backend"
npm run dev > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2

# 5. Start Web Dashboard (Vite)
echo "👉 5/5 Starting React Web Dashboard..."
cd "$PROJECT_DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 2

echo ""
echo "================================================================="
echo "⚡ VIDYUTCHAIN PHASE 1 MVP IS FULLY OPERATIONAL ⚡"
echo "================================================================="
echo "🌐 Web Dashboard:    http://localhost:5173"
echo "⚙️ Platform Backend: http://localhost:4000/health"
echo "🧠 AI Service:       http://localhost:8000/health"
echo "⛓️ Hardhat RPC:       http://localhost:8545"
echo ""
echo "🔑 Demo Credentials: admin@vidyutchain.io / AdminDemoPassword123!"
echo ""
echo "To stream live simulator data, run in a separate tab:"
echo "   cd $PROJECT_DIR && npm run demo:seed"
echo "================================================================="

trap "echo 'Shutting down services...'; kill $HARDHAT_PID $AI_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
