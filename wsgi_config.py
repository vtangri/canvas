# WSGI Configuration File for PythonAnywhere
# Copy this content into your PythonAnywhere WSGI configuration file
# Location: Web tab -> WSGI configuration file

import sys
import os

# Add your project directory to the path
path = '/home/vanshika7/mysite'
if path not in sys.path:
    sys.path.insert(0, path)

# Change to your project directory
os.chdir(path)

# Import your Flask app
from flask_app import app as application

# Optional: Enable debugging (remove in production for better performance)
# application.debug = True

