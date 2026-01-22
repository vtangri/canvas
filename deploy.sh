#!/usr/bin/env bash
# Simple Deployment Script for PythonAnywhere
# Usage (on PythonAnywhere Bash console):
#   chmod +x deploy.sh            # first time only
#   ./deploy.sh                   # install deps and reload web app

set -euo pipefail

# --- Configuration ---
PA_USER="canvaas"
APP_DIR="/home/canvaas/mysite"
# ---------------------

echo "=========================================="
echo "  Deploying Learning Journal PWA"
echo "  User: ${PA_USER}"
echo "=========================================="
echo ""

# Change to project directory
cd "$APP_DIR" || {
    echo "❌ Error: Cannot access ${APP_DIR}"
    echo "   Make sure the path is correct"
    exit 1
}

echo "[1/3] Installing/updating Python dependencies..."
python3.10 -m pip install --user -r requirements.txt --quiet --upgrade

echo "[2/3] Verifying installation..."
python3.10 -c "import flask; print('✅ Flask:', flask.__version__)" || echo "⚠️  Flask check failed"
python3.10 -c "import flask_cors; print('✅ flask-cors: OK')" 2>/dev/null || echo "⚠️  flask-cors: Not installed (optional)"

echo "[3/3] Reloading web app..."
pa_reload_webapp "${PA_USER}.pythonanywhere.com"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app should be live at: https://${PA_USER}.pythonanywhere.com"
echo ""
