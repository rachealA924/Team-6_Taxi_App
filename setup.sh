#!/bin/bash

# NYC Taxi Analytics Dashboard Setup Script
# This script automates the complete setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🚕 NYC Taxi Analytics Dashboard Setup"
echo "======================================"
echo ""

# Check if Python is installed
print_status "Checking Python installation..."
if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3.7+ and try again."
    print_status "Visit: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
print_success "Python 3 found: $PYTHON_VERSION"

# Check Python version (3.7+)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 7 ]); then
    print_error "Python 3.7+ is required. Found: $PYTHON_VERSION"
    exit 1
fi

# Check if pip is available
print_status "Checking pip installation..."
if ! command_exists pip3; then
    print_error "pip3 is not installed. Please install pip and try again."
    exit 1
fi
print_success "pip3 found"

# Create virtual environment
print_status "Creating virtual environment..."
if [ -d "venv" ]; then
    print_warning "Virtual environment already exists. Removing old one..."
    rm -rf venv
fi

python3 -m venv venv
print_success "Virtual environment created"

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate
print_success "Virtual environment activated"

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
print_success "pip upgraded"

# Install dependencies
print_status "Installing Python dependencies..."
if [ ! -f "backend/requirements.txt" ]; then
    print_error "requirements.txt not found in backend directory"
    exit 1
fi

pip install -r backend/requirements.txt > /dev/null 2>&1
print_success "Dependencies installed"

# Create necessary directories
print_status "Creating project directories..."
mkdir -p backend/data
mkdir -p data/raw
mkdir -p logs
print_success "Directories created"

# Check if Node.js is available for npm install
if command_exists npm; then
    print_status "Installing Node.js dependencies..."
    if [ -f "package.json" ]; then
        npm install > /dev/null 2>&1
        print_success "Node.js dependencies installed"
    else
        print_warning "package.json not found, skipping Node.js dependencies"
    fi
else
    print_warning "npm not found, skipping Node.js dependencies"
fi

# Initialize database
print_status "Initializing database..."
cd backend

# Check if database file exists and remove it for fresh start
if [ -f "taxi_data.db" ]; then
    print_warning "Existing database found. Removing for fresh start..."
    rm -f taxi_data.db
fi

# Initialize database with error handling
if python -c "
import sys
sys.path.append('.')
try:
    from app import app, db
    with app.app_context():
        db.create_all()
        print('Database tables created successfully!')
except Exception as e:
    print(f'Database initialization failed: {e}')
    sys.exit(1)
" 2>/dev/null; then
    print_success "Database initialized successfully"
else
    print_error "Database initialization failed"
    cd ..
    exit 1
fi

cd ..

# Create sample data if needed
print_status "Setting up sample data..."
if [ ! -f "data/raw/train.csv" ]; then
    print_warning "No train.csv found in data/raw/. The app will use sample data."
    print_status "To use real data, place train.csv in data/raw/ directory"
else
    print_success "Real data file found: data/raw/train.csv"
fi

# Test the setup
print_status "Testing setup..."
cd backend
if python -c "
import sys
sys.path.append('.')
try:
    from app import app
    print('Flask app imports successfully')
except Exception as e:
    print(f'Flask app test failed: {e}')
    sys.exit(1)
" 2>/dev/null; then
    print_success "Setup test passed"
else
    print_error "Setup test failed"
    cd ..
    exit 1
fi
cd ..

# Create startup script
print_status "Creating startup script..."
cat > start_app.sh << 'EOF'
#!/bin/bash
echo "🚕 Starting NYC Taxi Analytics Dashboard..."
echo "=========================================="

# Activate virtual environment
source venv/bin/activate

# Start the Flask server
cd backend
echo "Starting Flask server on http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo ""
python app.py
EOF

chmod +x start_app.sh
print_success "Startup script created: start_app.sh"

echo ""
echo "🎉 Setup completed successfully!"
echo "================================"
echo ""
echo "📋 Next Steps:"
echo "1. Start the application: ./start_app.sh"
echo "2. Or manually: source venv/bin/activate && cd backend && python app.py"
echo "3. Open your browser: http://localhost:5000"
echo ""
echo "📁 Project Structure:"
echo "├── frontend/ (HTML, CSS, JS)"
echo "├── backend/ (Flask API)"
echo "├── data/ (CSV files)"
echo "└── venv/ (Python environment)"
echo ""
echo "🔧 Useful Commands:"
echo "• Start app: ./start_app.sh"
echo "• Activate venv: source venv/bin/activate"
echo "• Install deps: pip install -r backend/requirements.txt"
echo "• Reset DB: rm backend/taxi_data.db && cd backend && python app.py"
echo ""
echo "📚 Documentation:"
echo "• README.md - Complete documentation"
echo "• QUICKSTART.md - Quick start guide"
echo "• ARCHITECTURE.md - System architecture"
echo "• VIDEO_SCRIPT.md - Video walkthrough guide"
echo ""
echo "Happy coding! 🚕✨"