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

### Backend (To be implemented)
- **Node.js/Flask**: Backend framework
- **PostgreSQL/SQLite/MySQL**: Relational database
- **RESTful API**: Data endpoints

## Project Structure

```
Team-6_Taxi_App/
│
├── index.html          # Main HTML file
├── styles.css          # Styling and layout
├── app.js             # JavaScript logic and functionality
├── README.md          # Project documentation
│
├── backend/           # Backend code (to be implemented)
│   ├── server.js      # Server setup
│   ├── routes/        # API routes
│   ├── models/        # Database models
│   └── utils/         # Utility functions
│
├── data/              # Data files
│   ├── raw/           # Raw dataset
│   └── processed/     # Cleaned data
│
└── docs/              # Documentation
    └── report.pdf     # Technical documentation
```

## Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for backend - v14 or higher)
- PostgreSQL/SQLite/MySQL (for database)
- Git (for version control)

### Frontend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Team-6_Taxi_App
```

2. **Open the application**
   - Simply open `index.html` in your web browser, or
   - Use a local server for better performance:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000
```

3. **Access the dashboard**
   - Open your browser and navigate to `http://localhost:8000`

### Backend Setup (Coming Soon)

The backend implementation will include:
1. Data processing and cleaning scripts
2. Database schema and migration files
3. RESTful API endpoints
4. Connection configuration

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

## API Integration (Placeholder)

The frontend is designed to integrate with a backend API. Currently, it uses sample data. To connect to a real backend:

1. Update the API endpoint in `app.js`:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

2. Implement the following endpoints:
   - `GET /api/trips` - Fetch all trips
   - `POST /api/trips/filter` - Get filtered trips
   - `GET /api/trips/stats` - Get aggregated statistics

3. Update the `fetchTripsFromAPI()` function to use real endpoints

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

## Future Enhancements

- [ ] Backend API implementation
- [ ] Database integration
- [ ] Data processing pipeline
- [ ] User authentication
- [ ] Export functionality (CSV, PDF)
- [ ] Advanced analytics and ML predictions
- [ ] Real-time data updates
- [ ] Map visualization with pickup/dropoff locations
- [ ] Comparison mode for different time periods

## Contributing

This is a team project. All team members should:

1. Create feature branches for new work
2. Write clear commit messages
3. Test thoroughly before merging
4. Update documentation as needed
5. Follow the existing code style

## Team Members

- [Team Member 1]
- [Team Member 2]
- [Team Member 3]
- [Team Member 4]
- [Team Member 5]
- [Team Member 6]

## License

This project is created for educational purposes as part of a university assignment.

## Contact

For questions or issues, please contact the team or create an issue in the repository.

## Acknowledgments

- NYC Taxi & Limousine Commission for the dataset
- Chart.js for visualization library
- Google Fonts for typography

---

**Note**: This is a frontend-only implementation. Backend and database components are to be developed as part of the full assignment requirements.

