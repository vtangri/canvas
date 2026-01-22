# 📔 Learning Journal PWA

> A modern Progressive Web App for documenting your learning journey with a creative canvas, built with Flask and vanilla JavaScript.

![Learning Journal PWA](https://img.shields.io/badge/PWA-Ready-6366f1?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)

---

## ✨ Features

### 🏠 **Core Application**

- **Learning Journal** – Create, read, update, and delete journal entries with rich metadata
- **Projects Showcase** – Display and manage your portfolio of projects
- **About Page** – Personal profile with stats and social links
- **Dark/Light Theme** – Toggle between themes with persistent preference storage

### 🎨 **Creative Canvas Dashboard**

A fully featured drawing interface for visual reflections:

- **Drawing Tools** – Brush, line, rectangle, circle, and eraser
- **Color Picker** – Full color palette with opacity control
- **History Management** – Undo/Redo functionality
- **Image Filters** – Grayscale, sepia, blur, and brightness adjustments
- **Export Options** – Save drawings as PNG images

### 📱 **Progressive Web App (PWA)**

- **Installable** – Add to home screen on mobile devices and desktop
- **Offline Support** – Service Worker caches key resources for offline access
- **Native-like Experience** – Standalone display mode with custom theme color

### 🔗 **REST API Backend**

Full CRUD API for journal reflections:
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reflections` | Retrieve all journal entries |
| `POST` | `/add_reflection` | Create a new entry |
| `PUT` | `/reflection/<id>` | Update an existing entry |
| `DELETE` | `/reflection/<id>` | Delete an entry |

---

## 🗂️ Project Structure

```
Vanshika Project/
├── flask_app.py              # Main Flask application (routes + API)
├── wsgi_config.py            # WSGI configuration for deployment
├── requirements.txt          # Python dependencies
│
├── templates/                # Jinja2 HTML templates
│   ├── index.html            # Home page
│   ├── journal.html          # Journal entries page
│   ├── projects.html         # Projects showcase
│   ├── about.html            # About/profile page
│   └── canvas.html           # Creative canvas dashboard
│
├── static/
│   ├── css/
│   │   ├── styles.css        # Main stylesheet (51KB)
│   │   └── canvas.css        # Canvas-specific styles
│   │
│   ├── js/
│   │   ├── script.js         # Main application logic
│   │   ├── journal.js        # Journal CRUD operations
│   │   ├── storage.js        # LocalStorage abstraction
│   │   ├── browser.js        # Browser feature detection
│   │   ├── thirdparty.js     # Third-party integrations
│   │   ├── sw.js             # Service Worker for PWA
│   │   ├── canvas.js         # Canvas main controller
│   │   ├── canvas-tools.js   # Drawing tools implementation
│   │   ├── canvas-drawing.js # Drawing logic
│   │   ├── canvas-color.js   # Color picker functionality
│   │   ├── canvas-filters.js # Image filter effects
│   │   ├── canvas-history.js # Undo/Redo management
│   │   ├── canvas-storage.js # Canvas save/load
│   │   ├── canvas-toolbar.js # Toolbar UI
│   │   ├── canvas-greeting.js # Greeting messages
│   │   └── about.js          # About page logic
│   │
│   ├── img/                  # Images and icons
│   ├── manifest.json         # PWA manifest
│   └── offline.html          # Offline fallback page
│
├── backend/
│   ├── reflections.json      # JSON database for entries
│   ├── api.py                # Alternative API module
│   └── save_entry.py         # Entry saving utilities
│
├── deploy.sh                 # PythonAnywhere deployment script
├── auto_install.py           # Automated dependency installer
├── install_dependencies.sh   # Shell script for dependencies
└── ASSIGNMENT_ANSWERS.md     # Project documentation/answers
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher (3.13 recommended)
- pip (Python package manager)

### Installation

1. **Clone/Download the repository**

   ```bash
   cd "Vanshika Project"
   ```

2. **Create a virtual environment** (recommended)

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

   Or use the automated installer:

   ```bash
   python auto_install.py
   ```

4. **Run the application**

   ```bash
   python flask_app.py
   ```

5. **Open in browser**
   Navigate to [http://localhost:5000](http://localhost:5000)

---

## 🌐 Deployment (PythonAnywhere)

This project is designed for easy deployment on PythonAnywhere:

1. Upload all project files to your PythonAnywhere account
2. Run the deployment script:
   ```bash
   bash deploy.sh
   ```
3. Configure your web app to point to `flask_app.py`
4. Set the WSGI configuration file to use `wsgi_config.py`

For detailed deployment instructions, see `INSTALL_FOR_PYTHON313.txt`.

---

## 💡 Technical Highlights

### Cross-Origin Resource Sharing (CORS)

The Flask app includes robust CORS handling with a fallback mechanism:

```python
try:
    from flask_cors import CORS
    CORS(app)
except ImportError:
    # Manual fallback CORS headers
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        # ... more headers
```

### Dynamic Path Resolution

Uses `os.path` for cross-platform compatibility:

```python
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, 'backend', 'reflections.json')
```

### Service Worker Caching

Implements offline-first strategy for core assets:

- HTML pages
- CSS stylesheets
- JavaScript files
- Static images

---

## 📊 Data Model

### Reflection/Journal Entry

```json
{
  "id": "uuid-string",
  "weekOfJournal": 1,
  "journalName": "Week 1 - Getting Started",
  "journalDate": "2025-01-23",
  "taskName": "Setting Up Development Environment",
  "taskDescription": "Detailed description of what was learned...",
  "technologies": ["Python", "Flask", "JavaScript"],
  "timestamp": "2025-01-23T01:30:00.000Z",
  "updatedAt": "2025-01-23T02:00:00.000Z"
}
```

---

## 🎯 Future Improvements

- [ ] SQLite/PostgreSQL database integration
- [ ] User authentication with Flask-Login
- [ ] Cloud storage for canvas drawings
- [ ] Enhanced search and filtering
- [ ] Export journal as PDF

---

## 📚 Technologies Used

| Category     | Technologies                            |
| ------------ | --------------------------------------- |
| **Backend**  | Python, Flask, Flask-CORS               |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript         |
| **PWA**      | Service Workers, Web Manifest           |
| **Canvas**   | HTML5 Canvas API                        |
| **Storage**  | JSON file + localStorage                |
| **Styling**  | CSS Variables, Glassmorphism, Dark Mode |

---

## 👩‍💻 Author

**Vanshika Tangri**  
Web Developer & Lifelong Learner

- 🔗 [GitHub](https://github.com/vtangri)
- 💼 [LinkedIn](https://www.linkedin.com/in/vanshika-tangri-47ab07303/)

---

## 📄 License

This project is created as part of a learning assignment. Feel free to use it as a reference for your own projects.

---

<p align="center">
  Built with ❤️ by Vanshika Tangri | © 2025 LearnJournal
</p>
