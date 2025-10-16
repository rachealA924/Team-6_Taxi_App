# NYC Taxi Trip Analytics Dashboard

A comprehensive fullstack application for analyzing New York City taxi trip data, providing insights into urban mobility patterns and trip characteristics.

## Project Overview

This application processes raw NYC taxi trip data, stores it in a relational database, and presents interactive visualizations through a modern web dashboard. The system enables users to explore trip patterns, analyze fare distributions, and gain insights into city mobility trends.

## Features

### Frontend Dashboard
- **Interactive Visualizations**: Multiple chart types including bar charts, pie charts, and doughnut charts
- **Real-time Filtering**: Filter trips by date range, passenger count, fare range, and distance
- **Advanced Sorting**: Sort data by pickup time, fare, distance, or duration
- **Search Functionality**: Quick search across trip details
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Key Metrics Display**: Overview cards showing total trips, average fare, duration, and distance

### Data Insights
- Peak travel hours analysis
- Fare distribution patterns
- Distance and duration statistics
- Payment type breakdown
- Passenger count distribution

## Technology Stack

### Frontend
- **HTML5**: Semantic markup for structure
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Interactive functionality and data manipulation
- **Chart.js**: Data visualization library
- **Google Fonts**: Quicksand font family

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Relational database (development)
- **RESTful API**: Complete data endpoints
- **CORS Enabled**: Frontend integration ready

## Project Structure

```
Team-6_Taxi_App/
│
├── index.html         
├── styles.css         
├── app.js             
├── README.md          
├── setup.sh
|-- setup.py
|-- .gitignore           
│
├── backend/           
│   ├── app.py        
│   ├── requirements.txt 
│   ├── models/       
│   ├── routes/        
│   ├── data_processing/ 
│   └── taxi_data.db   
├── database/         
│   └── schema.sql     
|---data/raw
     
```

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.7+** (Check with `python --version`)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)
- **Git** (for version control)
- **Terminal/Command Prompt**

### Option 1: Quick Setup (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/rachealA924/Team-6_Taxi_App.git
cd Team-6_Taxi_App
```

2. **Run the automated setup script**
```bash
# Make setup script executable (Linux/Mac)
chmod +x setup.sh

# Run setup script
./setup.sh
```

3. **Start the application**
```bash
# The setup script will guide you through starting the server
# Or manually start with:
cd backend
python3 app.py
```

4. **Access the dashboard**
   - Open your browser and navigate to `http://localhost:5000`
   - The dashboard will load with sample data

### Option 2: Manual Setup

#### Step 1: Environment Setup
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Step 2: Install Dependencies
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Install Node.js dependencies (if needed)
npm install
```

#### Step 3: Database Setup
```bash
# Navigate to backend directory
cd backend

# The database will be created automatically when you start the server
# Or manually create tables:
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

#### Step 4: Start the Application

**Backend Server:**
```bash
cd backend
python3 app.py
```

**Frontend (Alternative):**
```bash
# If you want to run frontend separately
python -m http.server 8000
# Then open http://localhost:8000
```

### Option 3: Frontend Only (No Backend)

If you just want to see the dashboard without the backend:

```bash
# Simply open the HTML file in your browser
open index.html

# Or use a local server
python -m http.server 8000
# Then open http://localhost:8000
```

### 🔧 Environment Configuration

Create a `.env` file in the backend directory (optional):
```env
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///taxi_data.db
```

### 📊 Data Setup

The application works with sample data by default. To use real NYC taxi data:

1. **Download the dataset** (train.csv) and place it in `data/raw/`
2. **Run data processing**:
```bash
cd backend
python -c "from data_processing.data_cleaner import process_data; process_data()"
```

### 🐛 Troubleshooting

**Common Issues:**

1. **Port 5000 already in use:**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9
# Or change port in app.py
```

2. **Python dependencies not found:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r backend/requirements.txt
```

3. **Database errors:**
```bash
# Delete existing database and recreate
rm backend/taxi_data.db
cd backend && python app.py
```

4. **CORS errors:**
   - Ensure backend is running on port 5000
   - Check that Flask-CORS is installed
   - Verify API_BASE_URL in app.js

### ✅ Verification

After setup, verify everything works:

1. **Backend Health Check:**
```bash
curl http://localhost:5000/api/health
```

2. **Frontend Access:**
   - Open `http://localhost:5000`
   - You should see the dashboard with charts and data

3. **API Endpoints:**
   - `http://localhost:5000/api/trips` - Should return trip data
   - `http://localhost:5000/api/trips/stats` - Should return statistics

### 🚀 Production Deployment

For production deployment:

1. **Use a production WSGI server:**
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

2. **Set up a reverse proxy** (nginx)
3. **Use PostgreSQL** instead of SQLite
4. **Enable HTTPS**
5. **Set up monitoring and logging**

