#!/usr/bin/env python3
"""
Setup script for NYC Taxi Analytics Dashboard
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_command(command, description):
    """Run a command and handle errors"""
    logger.info(f"Running: {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        logger.info(f"✓ {description} completed successfully")
        return result
    except subprocess.CalledProcessError as e:
        logger.error(f"✗ {description} failed: {e.stderr}")
        raise

def setup_environment():
    """Set up the development environment"""
    logger.info("Setting up NYC Taxi Analytics Dashboard environment...")
    
    # Create necessary directories
    directories = ['data', 'logs', 'backend/logs']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        logger.info(f"Created directory: {directory}")
    
    # Set up Python virtual environment
    if not Path('venv').exists():
        logger.info("Creating Python virtual environment...")
        run_command('python3 -m venv venv', 'Creating virtual environment')
    
    # Activate virtual environment and install dependencies
    if sys.platform == 'win32':
        activate_cmd = 'venv\\Scripts\\activate'
        pip_cmd = 'venv\\Scripts\\pip'
    else:
        activate_cmd = 'source venv/bin/activate'
        pip_cmd = 'venv/bin/pip'
    
    # Install Python dependencies
    logger.info("Installing Python dependencies...")
    run_command(f'{pip_cmd} install -r backend/requirements.txt', 'Installing Python packages')
    
    # Set up environment variables
    env_content = """# Environment variables for NYC Taxi Analytics Dashboard

# Database Configuration (SQLite for development)
DATABASE_URL=sqlite:///nyc_taxi_analytics.db

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# API Configuration
API_HOST=0.0.0.0
API_PORT=5000

# Data Configuration
DATA_PATH=./data
SAMPLE_DATA_SIZE=10000

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=./logs/app.log
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    logger.info("Created .env file with default configuration")
    
    logger.info("✓ Environment setup completed successfully!")

def setup_database():
    """Set up the database"""
    logger.info("Setting up database...")
    
    # Run database setup
    if sys.platform == 'win32':
        python_cmd = 'venv\\Scripts\\python'
    else:
        python_cmd = 'venv/bin/python'
    
    # Create database schema
    run_command(f'{python_cmd} -c "from backend.app import app, db; app.app_context().push(); db.create_all(); print(\'Database tables created\')"', 
                'Creating database tables')
    
    logger.info("✓ Database setup completed successfully!")

def process_sample_data():
    """Process sample data"""
    logger.info("Processing sample data...")
    
    if sys.platform == 'win32':
        python_cmd = 'venv\\Scripts\\python'
    else:
        python_cmd = 'venv/bin/python'
    
    # Run data processing
    run_command(f'{python_cmd} backend/data_processing/process_data.py', 
                'Processing sample data')
    
    logger.info("✓ Sample data processing completed successfully!")

def process_real_data():
    """Process real NYC taxi dataset"""
    logger.info("Processing real NYC taxi dataset...")
    
    # Check if dataset exists
    data_dir = Path('data/raw')
    if not (data_dir / 'train.zip').exists() and not (data_dir / 'train.csv').exists():
        logger.error("No dataset found! Please place train.zip or train.csv in data/raw/")
        logger.info("You can download the official dataset from:")
        logger.info("https://www.kaggle.com/c/new-york-city-taxi-fare-prediction/data")
        return False
    
    if sys.platform == 'win32':
        python_cmd = 'venv\\Scripts\\python'
    else:
        python_cmd = 'venv/bin/python'
    
    # Run real data processing
    run_command(f'{python_cmd} backend/data_processing/real_data_processor.py', 
                'Processing real NYC taxi dataset')
    
    logger.info("✓ Real data processing completed successfully!")
    return True

def start_application():
    """Start the application"""
    logger.info("Starting NYC Taxi Analytics Dashboard...")
    
    if sys.platform == 'win32':
        python_cmd = 'venv\\Scripts\\python'
    else:
        python_cmd = 'venv/bin/python'
    
    logger.info("Starting Flask backend server...")
    logger.info("Backend will be available at: http://localhost:5000")
    logger.info("Frontend can be opened at: frontend/index.html")
    logger.info("Press Ctrl+C to stop the server")
    
    # Start Flask app
    run_command(f'{python_cmd} backend/app.py', 'Starting Flask application')

def main():
    """Main setup function"""
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'env':
            setup_environment()
        elif command == 'db':
            setup_database()
        elif command == 'data':
            process_sample_data()
        elif command == 'real-data':
            process_real_data()
        elif command == 'start':
            start_application()
        elif command == 'full':
            setup_environment()
            setup_database()
            process_sample_data()
            logger.info("✓ Full setup completed! Run 'python setup.py start' to start the application.")
        elif command == 'full-real':
            setup_environment()
            setup_database()
            if process_real_data():
                logger.info("✓ Full setup with real data completed! Run 'python setup.py start' to start the application.")
            else:
                logger.info("✓ Environment and database setup completed. Please add your dataset and run 'python setup.py real-data'")
        else:
            print("Usage: python setup.py [env|db|data|real-data|start|full|full-real]")
            print("  env      - Set up environment")
            print("  db       - Set up database")
            print("  data     - Process sample data")
            print("  real-data - Process real NYC taxi dataset")
            print("  start    - Start the application")
            print("  full     - Run complete setup with sample data")
            print("  full-real - Run complete setup with real data")
    else:
        print("NYC Taxi Analytics Dashboard Setup")
        print("==================================")
        print("Usage: python setup.py [command]")
        print("")
        print("Commands:")
        print("  env       - Set up Python environment and dependencies")
        print("  db        - Set up database schema")
        print("  data      - Process sample taxi data")
        print("  real-data - Process real NYC taxi dataset (requires train.zip/train.csv)")
        print("  start     - Start the Flask backend server")
        print("  full      - Run complete setup with sample data")
        print("  full-real - Run complete setup with real data")
        print("")
        print("Examples:")
        print("  python setup.py full      # Complete setup with sample data")
        print("  python setup.py full-real # Complete setup with real dataset")
        print("  python setup.py start     # Start the application")
        print("")
        print("For real data:")
        print("  1. Download train.zip from Kaggle NYC Taxi Fare Prediction")
        print("  2. Place it in data/raw/train.zip")
        print("  3. Run: python setup.py full-real")

if __name__ == '__main__':
    main()

