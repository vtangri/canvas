#!/bin/bash
# Quick fix script for flask-cors installation
# Run this in PythonAnywhere Bash console

echo "Installing flask-cors..."
echo ""

cd ~/mysite

# Try different Python versions
for py in python3.10 python3.9 python3; do
    if command -v $py &> /dev/null; then
        pip_cmd="${py/python/pip}"
        echo "Trying $py..."
        if $pip_cmd install --user flask-cors 2>&1 | grep -q "Successfully installed"; then
            echo "✅ flask-cors installed successfully with $py!"
            $py -c "import flask_cors; print('✅ Verification: flask-cors works!')"
            echo ""
            echo "Now:"
            echo "1. Go to Web tab"
            echo "2. Click Reload button"
            echo "3. Wait 10 seconds"
            echo "4. Visit: https://canvaas.pythonanywhere.com"
            exit 0
        fi
    fi
done

echo "❌ Installation failed. Try manually:"
echo "pip3.10 install --user flask-cors"

