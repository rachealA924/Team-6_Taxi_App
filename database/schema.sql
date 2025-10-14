-- NYC Taxi Trip Database Schema
-- Normalized relational schema for taxi trip data

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pickup_datetime DATETIME NOT NULL,
    dropoff_datetime DATETIME NOT NULL,
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
    
    -- Derived features
    trip_speed_mph REAL NOT NULL,
    fare_per_mile REAL NOT NULL,
    idle_time_minutes REAL NOT NULL,
    
    -- Foreign keys
    pickup_zone_id INTEGER,
    dropoff_zone_id INTEGER,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pickup_zone_id) REFERENCES zones(id),
    FOREIGN KEY (dropoff_zone_id) REFERENCES zones(id)
);

-- Zones table
CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    borough VARCHAR(50) NOT NULL,
    zone_latitude REAL NOT NULL,
    zone_longitude REAL NOT NULL
);

-- Payment types lookup table
CREATE TABLE IF NOT EXISTS payment_types (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Insert payment type data
INSERT OR IGNORE INTO payment_types (id, name, description) VALUES
(1, 'Credit card', 'Payment made with credit card'),
(2, 'Cash', 'Payment made with cash'),
(3, 'No charge', 'No charge for trip'),
(4, 'Dispute', 'Trip disputed by passenger'),
(5, 'Unknown', 'Payment method unknown'),
(6, 'Voided trip', 'Trip was voided');

-- Create indexes for performance
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

-- Views for common analytical queries
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
ORDER BY trip_date;

CREATE VIEW IF NOT EXISTS hourly_trip_patterns AS
SELECT 
    CAST(strftime('%H', pickup_datetime) AS INTEGER) as hour,
    COUNT(*) as trip_count,
    AVG(fare_amount) as avg_fare,
    AVG(trip_speed_mph) as avg_speed,
    AVG(idle_time_minutes) as avg_idle_time
FROM trips
GROUP BY CAST(strftime('%H', pickup_datetime) AS INTEGER)
ORDER BY hour;

CREATE VIEW IF NOT EXISTS payment_type_analysis AS
SELECT 
    pt.name as payment_type,
    COUNT(*) as trip_count,
    AVG(fare_amount) as avg_fare,
    AVG(tip_amount) as avg_tip,
    AVG(tip_amount / fare_amount * 100) as avg_tip_percentage
FROM trips t
JOIN payment_types pt ON t.payment_type = pt.id
GROUP BY pt.name
ORDER BY trip_count DESC;
