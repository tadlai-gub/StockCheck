#!/bin/bash
# Move to the workspace directory
cd "/Users/tadlai/.gemini/antigravity/scratch"

echo "🔄 正在更新股票數據..."
./venv/bin/python stock-dashboard/update_data.py

echo "🚀 正在啟動儀表板網站..."
cd stock-dashboard
npm run dev -- --open
