#!/bin/bash

set -e  # STOP on any error

echo "======================================"
echo "🚀 PRODUCTION DEPLOYMENT STARTED (BACKEND)"
echo "======================================"

APP_DIR="/root/Hotel-Management-Backend"
APP_NAME="hotel-backend"
PORT=2050
BRANCH="main"

cd "$APP_DIR"

echo "📌 Ensuring $BRANCH branch"
git checkout "$BRANCH"

echo "📥 Fetching latest code"
git fetch origin
git reset --hard "origin/$BRANCH"

echo "📦 Installing dependencies (npm or pnpm)"
if command -v pnpm >/dev/null 2>&1; then
  pnpm install --no-frozen-lockfile
else
  npm install
fi

echo "🏗 Building (if build script exists)"
if npm run | grep -q " build"; then
  npm run build
fi

echo "♻ Restarting app with PM2 on port $PORT"
NODE_ENV=development PORT=$PORT pm2 restart "$APP_NAME" --update-env || \
NODE_ENV=development PORT=$PORT pm2 start npm --name "$APP_NAME" -- start

echo "💾 Saving PM2 state"
pm2 save

echo "======================================"
echo "✅ BACKEND DEPLOYMENT COMPLETED (PORT $PORT)"
echo "======================================"