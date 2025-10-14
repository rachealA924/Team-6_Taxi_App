from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/nyc_taxi_analytics')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Set up models with db instance
import models.trip
import models.zone
models.trip.db = db
models.zone.db = db

# Import routes
from routes.analytics import analytics_bp
from routes.trips import trips_bp

# Register blueprints
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(trips_bp, url_prefix='/api/trips')

@app.route('/')
def index():
    return jsonify({
        'message': 'NYC Taxi Analytics API',
        'version': '1.0.0',
        'endpoints': {
            'analytics': '/api/analytics',
            'trips': '/api/trips'
        }
    })

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
