const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Database setup
const dbPath = path.join(__dirname, 'taxi_data.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
function initializeDatabase() {
    db.serialize(() => {
        // Create trips table
        db.run(`
            CREATE TABLE IF NOT EXISTS trips (
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
            )
        `);

        // Create indexes for better performance
        db.run('CREATE INDEX IF NOT EXISTS idx_pickup_time ON trips(pickup_time)');
        db.run('CREATE INDEX IF NOT EXISTS idx_fare_amount ON trips(fare_amount)');
        db.run('CREATE INDEX IF NOT EXISTS idx_trip_distance ON trips(trip_distance)');
        db.run('CREATE INDEX IF NOT EXISTS idx_passenger_count ON trips(passenger_count)');
    });
}

// Sample data loader (for development)
function loadSampleData() {
    const sampleTrips = [
        {
            pickup_time: '2024-01-15 08:30:00',
            dropoff_time: '2024-01-15 09:15:00',
            passenger_count: 2,
            trip_distance: 4.2,
            trip_duration: 45,
            fare_amount: 18.50,
            tip_amount: 3.70,
            payment_type: 'Credit card',
            pickup_lat: 40.7589,
            pickup_lon: -73.9851,
            dropoff_lat: 40.7614,
            dropoff_lon: -73.9776
        },
        {
            pickup_time: '2024-01-15 12:45:00',
            dropoff_time: '2024-01-15 13:05:00',
            passenger_count: 1,
            trip_distance: 1.8,
            trip_duration: 20,
            fare_amount: 8.25,
            tip_amount: 1.65,
            payment_type: 'Cash',
            pickup_lat: 40.7128,
            pickup_lon: -74.0060,
            dropoff_lat: 40.7282,
            dropoff_lon: -74.0776
        },
        {
            pickup_time: '2024-01-15 17:20:00',
            dropoff_time: '2024-01-15 18:10:00',
            passenger_count: 4,
            trip_distance: 6.5,
            trip_duration: 50,
            fare_amount: 28.00,
            tip_amount: 5.60,
            payment_type: 'Credit card',
            pickup_lat: 40.7505,
            pickup_lon: -73.9934,
            dropoff_lat: 40.6892,
            dropoff_lon: -74.0445
        },
        {
            pickup_time: '2024-01-15 19:30:00',
            dropoff_time: '2024-01-15 19:55:00',
            passenger_count: 2,
            trip_distance: 3.1,
            trip_duration: 25,
            fare_amount: 14.75,
            tip_amount: 2.95,
            payment_type: 'Credit card',
            pickup_lat: 40.7489,
            pickup_lon: -73.9680,
            dropoff_lat: 40.7580,
            dropoff_lon: -73.9855
        },
        {
            pickup_time: '2024-01-15 22:00:00',
            dropoff_time: '2024-01-15 22:30:00',
            passenger_count: 1,
            trip_distance: 5.8,
            trip_duration: 30,
            fare_amount: 24.50,
            tip_amount: 4.90,
            payment_type: 'Credit card',
            pickup_lat: 40.6782,
            pickup_lon: -73.9442,
            dropoff_lat: 40.7589,
            dropoff_lon: -73.9851
        },
        {
            pickup_time: '2024-01-16 07:15:00',
            dropoff_time: '2024-01-16 07:45:00',
            passenger_count: 1,
            trip_distance: 2.3,
            trip_duration: 30,
            fare_amount: 12.00,
            tip_amount: 2.40,
            payment_type: 'Credit card',
            pickup_lat: 40.7831,
            pickup_lon: -73.9712,
            dropoff_lat: 40.7614,
            dropoff_lon: -73.9776
        },
        {
            pickup_time: '2024-01-16 14:20:00',
            dropoff_time: '2024-01-16 14:50:00',
            passenger_count: 3,
            trip_distance: 3.8,
            trip_duration: 30,
            fare_amount: 16.75,
            tip_amount: 3.35,
            payment_type: 'Cash',
            pickup_lat: 40.7282,
            pickup_lon: -74.0776,
            dropoff_lat: 40.7505,
            pickup_lon: -73.9934
        },
        {
            pickup_time: '2024-01-16 18:30:00',
            dropoff_time: '2024-01-16 19:15:00',
            passenger_count: 2,
            trip_distance: 7.2,
            trip_duration: 45,
            fare_amount: 32.50,
            tip_amount: 6.50,
            payment_type: 'Credit card',
            pickup_lat: 40.6892,
            pickup_lon: -74.0445,
            dropoff_lat: 40.7489,
            pickup_lon: -73.9680
        }
    ];

    // Check if data already exists
    db.get('SELECT COUNT(*) as count FROM trips', (err, row) => {
        if (err) {
            console.error('Error checking data:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('Loading sample data...');
            const stmt = db.prepare(`
                INSERT INTO trips (
                    pickup_time, dropoff_time, passenger_count, trip_distance, 
                    trip_duration, fare_amount, tip_amount, payment_type, 
                    pickup_lat, pickup_lon, dropoff_lat, dropoff_lon
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            sampleTrips.forEach(trip => {
                stmt.run([
                    trip.pickup_time,
                    trip.dropoff_time,
                    trip.passenger_count,
                    trip.trip_distance,
                    trip.trip_duration,
                    trip.fare_amount,
                    trip.tip_amount,
                    trip.payment_type,
                    trip.pickup_lat,
                    trip.pickup_lon,
                    trip.dropoff_lat,
                    trip.dropoff_lon
                ]);
            });
            
            stmt.finalize();
            console.log(`Loaded ${sampleTrips.length} sample trips`);
        } else {
            console.log(`Database already contains ${row.count} trips`);
        }
    });
}

// API Routes

// Get all trips with filtering and pagination
app.get('/api/trips', (req, res) => {
    const {
        page = 1,
        limit = 20,
        sort = 'pickup_time',
        order = 'desc',
        startDate,
        endDate,
        passengerCount,
        minFare,
        maxFare,
        minDistance,
        maxDistance,
        search
    } = req.query;

    let query = 'SELECT * FROM trips WHERE 1=1';
    const params = [];

    // Apply filters
    if (startDate) {
        query += ' AND DATE(pickup_time) >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND DATE(pickup_time) <= ?';
        params.push(endDate);
    }
    if (passengerCount) {
        query += ' AND passenger_count = ?';
        params.push(parseInt(passengerCount));
    }
    if (minFare) {
        query += ' AND fare_amount >= ?';
        params.push(parseFloat(minFare));
    }
    if (maxFare) {
        query += ' AND fare_amount <= ?';
        params.push(parseFloat(maxFare));
    }
    if (minDistance) {
        query += ' AND trip_distance >= ?';
        params.push(parseFloat(minDistance));
    }
    if (maxDistance) {
        query += ' AND trip_distance <= ?';
        params.push(parseFloat(maxDistance));
    }
    if (search) {
        query += ' AND (payment_type LIKE ? OR pickup_time LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
    }

    // Add sorting
    query += ` ORDER BY ${sort} ${order.toUpperCase()}`;

    // Get total count for pagination
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    db.get(countQuery, params, (err, countRow) => {
        if (err) {
            console.error('Error getting count:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Add pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Error fetching trips:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Transform data to match frontend format
            const trips = rows.map(row => ({
                id: row.id,
                pickupTime: row.pickup_time,
                dropoffTime: row.dropoff_time,
                passengerCount: row.passenger_count,
                tripDistance: row.trip_distance,
                tripDuration: row.trip_duration,
                fareAmount: row.fare_amount,
                tipAmount: row.tip_amount,
                paymentType: row.payment_type,
                pickupLat: row.pickup_lat,
                pickupLon: row.pickup_lon,
                dropoffLat: row.dropoff_lat,
                dropoffLon: row.dropoff_lon
            }));

            res.json({
                trips,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countRow.total / parseInt(limit)),
                    totalItems: countRow.total,
                    itemsPerPage: parseInt(limit)
                }
            });
        });
    });
});

// Get trip statistics
app.get('/api/trips/stats', (req, res) => {
    const { startDate, endDate, passengerCount, minFare, maxFare, minDistance, maxDistance } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
        whereClause += ' AND DATE(pickup_time) >= ?';
        params.push(startDate);
    }
    if (endDate) {
        whereClause += ' AND DATE(pickup_time) <= ?';
        params.push(endDate);
    }
    if (passengerCount) {
        whereClause += ' AND passenger_count = ?';
        params.push(parseInt(passengerCount));
    }
    if (minFare) {
        whereClause += ' AND fare_amount >= ?';
        params.push(parseFloat(minFare));
    }
    if (maxFare) {
        whereClause += ' AND fare_amount <= ?';
        params.push(parseFloat(maxFare));
    }
    if (minDistance) {
        whereClause += ' AND trip_distance >= ?';
        params.push(parseFloat(minDistance));
    }
    if (maxDistance) {
        whereClause += ' AND trip_distance <= ?';
        params.push(parseFloat(maxDistance));
    }

    const statsQuery = `
        SELECT 
            COUNT(*) as totalTrips,
            AVG(fare_amount) as avgFare,
            AVG(trip_duration) as avgDuration,
            AVG(trip_distance) as avgDistance,
            SUM(fare_amount) as totalRevenue,
            AVG(tip_amount) as avgTip,
            MIN(fare_amount) as minFare,
            MAX(fare_amount) as maxFare,
            MIN(trip_distance) as minDistance,
            MAX(trip_distance) as maxDistance
        FROM trips 
        ${whereClause}
    `;

    db.get(statsQuery, params, (err, row) => {
        if (err) {
            console.error('Error getting stats:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({
            totalTrips: row.totalTrips || 0,
            avgFare: row.avgFare ? parseFloat(row.avgFare.toFixed(2)) : 0,
            avgDuration: row.avgDuration ? parseFloat(row.avgDuration.toFixed(2)) : 0,
            avgDistance: row.avgDistance ? parseFloat(row.avgDistance.toFixed(2)) : 0,
            totalRevenue: row.totalRevenue ? parseFloat(row.totalRevenue.toFixed(2)) : 0,
            avgTip: row.avgTip ? parseFloat(row.avgTip.toFixed(2)) : 0,
            minFare: row.minFare || 0,
            maxFare: row.maxFare || 0,
            minDistance: row.minDistance || 0,
            maxDistance: row.maxDistance || 0
        });
    });
});

// Get hourly trip distribution
app.get('/api/trips/hourly', (req, res) => {
    const { startDate, endDate } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
        whereClause += ' AND DATE(pickup_time) >= ?';
        params.push(startDate);
    }
    if (endDate) {
        whereClause += ' AND DATE(pickup_time) <= ?';
        params.push(endDate);
    }

    const hourlyQuery = `
        SELECT 
            CAST(strftime('%H', pickup_time) AS INTEGER) as hour,
            COUNT(*) as count,
            AVG(fare_amount) as avgFare,
            AVG(trip_duration) as avgDuration,
            AVG(trip_distance) as avgDistance
        FROM trips 
        ${whereClause}
        GROUP BY CAST(strftime('%H', pickup_time) AS INTEGER)
        ORDER BY hour
    `;

    db.all(hourlyQuery, params, (err, rows) => {
        if (err) {
            console.error('Error getting hourly data:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const hourlyData = new Array(24).fill(0).map((_, index) => {
            const row = rows.find(r => r.hour === index);
            return {
                hour: index,
                count: row ? row.count : 0,
                avgFare: row ? parseFloat(row.avgFare.toFixed(2)) : 0,
                avgDuration: row ? parseFloat(row.avgDuration.toFixed(2)) : 0,
                avgDistance: row ? parseFloat(row.avgDistance.toFixed(2)) : 0
            };
        });

        res.json(hourlyData);
    });
});

// Get payment type distribution
app.get('/api/trips/payment-types', (req, res) => {
    const { startDate, endDate } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
        whereClause += ' AND DATE(pickup_time) >= ?';
        params.push(startDate);
    }
    if (endDate) {
        whereClause += ' AND DATE(pickup_time) <= ?';
        params.push(endDate);
    }

    const paymentQuery = `
        SELECT 
            payment_type,
            COUNT(*) as count,
            AVG(fare_amount) as avgFare,
            AVG(tip_amount) as avgTip
        FROM trips 
        ${whereClause}
        GROUP BY payment_type
        ORDER BY count DESC
    `;

    db.all(paymentQuery, params, (err, rows) => {
        if (err) {
            console.error('Error getting payment data:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const paymentData = rows.map(row => ({
            paymentType: row.payment_type,
            count: row.count,
            avgFare: parseFloat(row.avgFare.toFixed(2)),
            avgTip: parseFloat(row.avgTip.toFixed(2))
        }));

        res.json(paymentData);
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Initialize database and start server
initializeDatabase();
loadSampleData();

app.listen(PORT, () => {
    console.log(`🚕 NYC Taxi Analytics Backend running on port ${PORT}`);
    console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
    console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