### Backend Features

The backend provides:
1. **RESTful API** with filtering and pagination
2. **SQLite database** with real NYC taxi data processing
3. **Data cleaning pipeline** for raw dataset processing
4. **Statistics endpoints** for analytics
5. **CORS support** for frontend integration
6. **Health check** endpoint

### Real Dataset Processing

the train.csv is placed in data/raw

## Usage

### Using the Dashboard

1. **View Overview Metrics**
   - The top section displays key statistics about the trips
   - Metrics update automatically based on applied filters

2. **Apply Filters**
   - Use the filter section to narrow down trips by:
     - Date range
     - Passenger count
     - Fare range
     - Trip distance
   - Click "Apply Filters" to update the dashboard

3. **Explore Visualizations**
   - View hourly trip distribution
   - Analyze fare patterns
   - Check passenger count distribution
   - Review payment type breakdown

4. **Search and Sort**
   - Use the search bar to find specific trips
   - Select sorting options from the dropdown
   - Navigate through pages using pagination controls

5. **Read Insights**
   - Scroll to the insights section for key findings
   - Insights are automatically calculated from the filtered data

## Custom Algorithm Implementation

### Bubble Sort for Trip Sorting

The application implements a custom bubble sort algorithm for sorting trips by various fields (pickup time, fare, distance, duration).

**Location**: `app.js` - `sortTripsByField()` function

**Algorithm**:
```javascript
function sortTripsByField(trips, field, direction) {
    // Bubble sort implementation
    for (let i = 0; i < trips.length - 1; i++) {
        for (let j = 0; j < trips.length - i - 1; j++) {
            // Compare and swap if needed
            if (shouldSwap) {
                // Swap elements
            }
        }
    }
}
```

**Time Complexity**: O(n²)
**Space Complexity**: O(1)

**Justification**: While not the most efficient sorting algorithm, bubble sort provides a clear, understandable implementation that demonstrates algorithmic thinking. For larger datasets, this could be replaced with quicksort or mergesort.

### Custom Search Algorithm

A linear search implementation for filtering trips based on search terms.

**Location**: `app.js` - `filterTripsBySearch()` function

**Time Complexity**: O(n)
**Space Complexity**: O(n)

## API Integration

The frontend automatically integrates with the backend API:

### Available Endpoints
- `GET /api/trips` - Fetch all trips with filtering and pagination
- `GET /api/trips/stats` - Get aggregated statistics
- `GET /api/trips/hourly` - Get hourly trip distribution
- `GET /api/trips/payment-types` - Get payment type breakdown
- `GET /api/health` - Health check

### Query Parameters
- `page`, `limit` - Pagination
- `sort`, `order` - Sorting
- `startDate`, `endDate` - Date filtering
- `passengerCount` - Passenger count filter
- `minFare`, `maxFare` - Fare range filtering
- `minDistance`, `maxDistance` - Distance range filtering
- `search` - Text search

### Automatic Fallback
The frontend automatically detects API availability:
- ✅ **API Available**: Uses real data from backend


This ensures the dashboard works in both development and production environments.

## Data Schema

### Trip Object Structure
```javascript
{
    id: Number,
    pickupTime: String (ISO format),
    dropoffTime: String (ISO format),
    passengerCount: Number,
    tripDistance: Number (miles),
    tripDuration: Number (minutes),
    fareAmount: Number (dollars),
    tipAmount: Number (dollars),
    paymentType: String,
    pickupLat: Number,
    pickupLon: Number,
    dropoffLat: Number,
    dropoffLon: Number
}
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Chart rendering is optimized with Chart.js
- Pagination limits data display for better performance
- Lazy loading can be implemented for large datasets
- Debouncing on search input for better UX



## Contributing

This is a team project. 

1. Created feature branches for new work
2. Wrote clear commit messages
3. Tested thoroughly before merging
4. Updated documentation as needed
5. Followed the existing code style

## Team Members

- Racheal Resty Akello (r.akeello@alustudent.com)
- Ishimwe Bruno (i.bruno@alustudent.com)

## License

This project is created for easy way of helping the community.

## Contact

For questions or issues, please contact the team or create an issue in the repository.

## Acknowledgments

- NYC Taxi & Limousine Commission for the dataset
- Chart.js for visualization library
- Google Fonts for typography

LINK OF THE VIDEO:
[
](https://drive.google.com/file/d/1kLgFucZ169wNaqwXySwenGUE3QgycIPA/view?usp=sharing)

LINK TO OUR DEPLOYMENT:
[
](https://team-6-taxi-app-git-main-racheals-projects-cf6a576e.vercel.app?_vercel_share=hiV8FyCWj5pyKPx1ZjR5tTZPSbUTkI6Z)

