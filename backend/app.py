from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "taxi_data.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Import models after db is initialized
from models import trip, zone

# Set db instance in models to avoid circular import
trip.db = db
zone.db = db

# Import routes
from routes.analytics import analytics_bp
from routes.trips import trips_bp

# Import models for routes
from models.trip import Trip
from models.zone import Zone

# Register blueprints
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(trips_bp, url_prefix='/api')

@app.route('/')
def serve_frontend():
    """Serve the main HTML file"""
    return app.send_static_file('../index.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'database': 'connected'
    })

if __name__ == '__main__':
    with app.app_context():
        # Create tables
        db.create_all()
        print("Database tables created successfully!")
    
    print("Starting Flask development server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
