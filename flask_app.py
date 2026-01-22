#!/usr/bin/env python3
"""
flask_app.py - Flask backend for Learning Journal PWA

This Flask application serves the Learning Journal PWA and provides REST API endpoints:
- GET /reflections - Get all journal entries
- POST /add_reflection - Add a new journal entry
- PUT /reflection/<id> - Update an existing journal entry
- DELETE /reflection/<id> - Delete a journal entry

Deploy on PythonAnywhere by:
1. Upload all files to your PythonAnywhere account
2. Set up a web app pointing to flask_app.py
3. Ensure requirements.txt is installed
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
from datetime import datetime
import uuid

# Try to import flask_cors, make it optional
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except ImportError:
    CORS_AVAILABLE = False
    print("Warning: flask-cors not installed. Using fallback CORS headers.")
    print("For best results, install with: python3.13 -m pip install --user flask-cors")

# Initialize Flask app
app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static',
            template_folder='templates')

# Enable CORS if available
if CORS_AVAILABLE:
    CORS(app)  # Enable CORS for all routes
else:
    # Manual CORS headers as fallback
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, 'backend', 'reflections.json')


def load_reflections():
    """Load reflections from JSON file"""
    if not os.path.exists(JSON_FILE):
        return []
    
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
    except json.JSONDecodeError:
        print("Warning: JSON file is corrupted. Returning empty list.")
        return []
    except Exception as e:
        print(f"Error loading reflections: {e}")
        return []


def save_reflections(reflections):
    """Save reflections to JSON file"""
    try:
        # Ensure backend directory exists
        backend_dir = os.path.dirname(JSON_FILE)
        os.makedirs(backend_dir, exist_ok=True)
        
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(reflections, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception as e:
        print(f"Error saving reflections: {e}")
        return False


# ===== HTML ROUTES =====

@app.route('/')
@app.route('/index.html')
def index():
    """Serve the home page"""
    return render_template('index.html')


@app.route('/journal.html')
def journal():
    """Serve the journal page"""
    return render_template('journal.html')


@app.route('/about.html')
def about():
    """Serve the about page"""
    return render_template('about.html')


@app.route('/projects.html')
def projects():
    """Serve the projects page"""
    return render_template('projects.html')


@app.route('/canvas.html')
def canvas():
    """Serve the creative canvas dashboard page"""
    return render_template('canvas.html')


# ===== API ROUTES =====

@app.route('/reflections', methods=['GET'])
def get_reflections():
    """Get all journal reflections"""
    try:
        reflections = load_reflections()
        return jsonify({
            'success': True,
            'reflections': reflections,
            'count': len(reflections)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/add_reflection', methods=['POST'])
def add_reflection():
    """Add a new journal reflection"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['weekOfJournal', 'journalName', 'journalDate', 
                          'taskName', 'taskDescription', 'technologies']
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Validate data types
        if not isinstance(data['weekOfJournal'], int) or data['weekOfJournal'] < 1:
            return jsonify({
                'success': False,
                'error': 'weekOfJournal must be a positive integer'
            }), 400
        
        if not isinstance(data['technologies'], list) or len(data['technologies']) == 0:
            return jsonify({
                'success': False,
                'error': 'technologies must be a non-empty array'
            }), 400
        
        # Validate word count in description
        word_count = len([w for w in data['taskDescription'].split() if w])
        if word_count < 10:
            return jsonify({
                'success': False,
                'error': f'Description must have at least 10 words (has {word_count})'
            }), 400
        
        # Create reflection with ID and timestamp
        reflection = {
            'id': str(uuid.uuid4()),
            'weekOfJournal': data['weekOfJournal'],
            'journalName': data['journalName'],
            'journalDate': data['journalDate'],
            'taskName': data['taskName'],
            'taskDescription': data['taskDescription'],
            'technologies': data['technologies'],
            'timestamp': datetime.now().isoformat()
        }
        
        # Load existing reflections and append
        reflections = load_reflections()
        reflections.append(reflection)
        
        # Save to file
        if save_reflections(reflections):
            return jsonify({
                'success': True,
                'message': 'Reflection added successfully',
                'reflection': reflection,
                'totalReflections': len(reflections)
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save reflection'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/reflection/<reflection_id>', methods=['PUT'])
def update_reflection(reflection_id):
    """Update an existing journal reflection"""
    try:
        data = request.get_json()
        
        # Load existing reflections
        reflections = load_reflections()
        
        # Find the reflection to update
        reflection_index = None
        for i, ref in enumerate(reflections):
            if ref.get('id') == reflection_id:
                reflection_index = i
                break
        
        if reflection_index is None:
            return jsonify({
                'success': False,
                'error': 'Reflection not found'
            }), 404
        
        # Validate required fields if provided
        if 'weekOfJournal' in data:
            if not isinstance(data['weekOfJournal'], int) or data['weekOfJournal'] < 1:
                return jsonify({
                    'success': False,
                    'error': 'weekOfJournal must be a positive integer'
                }), 400
        
        if 'technologies' in data:
            if not isinstance(data['technologies'], list) or len(data['technologies']) == 0:
                return jsonify({
                    'success': False,
                    'error': 'technologies must be a non-empty array'
                }), 400
        
        if 'taskDescription' in data:
            word_count = len([w for w in data['taskDescription'].split() if w])
            if word_count < 10:
                return jsonify({
                    'success': False,
                    'error': f'Description must have at least 10 words (has {word_count})'
                }), 400
        
        # Update the reflection (preserve ID and timestamp, update others)
        old_reflection = reflections[reflection_index]
        updated_reflection = {
            'id': old_reflection['id'],
            'weekOfJournal': data.get('weekOfJournal', old_reflection.get('weekOfJournal')),
            'journalName': data.get('journalName', old_reflection.get('journalName')),
            'journalDate': data.get('journalDate', old_reflection.get('journalDate')),
            'taskName': data.get('taskName', old_reflection.get('taskName')),
            'taskDescription': data.get('taskDescription', old_reflection.get('taskDescription')),
            'technologies': data.get('technologies', old_reflection.get('technologies')),
            'timestamp': old_reflection.get('timestamp', datetime.now().isoformat()),
            'updatedAt': datetime.now().isoformat()
        }
        
        reflections[reflection_index] = updated_reflection
        
        # Save to file
        if save_reflections(reflections):
            return jsonify({
                'success': True,
                'message': 'Reflection updated successfully',
                'reflection': updated_reflection
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update reflection'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/reflection/<reflection_id>', methods=['DELETE'])
def delete_reflection(reflection_id):
    """Delete a journal reflection"""
    try:
        reflections = load_reflections()
        original_count = len(reflections)
        
        # Filter out the reflection with matching ID
        reflections = [r for r in reflections if r.get('id') != reflection_id]
        
        if len(reflections) == original_count:
            return jsonify({
                'success': False,
                'error': 'Reflection not found'
            }), 404
        
        # Save updated reflections
        if save_reflections(reflections):
            return jsonify({
                'success': True,
                'message': 'Reflection deleted successfully',
                'totalReflections': len(reflections)
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete reflection'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ===== STATIC FILE ROUTES =====

@app.route('/manifest.json')
def manifest():
    """Serve the PWA manifest file"""
    return send_from_directory('static', 'manifest.json')


@app.route('/offline.html')
def offline():
    """Serve offline fallback page for the PWA"""
    return send_from_directory('static', 'offline.html')


@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files"""
    return send_from_directory('static/js', filename)


@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    return send_from_directory('static/css', filename)


@app.route('/img/<path:filename>')
def serve_img(filename):
    """Serve image files"""
    return send_from_directory('static/img', filename)


@app.route('/sw.js')
def serve_sw():
    """Serve service worker with proper headers to allow root scope"""
    response = send_from_directory('static/js', 'sw.js')
    # Set Service-Worker-Allowed header to allow root scope
    response.headers['Service-Worker-Allowed'] = '/'
    response.headers['Content-Type'] = 'application/javascript'
    return response


# ===== ERROR HANDLERS =====

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Resource not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    # For local development
    app.run(debug=True, host='0.0.0.0', port=5000)
else:
    # For PythonAnywhere deployment
    # The application object will be imported by the WSGI server
    pass

