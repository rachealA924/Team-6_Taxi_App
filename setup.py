#!/usr/bin/env python3
"""
NYC Taxi Analytics Dashboard Setup Script
Sets up the development environment and processes sample data
"""

import os
import sys
import subprocess
import sqlite3
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def setup_environment():
    """Set up Python virtual environment"""
    print("🐍 Setting up Python virtual environment...")
    
    if not os.path.exists('venv'):
        if not run_command('python3 -m venv venv', 'Creating virtual environment'):
            return False
    else:
        print("✅ Virtual environment already exists")
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        activate_cmd = 'venv\\Scripts\\activate && pip install -r backend/requirements.txt'
    else:  # Unix/Linux/MacOS
        activate_cmd = 'source venv/bin/activate && pip install -r backend/requirements.txt'
    
    return run_command(activate_cmd, 'Installing Python dependencies')

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    directories = [
        'data/raw',
        'data/processed',
        'backend/logs'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def setup_database():
    """Set up the database with sample data"""
    print("📊 Setting up database...")
    
    # Create database directory if it doesn't exist
    os.makedirs('backend', exist_ok=True)
    
    # Create database file
    db_path = 'backend/taxi_data.db'
    if os.path.exists(db_path):
        print("✅ Database already exists")
        return True
    
    # Create database and tables
    conn = sqlite3.connect(db_path)
    
    # Read and execute schema
    with open('database/schema.sql', 'r') as f:
        schema = f.read()
    
    conn.executescript(schema)
    conn.close()
    
    print("✅ Database created successfully")
    return True

def load_sample_data():
    """Load sample data into the database"""
    print("📊 Loading sample data...")
    
    # Import Flask app to load sample data
    try:
        sys.path.append('backend')
        from app import app, db, Trip
        
        with app.app_context():
            # Check if data already exists
            if Trip.query.count() > 0:
                print("✅ Sample data already loaded")
                return True
            
            # Create sample data
            sample_trips = [
                {
                    'pickup_datetime': '2024-01-15 08:30:00',
                    'dropoff_datetime': '2024-01-15 09:15:00',
                    'passenger_count': 2,
                    'trip_distance': 4.2,
                    'trip_duration': 2700,  # 45 minutes
                    'fare_amount': 18.50,
                    'tip_amount': 3.70,
                    'tolls_amount': 0.0,
                    'total_amount': 22.20,
                    'payment_type': 1,  # Credit card
                    'pickup_longitude': -73.9851,
                    'pickup_latitude': 40.7589,
                    'dropoff_longitude': -73.9776,
                    'dropoff_latitude': 40.7614,
                    'trip_speed_mph': 9.3,
                    'fare_per_mile': 4.40,
                    'idle_time_minutes': 15.0
                },
                {
                    'pickup_datetime': '2024-01-15 12:45:00',
                    'dropoff_datetime': '2024-01-15 13:05:00',
                    'passenger_count': 1,
                    'trip_distance': 1.8,
                    'trip_duration': 1200,  # 20 minutes
                    'fare_amount': 8.25,
                    'tip_amount': 1.65,
                    'tolls_amount': 0.0,
                    'total_amount': 9.90,
                    'payment_type': 2,  # Cash
                    'pickup_longitude': -74.0060,
                    'pickup_latitude': 40.7128,
                    'dropoff_longitude': -74.0776,
                    'dropoff_latitude': 40.7282,
                    'trip_speed_mph': 5.4,
                    'fare_per_mile': 4.58,
                    'idle_time_minutes': 8.0
                }
            ]
            
            for trip_data in sample_trips:
                trip = Trip(**trip_data)
                db.session.add(trip)
            
            db.session.commit()
            print(f"✅ Loaded {len(sample_trips)} sample trips")
            
    except Exception as e:
        print(f"❌ Failed to load sample data: {e}")
        return False
    
    return True

def main():
    """Main setup function"""
    print("🚕 NYC Taxi Analytics Dashboard Setup")
    print("=====================================")
    
    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Set up environment
    if not setup_environment():
        print("❌ Environment setup failed")
        sys.exit(1)
    
    # Set up database
    if not setup_database():
        print("❌ Database setup failed")
        sys.exit(1)
    
    # Load sample data
    if not load_sample_data():
        print("❌ Sample data loading failed")
        sys.exit(1)
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next Steps:")
    print("1. Activate virtual environment:")
    if os.name == 'nt':  # Windows
        print("   venv\\Scripts\\activate")
    else:  # Unix/Linux/MacOS
        print("   source venv/bin/activate")
    print("\n2. Start the Flask server:")
    print("   cd backend && python app.py")
    print("\n3. Open your browser to:")
    print("   http://localhost:5000")
    print("\n📊 Your dashboard is ready!")

if __name__ == '__main__':
    main()
