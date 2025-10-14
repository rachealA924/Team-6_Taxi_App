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

## Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.7 or higher
- Git (for version control)

### Quick Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Team-6_Taxi_App
```

2. **Run the setup script**
```bash
python setup.py
```

3. **Start the Flask server**
```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the server
cd backend && python app.py
```

4. **Access the dashboard**
   - Open your browser and navigate to `http://localhost:5000`

### Manual Setup

#### Frontend Only
```bash
# Simply open the HTML file
open index.html
# or use a local server
python -m http.server 8000
```

#### Full Stack (Frontend + Backend)
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start the server
cd backend && python app.py

# Access at http://localhost:5000
```

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

---



