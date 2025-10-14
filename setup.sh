#!/bin/bash

# NYC Taxi Analytics Dashboard Setup Script

echo "🚕 NYC Taxi Analytics Dashboard Setup"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..

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
echo "1. Start the backend server:"
echo "   cd backend && npm start"
echo ""
echo "2. Open the dashboard:"
echo "   http://localhost:5000"
echo ""
echo "3. Or open directly in browser:"
echo "   open index.html"
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
