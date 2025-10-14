#!/bin/bash

# NYC Taxi Analytics Dashboard Setup Script

echo "🚕 NYC Taxi Analytics Dashboard Setup"
echo "====================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or higher:"
    echo "   https://python.org/"
    exit 1
fi

echo "✅ Python 3 is installed"

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv

if [ $? -eq 0 ]; then
    echo "✅ Virtual environment created successfully"
else
    echo "❌ Failed to create virtual environment"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install -r backend/requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data/raw
mkdir -p data/processed

echo "✅ Data directories created"

# Display setup completion
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Activate virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. For REAL NYC DATASET (Assignment Requirement):"
echo "   - Place train.zip in data/raw/ directory"
echo "   - cd backend && python data_processing/process_real_data.py"
echo "   - python app.py"
echo ""
echo "3. For SAMPLE DATA (Quick Start):"
echo "   cd backend && python app.py"
echo ""
echo "4. Open the dashboard:"
echo "   http://localhost:5000"
echo ""
echo "📊 Features:"
echo "- Interactive dashboard with filtering"
echo "- Real-time data from backend API"
echo "- Fallback to sample data if API unavailable"
echo "- Responsive design for all devices"
echo ""
echo "🔧 Development:"
echo "- Backend API: http://localhost:5000/api/"
echo "- Health check: http://localhost:5000/api/health"
echo "- Auto-reload: npm run dev (in backend directory)"
echo ""
echo "Happy coding! 🚕📈"
