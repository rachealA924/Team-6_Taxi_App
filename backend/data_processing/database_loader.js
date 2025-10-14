const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

/**
 * Database Loader for NYC Taxi Trip Dataset
 * Loads cleaned data into SQLite database with proper schema
 * Implements assignment requirements for database design
 */
class DatabaseLoader {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
        this.batchSize = 1000; // Insert in batches for performance
    }

    /**
     * Initialize database connection and create schema
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('📊 Connected to SQLite database');
                    this.createSchema().then(resolve).catch(reject);
                }
            });
        });
    }

    /**
     * Create normalized database schema (Assignment Requirement #2)
     */
    async createSchema() {
        console.log('🏗️  Creating database schema...');

        const schema = `
            -- Main trips table with normalized structure
            CREATE TABLE IF NOT EXISTS trips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pickup_datetime TEXT NOT NULL,
                dropoff_datetime TEXT NOT NULL,
                passenger_count INTEGER NOT NULL CHECK (passenger_count >= 1 AND passenger_count <= 6),
                trip_distance REAL NOT NULL CHECK (trip_distance >= 0 AND trip_distance <= 500),
                trip_duration INTEGER NOT NULL CHECK (trip_duration >= 30 AND trip_duration <= 86400),
                fare_amount REAL NOT NULL CHECK (fare_amount >= 0 AND fare_amount <= 1000),
                tip_amount REAL NOT NULL CHECK (tip_amount >= 0 AND tip_amount <= 500),
                tolls_amount REAL NOT NULL CHECK (tolls_amount >= 0 AND tolls_amount <= 100),
                total_amount REAL NOT NULL CHECK (total_amount >= 0 AND total_amount <= 2000),
                payment_type INTEGER NOT NULL CHECK (payment_type >= 1 AND payment_type <= 6),
                pickup_longitude REAL NOT NULL,
                pickup_latitude REAL NOT NULL,
                dropoff_longitude REAL NOT NULL,
                dropoff_latitude REAL NOT NULL,
                
                -- Derived features (Assignment Requirement #1)
                trip_speed_mph REAL NOT NULL,
                fare_per_mile REAL NOT NULL,
                idle_time_minutes REAL NOT NULL,
                tip_percentage REAL NOT NULL,
                
                -- Metadata
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Payment types lookup table (normalization)
            CREATE TABLE IF NOT EXISTS payment_types (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT
            );

            -- Insert payment type lookup data
            INSERT OR IGNORE INTO payment_types (id, name, description) VALUES
            (1, 'Credit card', 'Payment made with credit card'),
            (2, 'Cash', 'Payment made with cash'),
            (3, 'No charge', 'No charge for trip'),
            (4, 'Dispute', 'Trip disputed by passenger'),
            (5, 'Unknown', 'Payment method unknown'),
            (6, 'Voided trip', 'Trip was voided');

            -- Create indexes for efficient queries (Assignment Requirement #2)
            CREATE INDEX IF NOT EXISTS idx_trips_pickup_datetime ON trips(pickup_datetime);
            CREATE INDEX IF NOT EXISTS idx_trips_dropoff_datetime ON trips(dropoff_datetime);
            CREATE INDEX IF NOT EXISTS idx_trips_passenger_count ON trips(passenger_count);
            CREATE INDEX IF NOT EXISTS idx_trips_fare_amount ON trips(fare_amount);
            CREATE INDEX IF NOT EXISTS idx_trips_trip_distance ON trips(trip_distance);
            CREATE INDEX IF NOT EXISTS idx_trips_payment_type ON trips(payment_type);
            CREATE INDEX IF NOT EXISTS idx_trips_trip_speed ON trips(trip_speed_mph);
            CREATE INDEX IF NOT EXISTS idx_trips_fare_per_mile ON trips(fare_per_mile);
            CREATE INDEX IF NOT EXISTS idx_trips_pickup_location ON trips(pickup_latitude, pickup_longitude);
            CREATE INDEX IF NOT EXISTS idx_trips_dropoff_location ON trips(dropoff_latitude, dropoff_longitude);
            
            -- Composite indexes for common queries
            CREATE INDEX IF NOT EXISTS idx_trips_datetime_fare ON trips(pickup_datetime, fare_amount);
            CREATE INDEX IF NOT EXISTS idx_trips_payment_distance ON trips(payment_type, trip_distance);
            CREATE INDEX IF NOT EXISTS idx_trips_speed_distance ON trips(trip_speed_mph, trip_distance);
        `;

        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Database schema created successfully');
                    resolve();
                }
            });
        });
    }

    /**
     * Load cleaned data from CSV file
     * @param {string} csvFile - Path to cleaned CSV file
     */
    async loadData(csvFile) {
        console.log(`📥 Loading data from: ${csvFile}`);
        
        if (!fs.existsSync(csvFile)) {
            throw new Error(`CSV file not found: ${csvFile}`);
        }

        const records = [];
        let recordCount = 0;
        let batchCount = 0;

        // Read CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFile)
                .pipe(csv())
                .on('data', (row) => {
                    records.push(row);
                    recordCount++;

                    // Process in batches
                    if (records.length >= this.batchSize) {
                        this.insertBatch(records.splice(0, this.batchSize), batchCount++)
                            .catch(reject);
                    }
                })
                .on('end', async () => {
                    // Insert remaining records
                    if (records.length > 0) {
                        await this.insertBatch(records, batchCount++);
                    }
                    resolve();
                })
                .on('error', reject);
        });

        console.log(`✅ Loaded ${recordCount.toLocaleString()} records into database`);
        
        // Verify data integrity
        await this.verifyDataIntegrity();
        
        return recordCount;
    }

    /**
     * Insert batch of records
     * @param {Array} records - Batch of records to insert
     * @param {number} batchNumber - Batch number for logging
     */
    async insertBatch(records, batchNumber) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO trips (
                    pickup_datetime, dropoff_datetime, passenger_count, trip_distance,
                    trip_duration, fare_amount, tip_amount, tolls_amount, total_amount,
                    payment_type, pickup_longitude, pickup_latitude, dropoff_longitude,
                    dropoff_latitude, trip_speed_mph, fare_per_mile, idle_time_minutes,
                    tip_percentage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                records.forEach(record => {
                    stmt.run([
                        record.pickup_datetime,
                        record.dropoff_datetime,
                        parseInt(record.passenger_count),
                        parseFloat(record.trip_distance),
                        parseInt(record.trip_duration),
                        parseFloat(record.fare_amount),
                        parseFloat(record.tip_amount),
                        parseFloat(record.tolls_amount),
                        parseFloat(record.total_amount),
                        parseInt(record.payment_type),
                        parseFloat(record.pickup_longitude),
                        parseFloat(record.pickup_latitude),
                        parseFloat(record.dropoff_longitude),
                        parseFloat(record.dropoff_latitude),
                        parseFloat(record.trip_speed_mph),
                        parseFloat(record.fare_per_mile),
                        parseFloat(record.idle_time_minutes),
                        parseFloat(record.tip_percentage)
                    ]);
                });
                
                this.db.run('COMMIT', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`📦 Inserted batch ${batchNumber + 1}: ${records.length} records`);
                        resolve();
                    }
                });
            });
        });
    }

    /**
     * Verify data integrity (Assignment Requirement #2)
     */
    async verifyDataIntegrity() {
        console.log('🔍 Verifying data integrity...');

        const checks = [
            {
                name: 'Total Records',
                query: 'SELECT COUNT(*) as count FROM trips'
            },
            {
                name: 'Valid Timestamps',
                query: 'SELECT COUNT(*) as count FROM trips WHERE pickup_datetime < dropoff_datetime'
            },
            {
                name: 'Valid Coordinates',
                query: `SELECT COUNT(*) as count FROM trips 
                       WHERE pickup_latitude BETWEEN 40.4774 AND 40.9176 
                       AND pickup_longitude BETWEEN -74.2591 AND -73.7004
                       AND dropoff_latitude BETWEEN 40.4774 AND 40.9176 
                       AND dropoff_longitude BETWEEN -74.2591 AND -73.7004`
            },
            {
                name: 'Valid Passenger Counts',
                query: 'SELECT COUNT(*) as count FROM trips WHERE passenger_count BETWEEN 1 AND 6'
            },
            {
                name: 'Valid Fare Amounts',
                query: 'SELECT COUNT(*) as count FROM trips WHERE fare_amount BETWEEN 0 AND 1000'
            },
            {
                name: 'Valid Trip Distances',
                query: 'SELECT COUNT(*) as count FROM trips WHERE trip_distance BETWEEN 0 AND 500'
            },
            {
                name: 'Valid Trip Durations',
                query: 'SELECT COUNT(*) as count FROM trips WHERE trip_duration BETWEEN 30 AND 86400'
            },
            {
                name: 'Records with Derived Features',
                query: 'SELECT COUNT(*) as count FROM trips WHERE trip_speed_mph > 0 AND fare_per_mile > 0'
            }
        ];

        for (const check of checks) {
            await new Promise((resolve, reject) => {
                this.db.get(check.query, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`  ✅ ${check.name}: ${row.count.toLocaleString()}`);
                        resolve();
                    }
                });
            });
        }

        // Calculate summary statistics
        await this.calculateSummaryStatistics();
    }

    /**
     * Calculate summary statistics for derived features
     */
    async calculateSummaryStatistics() {
        console.log('\n📈 DERIVED FEATURES SUMMARY');
        console.log('============================');

        const stats = [
            {
                name: 'Trip Speed (mph)',
                query: 'SELECT AVG(trip_speed_mph) as avg, MIN(trip_speed_mph) as min, MAX(trip_speed_mph) as max FROM trips WHERE trip_speed_mph > 0'
            },
            {
                name: 'Fare per Mile ($)',
                query: 'SELECT AVG(fare_per_mile) as avg, MIN(fare_per_mile) as min, MAX(fare_per_mile) as max FROM trips WHERE fare_per_mile > 0'
            },
            {
                name: 'Idle Time (minutes)',
                query: 'SELECT AVG(idle_time_minutes) as avg, MIN(idle_time_minutes) as min, MAX(idle_time_minutes) as max FROM trips WHERE idle_time_minutes >= 0'
            },
            {
                name: 'Tip Percentage (%)',
                query: 'SELECT AVG(tip_percentage) as avg, MIN(tip_percentage) as min, MAX(tip_percentage) as max FROM trips WHERE tip_percentage >= 0'
            }
        ];

        for (const stat of stats) {
            await new Promise((resolve, reject) => {
                this.db.get(stat.query, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`  📊 ${stat.name}:`);
                        console.log(`     Average: ${parseFloat(row.avg).toFixed(2)}`);
                        console.log(`     Range: ${parseFloat(row.min).toFixed(2)} - ${parseFloat(row.max).toFixed(2)}`);
                        resolve();
                    }
                });
            });
        }
    }

    /**
     * Create views for common analytical queries
     */
    async createAnalyticalViews() {
        console.log('📊 Creating analytical views...');

        const views = [
            {
                name: 'daily_trip_summary',
                query: `
                    CREATE VIEW IF NOT EXISTS daily_trip_summary AS
                    SELECT 
                        DATE(pickup_datetime) as trip_date,
                        COUNT(*) as trip_count,
                        AVG(fare_amount) as avg_fare,
                        AVG(trip_distance) as avg_distance,
                        AVG(trip_speed_mph) as avg_speed,
                        AVG(idle_time_minutes) as avg_idle_time,
                        SUM(total_amount) as total_revenue
                    FROM trips
                    GROUP BY DATE(pickup_datetime)
                    ORDER BY trip_date
                `
            },
            {
                name: 'hourly_trip_patterns',
                query: `
                    CREATE VIEW IF NOT EXISTS hourly_trip_patterns AS
                    SELECT 
                        CAST(strftime('%H', pickup_datetime) AS INTEGER) as hour,
                        COUNT(*) as trip_count,
                        AVG(fare_amount) as avg_fare,
                        AVG(trip_speed_mph) as avg_speed,
                        AVG(idle_time_minutes) as avg_idle_time
                    FROM trips
                    GROUP BY CAST(strftime('%H', pickup_datetime) AS INTEGER)
                    ORDER BY hour
                `
            },
            {
                name: 'payment_type_analysis',
                query: `
                    CREATE VIEW IF NOT EXISTS payment_type_analysis AS
                    SELECT 
                        pt.name as payment_type,
                        COUNT(*) as trip_count,
                        AVG(fare_amount) as avg_fare,
                        AVG(tip_amount) as avg_tip,
                        AVG(tip_percentage) as avg_tip_percentage
                    FROM trips t
                    JOIN payment_types pt ON t.payment_type = pt.id
                    GROUP BY pt.name
                    ORDER BY trip_count DESC
                `
            }
        ];

        for (const view of views) {
            await new Promise((resolve, reject) => {
                this.db.exec(view.query, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`  ✅ Created view: ${view.name}`);
                        resolve();
                    }
                });
            });
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('📊 Database connection closed');
                }
            });
        }
    }
}

module.exports = DatabaseLoader;
