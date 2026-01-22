#!/bin/bash
# Auto-installation script for PythonAnywhere
# Run this script in PythonAnywhere Bash console to install all dependencies

echo "=========================================="
echo "  Learning Journal PWA - Dependency Installer"
echo "=========================================="
echo ""

# Navigate to project directory
cd ~/mysite || {
    echo "❌ Error: Could not find ~/mysite directory"
    echo "Please make sure you're in the correct location"
    exit 1
}

echo "✅ Found project directory: ~/mysite"
echo ""

# Detect Python version
if command -v python3.10 &> /dev/null; then
    PYTHON_CMD="python3.10"
    PIP_CMD="pip3.10"
    echo "✅ Using Python 3.10"
elif command -v python3.9 &> /dev/null; then
    PYTHON_CMD="python3.9"
    PIP_CMD="pip3.9"
    echo "✅ Using Python 3.9"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
    echo "✅ Using Python 3 (generic)"
else
    echo "❌ Error: Python 3 not found"
    exit 1
fi

echo ""
echo "Installing dependencies..."
echo ""

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found"
    echo "Installing packages individually..."
    $PIP_CMD install --user Flask==3.0.0 flask-cors==4.0.0
else
    echo "✅ Found requirements.txt"
    echo "Installing from requirements.txt..."
    $PIP_CMD install --user -r requirements.txt
fi

echo ""
echo "Verifying installation..."
echo ""

# Verify Flask installation
if $PYTHON_CMD -c "import flask" 2>/dev/null; then
    FLASK_VERSION=$($PYTHON_CMD -c "import flask; print(flask.__version__)" 2>/dev/null)
    echo "✅ Flask installed (version: $FLASK_VERSION)"
else
    echo "❌ Flask installation failed"
    exit 1
fi

# Verify flask-cors installation
if $PYTHON_CMD -c "import flask_cors" 2>/dev/null; then
    echo "✅ flask-cors installed"
else
    echo "❌ flask-cors installation failed"
    echo "Attempting to install flask-cors individually..."
    $PIP_CMD install --user flask-cors==4.0.0
    if $PYTHON_CMD -c "import flask_cors" 2>/dev/null; then
        echo "✅ flask-cors installed successfully"
    else
        echo "❌ flask-cors installation still failed"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "  Installation Complete! ✅"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to Web tab in PythonAnywhere"
echo "2. Click the green 'Reload' button"
echo "3. Wait 10-15 seconds"
echo "4. Visit: https://canvaas.pythonanywhere.com"
echo ""
echo "If you still see errors:"
echo "- Check that your Web app uses Python 3.10"
echo "- Verify WSGI file configuration"
echo "- Check error logs in Web tab"
echo ""

