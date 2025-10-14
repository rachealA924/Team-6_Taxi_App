# NYC Taxi Analytics Backend

Backend API server for the NYC Taxi Analytics Dashboard.

## Features

- **RESTful API**: Complete API endpoints for trip data
- **SQLite Database**: Lightweight database for development
- **Real-time Filtering**: Advanced filtering and search capabilities
- **Statistics API**: Aggregated statistics and analytics
- **CORS Enabled**: Ready for frontend integration

## API Endpoints

### Trips
- `GET /api/trips` - Get all trips with filtering and pagination
- `GET /api/trips/stats` - Get aggregated statistics
- `GET /api/trips/hourly` - Get hourly trip distribution
- `GET /api/trips/payment-types` - Get payment type breakdown

### Health
- `GET /api/health` - Health check endpoint

## Query Parameters

### Trips Endpoint
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sort` - Sort field (default: pickup_time)
- `order` - Sort direction: asc/desc (default: desc)
- `startDate` - Filter by start date (YYYY-MM-DD)
- `endDate` - Filter by end date (YYYY-MM-DD)
- `passengerCount` - Filter by passenger count
- `minFare` - Minimum fare amount
- `maxFare` - Maximum fare amount
- `minDistance` - Minimum trip distance
- `maxDistance` - Maximum trip distance
- `search` - Search in payment type or pickup time

## Installation

1. **Install Node.js dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

3. **Access the API:**
   - Server: http://localhost:5000
   - Dashboard: http://localhost:5000 (serves the frontend)
   - API: http://localhost:5000/api/

## Data Structure

### Trip Object
```javascript
{
    id: Number,
    pickupTime: String, // "YYYY-MM-DD HH:mm:ss"
    dropoffTime: String, // "YYYY-MM-DD HH:mm:ss"
    passengerCount: Number,
    tripDistance: Number, // miles
    tripDuration: Number, // minutes
    fareAmount: Number, // dollars
    tipAmount: Number, // dollars
    paymentType: String, // "Credit card" or "Cash"
    pickupLat: Number,
    pickupLon: Number,
    dropoffLat: Number,
    dropoffLon: Number
}
```

## Database

The backend uses SQLite for simplicity. The database file is created automatically at `backend/taxi_data.db`.

### Sample Data
The server automatically loads sample taxi trip data on first startup.

## Development

### Adding New Endpoints
1. Add route in `server.js`
2. Update this README with endpoint documentation
3. Test with the frontend

### Database Schema
```sql
CREATE TABLE trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pickup_time TEXT NOT NULL,
    dropoff_time TEXT NOT NULL,
    passenger_count INTEGER NOT NULL,
    trip_distance REAL NOT NULL,
    trip_duration INTEGER NOT NULL,
    fare_amount REAL NOT NULL,
    tip_amount REAL NOT NULL,
    payment_type TEXT NOT NULL,
    pickup_lat REAL NOT NULL,
    pickup_lon REAL NOT NULL,
    dropoff_lat REAL NOT NULL,
    dropoff_lon REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Integration with Frontend

The frontend automatically detects if the API is available:
- If API is running: Uses real data from backend
- If API is not available: Falls back to sample data

This ensures the dashboard works in both development and production environments.

## Environment Variables

- `PORT` - Server port (default: 5000)

## Production Deployment

For production deployment:
1. Use a production database (PostgreSQL, MySQL)
2. Set up environment variables
3. Use a process manager (PM2)
4. Set up reverse proxy (Nginx)

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Change port
   PORT=3001 npm start
   ```

2. **Database errors:**
   - Delete `taxi_data.db` and restart server
   - Check file permissions

3. **CORS errors:**
   - Ensure CORS is enabled in server.js
   - Check frontend URL configuration

## Team

- Backend: Node.js/Express API
- Database: SQLite (development)
- Frontend: HTML/CSS/JavaScript
