#!/usr/bin/env python3
"""
api.py - Simple HTTP API server for Learning Journal PWA

This server provides REST API endpoints for the journal application:
- POST /api/save-entry - Save a new journal entry
- GET /api/entries - Get all journal entries
- DELETE /api/entry/<id> - Delete a specific entry

Run with: python3 api.py
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from datetime import datetime
import uuid
from urllib.parse import urlparse, parse_qs

# Configuration
PORT = 8000
JSON_FILE = os.path.join(os.path.dirname(__file__), 'reflections.json')


def load_entries():
    """Load entries from reflections.json"""
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
        print(f"Error loading entries: {e}")
        return []


def save_entries(entries):
    """Save entries to reflections.json"""
    try:
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving entries: {e}")
        return False


class JournalAPIHandler(BaseHTTPRequestHandler):
    """HTTP request handler for journal API"""
    
    def _set_headers(self, status=200, content_type='application/json'):
        """Set response headers with CORS support"""
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def _send_json(self, data, status=200):
        """Send JSON response"""
        self._set_headers(status)
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def _send_error_json(self, message, status=400):
        """Send error response"""
        self._send_json({'error': message, 'success': False}, status)
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self._set_headers(204)
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/entries':
            # Get all entries
            entries = load_entries()
            self._send_json({
                'success': True,
                'entries': entries,
                'count': len(entries)
            })
        else:
            self._send_error_json('Endpoint not found', 404)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/save-entry':
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            try:
                data = json.loads(body.decode('utf-8'))
            except json.JSONDecodeError:
                self._send_error_json('Invalid JSON')
                return
            
            # Validate required fields
            required_fields = ['weekOfJournal', 'journalName', 'journalDate', 
                             'taskName', 'taskDescription', 'technologies']
            
            for field in required_fields:
                if field not in data:
                    self._send_error_json(f'Missing required field: {field}')
                    return
            
            # Validate data types
            if not isinstance(data['weekOfJournal'], int) or data['weekOfJournal'] < 1:
                self._send_error_json('weekOfJournal must be a positive integer')
                return
            
            if not isinstance(data['technologies'], list) or len(data['technologies']) == 0:
                self._send_error_json('technologies must be a non-empty array')
                return
            
            # Validate word count in description
            word_count = len([w for w in data['taskDescription'].split() if w])
            if word_count < 10:
                self._send_error_json(f'Description must have at least 10 words (has {word_count})')
                return
            
            # Create entry with ID and timestamp
            entry = {
                'id': str(uuid.uuid4()),
                'weekOfJournal': data['weekOfJournal'],
                'journalName': data['journalName'],
                'journalDate': data['journalDate'],
                'taskName': data['taskName'],
                'taskDescription': data['taskDescription'],
                'technologies': data['technologies'],
                'timestamp': datetime.now().isoformat()
            }
            
            # Load existing entries and append
            entries = load_entries()
            entries.append(entry)
            
            # Save to file
            if save_entries(entries):
                self._send_json({
                    'success': True,
                    'message': 'Entry saved successfully',
                    'entry': entry,
                    'totalEntries': len(entries)
                }, 201)
            else:
                self._send_error_json('Failed to save entry', 500)
        else:
            self._send_error_json('Endpoint not found', 404)
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        parsed_path = urlparse(self.path)
        
        # Extract entry ID from path like /api/entry/123
        if parsed_path.path.startswith('/api/entry/'):
            entry_id = parsed_path.path.split('/')[-1]
            
            entries = load_entries()
            original_count = len(entries)
            
            # Filter out the entry with matching ID
            entries = [e for e in entries if e.get('id') != entry_id]
            
            if len(entries) == original_count:
                self._send_error_json('Entry not found', 404)
                return
            
            # Save updated entries
            if save_entries(entries):
                self._send_json({
                    'success': True,
                    'message': 'Entry deleted successfully',
                    'totalEntries': len(entries)
                })
            else:
                self._send_error_json('Failed to delete entry', 500)
        else:
            self._send_error_json('Endpoint not found', 404)
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")


def run_server(port=PORT):
    """Start the HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, JournalAPIHandler)
    
    print("=" * 60)
    print("  LEARNING JOURNAL API SERVER")
    print("=" * 60)
    print(f"Server running on http://localhost:{port}")
    print(f"JSON file: {JSON_FILE}")
    print("\nAvailable endpoints:")
    print(f"  GET    http://localhost:{port}/api/entries")
    print(f"  POST   http://localhost:{port}/api/save-entry")
    print(f"  DELETE http://localhost:{port}/api/entry/<id>")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 60)
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
