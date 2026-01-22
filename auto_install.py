#!/usr/bin/env python3
"""
Auto-installation script for PythonAnywhere
Run this script to automatically install all required dependencies
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ {description} - Success")
        if result.stdout:
            print(f"   {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed")
        if e.stderr:
            print(f"   Error: {e.stderr.strip()}")
        return False

def detect_python_version():
    """Detect available Python version"""
    versions = ['python3.10', 'python3.9', 'python3']
    for version in versions:
        try:
            result = subprocess.run(
                [version, '--version'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print(f"✅ Found {version}: {result.stdout.strip()}")
                return version
        except FileNotFoundError:
            continue
    return None

def main():
    print("=" * 50)
    print("  Learning Journal PWA - Auto Installer")
    print("=" * 50)
    print()
    
    # Change to project directory
    project_dir = os.path.expanduser('~/mysite')
    if not os.path.exists(project_dir):
        print(f"❌ Error: Project directory not found: {project_dir}")
        print("Please make sure you've uploaded files to ~/mysite")
        sys.exit(1)
    
    os.chdir(project_dir)
    print(f"✅ Working directory: {project_dir}")
    print()
    
    # Detect Python version
    python_cmd = detect_python_version()
    if not python_cmd:
        print("❌ Error: Python 3 not found")
        sys.exit(1)
    
    pip_cmd = python_cmd.replace('python', 'pip')
    print()
    
    # Check if requirements.txt exists
    if os.path.exists('requirements.txt'):
        print("✅ Found requirements.txt")
        print("Installing from requirements.txt...")
        print()
        
        # Install from requirements.txt
        if not run_command(
            f"{pip_cmd} install --user -r requirements.txt",
            "Installing dependencies from requirements.txt"
        ):
            print()
            print("⚠️  Installation from requirements.txt failed")
            print("Trying to install packages individually...")
            print()
            run_command(
                f"{pip_cmd} install --user Flask==3.0.0",
                "Installing Flask"
            )
            run_command(
                f"{pip_cmd} install --user flask-cors==4.0.0",
                "Installing flask-cors"
            )
    else:
        print("⚠️  requirements.txt not found")
        print("Installing packages individually...")
        print()
        run_command(
            f"{pip_cmd} install --user Flask==3.0.0",
            "Installing Flask"
        )
        run_command(
            f"{pip_cmd} install --user flask-cors==4.0.0",
            "Installing flask-cors"
        )
    
    print()
    print("Verifying installation...")
    print()
    
    # Verify Flask
    if run_command(
        f"{python_cmd} -c 'import flask; print(f\"Flask {flask.__version__}\")'",
        "Verifying Flask"
    ):
        # Verify flask-cors
        if run_command(
            f"{python_cmd} -c 'import flask_cors; print(\"flask-cors OK\")'",
            "Verifying flask-cors"
        ):
            print()
            print("=" * 50)
            print("  ✅ Installation Complete!")
            print("=" * 50)
            print()
            print("Next steps:")
            print("1. Go to Web tab in PythonAnywhere")
            print("2. Click the green 'Reload' button")
            print("3. Wait 10-15 seconds")
            print("4. Visit: https://canvaas.pythonanywhere.com")
            print()
        else:
            print()
            print("❌ flask-cors verification failed")
            print("Try running: pip3.10 install --user flask-cors")
            sys.exit(1)
    else:
        print()
        print("❌ Flask verification failed")
        print("Try running: pip3.10 install --user Flask")
        sys.exit(1)

if __name__ == '__main__':
    main()

