const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');
const path = require('path');

/**
 * Data Cleaner for NYC Taxi Trip Dataset
 * Handles missing values, duplicates, invalid records, and outliers
 * Calculates derived features as required by assignment
 */
class DataCleaner {
    constructor() {
        this.excludedRecords = [];
        this.suspiciousRecords = [];
        this.processedRecords = [];
        
        // NYC bounds for coordinate validation
        this.nycBounds = {
            minLat: 40.4774,  // Staten Island
            maxLat: 40.9176,  // Bronx
            minLon: -74.2591, // New Jersey border
            maxLon: -73.7004  // Queens
        };
    }

    /**
     * Main data cleaning pipeline
     * @param {string} inputFile - Path to input CSV file
     * @param {string} outputFile - Path to output cleaned CSV file
     */
    async cleanData(inputFile, outputFile) {
        console.log('🧹 Starting data cleaning pipeline...');
        console.log(`📁 Input: ${inputFile}`);
        console.log(`📁 Output: ${outputFile}`);

        const rawData = [];
        
        // Read raw data
        await new Promise((resolve, reject) => {
            fs.createReadStream(inputFile)
                .pipe(csv())
                .on('data', (row) => rawData.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Loaded ${rawData.length} raw records`);

        let processedCount = 0;
        let excludedCount = 0;

        // Process each record
        for (let i = 0; i < rawData.length; i++) {
            const record = rawData[i];
            
            try {
                const cleanedRecord = this.cleanRecord(record, i);
                
                if (cleanedRecord) {
                    this.processedRecords.push(cleanedRecord);
                    processedCount++;
                } else {
                    excludedCount++;
                }
            } catch (error) {
                console.warn(`⚠️  Error processing record ${i}: ${error.message}`);
                this.excludedRecords.push({
                    index: i,
                    reason: 'processing_error',
                    error: error.message
                });
                excludedCount++;
            }

            // Progress indicator
            if (i % 10000 === 0) {
                console.log(`🔄 Processed ${i}/${rawData.length} records...`);
            }
        }

        // Write cleaned data
        await this.writeCleanedData(outputFile);

        // Generate summary report
        this.generateSummaryReport(rawData.length, processedCount, excludedCount);

        return {
            totalRecords: rawData.length,
            processedRecords: processedCount,
            excludedRecords: excludedCount,
            exclusionRate: (excludedCount / rawData.length * 100).toFixed(2)
        };
    }

    /**
     * Clean individual record
     * @param {Object} record - Raw record from CSV
     * @param {number} index - Record index
     * @returns {Object|null} - Cleaned record or null if excluded
     */
    cleanRecord(record, index) {
        // 1. Handle missing values
        if (!this.handleMissingValues(record)) {
            this.excludedRecords.push({
                index,
                reason: 'missing_critical_data',
                details: 'Missing pickup/dropoff datetime or coordinates'
            });
            return null;
        }

        // 2. Validate and clean timestamps
        if (!this.validateTimestamps(record)) {
            this.excludedRecords.push({
                index,
                reason: 'invalid_timestamps',
                details: 'Invalid or inconsistent pickup/dropoff times'
            });
            return null;
        }

        // 3. Validate coordinates
        if (!this.validateCoordinates(record)) {
            this.excludedRecords.push({
                index,
                reason: 'invalid_coordinates',
                details: 'Coordinates outside NYC bounds or invalid'
            });
            return null;
        }

        // 4. Validate trip metrics
        if (!this.validateTripMetrics(record)) {
            this.excludedRecords.push({
                index,
                reason: 'invalid_trip_metrics',
                details: 'Invalid passenger count, distance, or duration'
            });
            return null;
        }

        // 5. Validate fare data
        if (!this.validateFareData(record)) {
            this.excludedRecords.push({
                index,
                reason: 'invalid_fare_data',
                details: 'Invalid fare amounts or payment type'
            });
            return null;
        }

        // 6. Calculate derived features (Assignment Requirement)
        this.calculateDerivedFeatures(record);

        // 7. Check for outliers
        if (this.isOutlier(record)) {
            this.excludedRecords.push({
                index,
                reason: 'outlier',
                details: 'Record exceeds reasonable bounds'
            });
            return null;
        }

        return record;
    }

    /**
     * Handle missing values
     * @param {Object} record - Record to clean
     * @returns {boolean} - True if record is valid after cleaning
     */
    handleMissingValues(record) {
        // Critical fields that cannot be missing
        const criticalFields = [
            'pickup_datetime',
            'dropoff_datetime', 
            'pickup_longitude',
            'pickup_latitude',
            'dropoff_longitude',
            'dropoff_latitude'
        ];

        for (const field of criticalFields) {
            if (!record[field] || record[field].trim() === '') {
                return false;
            }
        }

        // Fill missing values for other fields
        record.passenger_count = record.passenger_count || 1;
        record.trip_distance = record.trip_distance || 0;
        record.fare_amount = record.fare_amount || 0;
        record.tip_amount = record.tip_amount || 0;
        record.tolls_amount = record.tolls_amount || 0;
        record.total_amount = record.total_amount || 0;
        record.payment_type = record.payment_type || 1;

        return true;
    }

    /**
     * Validate timestamps
     * @param {Object} record - Record to validate
     * @returns {boolean} - True if timestamps are valid
     */
    validateTimestamps(record) {
        try {
            const pickupTime = moment(record.pickup_datetime);
            const dropoffTime = moment(record.dropoff_datetime);

            // Check if dates are valid
            if (!pickupTime.isValid() || !dropoffTime.isValid()) {
                return false;
            }

            // Check if dropoff is after pickup
            if (dropoffTime.isBefore(pickupTime)) {
                return false;
            }

            // Check if dates are within reasonable range (2015-2020)
            const startDate = moment('2015-01-01');
            const endDate = moment('2020-12-31');
            
            if (pickupTime.isBefore(startDate) || pickupTime.isAfter(endDate)) {
                return false;
            }

            // Calculate trip duration
            record.trip_duration = dropoffTime.diff(pickupTime, 'seconds');

            // Check if duration is reasonable (30 seconds to 24 hours)
            if (record.trip_duration < 30 || record.trip_duration > 86400) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate coordinates
     * @param {Object} record - Record to validate
     * @returns {boolean} - True if coordinates are valid
     */
    validateCoordinates(record) {
        const coords = [
            'pickup_longitude',
            'pickup_latitude',
            'dropoff_longitude',
            'dropoff_latitude'
        ];

        for (const coord of coords) {
            const value = parseFloat(record[coord]);
            if (isNaN(value)) {
                return false;
            }
            record[coord] = value;
        }

        // Check if coordinates are within NYC bounds
        if (record.pickup_latitude < this.nycBounds.minLat || 
            record.pickup_latitude > this.nycBounds.maxLat ||
            record.pickup_longitude < this.nycBounds.minLon || 
            record.pickup_longitude > this.nycBounds.maxLon ||
            record.dropoff_latitude < this.nycBounds.minLat || 
            record.dropoff_latitude > this.nycBounds.maxLat ||
            record.dropoff_longitude < this.nycBounds.minLon || 
            record.dropoff_longitude > this.nycBounds.maxLon) {
            return false;
        }

        return true;
    }

    /**
     * Validate trip metrics
     * @param {Object} record - Record to validate
     * @returns {boolean} - True if metrics are valid
     */
    validateTripMetrics(record) {
        // Passenger count (1-6)
        record.passenger_count = parseInt(record.passenger_count);
        if (record.passenger_count < 1 || record.passenger_count > 6) {
            return false;
        }

        // Trip distance (0-500 miles)
        record.trip_distance = parseFloat(record.trip_distance);
        if (record.trip_distance < 0 || record.trip_distance > 500) {
            return false;
        }

        return true;
    }

    /**
     * Validate fare data
     * @param {Object} record - Record to validate
     * @returns {boolean} - True if fare data is valid
     */
    validateFareData(record) {
        // Fare amounts
        record.fare_amount = parseFloat(record.fare_amount);
        record.tip_amount = parseFloat(record.tip_amount || 0);
        record.tolls_amount = parseFloat(record.tolls_amount || 0);
        record.total_amount = parseFloat(record.total_amount);

        // Check fare amounts are reasonable
        if (record.fare_amount < 0 || record.fare_amount > 1000 ||
            record.tip_amount < 0 || record.tip_amount > 500 ||
            record.tolls_amount < 0 || record.tolls_amount > 100 ||
            record.total_amount < 0 || record.total_amount > 2000) {
            return false;
        }

        // Payment type
        record.payment_type = parseInt(record.payment_type);
        if (record.payment_type < 1 || record.payment_type > 6) {
            return false;
        }

        return true;
    }

    /**
     * Calculate derived features (Assignment Requirement #3)
     * @param {Object} record - Record to enhance
     */
    calculateDerivedFeatures(record) {
        // DERIVED FEATURE 1: Trip Speed (mph)
        // Justification: Identifies traffic patterns, route efficiency, and congestion
        if (record.trip_distance > 0 && record.trip_duration > 0) {
            const durationHours = record.trip_duration / 3600;
            record.trip_speed_mph = record.trip_distance / durationHours;
            
            // Cap unrealistic speeds
            if (record.trip_speed_mph > 100) {
                record.trip_speed_mph = 100;
            }
        } else {
            record.trip_speed_mph = 0;
        }

        // DERIVED FEATURE 2: Fare per Mile ($/mile)
        // Justification: Measures pricing efficiency, identifies premium routes
        if (record.trip_distance > 0) {
            record.fare_per_mile = record.fare_amount / record.trip_distance;
        } else {
            record.fare_per_mile = 0;
        }

        // DERIVED FEATURE 3: Idle Time (minutes)
        // Justification: Estimates time spent in traffic vs moving, congestion indicator
        if (record.trip_distance > 0 && record.trip_duration > 0) {
            // Assume average city speed is 12 mph
            const expectedMovingTime = (record.trip_distance / 12) * 60; // minutes
            const actualTime = record.trip_duration / 60; // minutes
            record.idle_time_minutes = Math.max(0, actualTime - expectedMovingTime);
        } else {
            record.idle_time_minutes = 0;
        }

        // Additional derived feature: Tip Percentage
        if (record.fare_amount > 0) {
            record.tip_percentage = (record.tip_amount / record.fare_amount) * 100;
        } else {
            record.tip_percentage = 0;
        }
    }

    /**
     * Check if record is an outlier
     * @param {Object} record - Record to check
     * @returns {boolean} - True if record is an outlier
     */
    isOutlier(record) {
        // Speed outliers
        if (record.trip_speed_mph > 80) {
            return true;
        }

        // Fare per mile outliers
        if (record.fare_per_mile > 50) {
            return true;
        }

        // Idle time outliers (more than 2 hours of idle time)
        if (record.idle_time_minutes > 120) {
            return true;
        }

        return false;
    }

    /**
     * Write cleaned data to CSV
     * @param {string} outputFile - Output file path
     */
    async writeCleanedData(outputFile) {
        console.log('💾 Writing cleaned data...');
        
        const headers = [
            'pickup_datetime',
            'dropoff_datetime',
            'passenger_count',
            'trip_distance',
            'trip_duration',
            'fare_amount',
            'tip_amount',
            'tolls_amount',
            'total_amount',
            'payment_type',
            'pickup_longitude',
            'pickup_latitude',
            'dropoff_longitude',
            'dropoff_latitude',
            'trip_speed_mph',
            'fare_per_mile',
            'idle_time_minutes',
            'tip_percentage'
        ];

        const csvContent = [
            headers.join(','),
            ...this.processedRecords.map(record => 
                headers.map(header => record[header] || '').join(',')
            )
        ].join('\n');

        fs.writeFileSync(outputFile, csvContent);
        console.log(`✅ Cleaned data written to: ${outputFile}`);
    }

    /**
     * Generate summary report
     * @param {number} totalRecords - Total input records
     * @param {number} processedRecords - Successfully processed records
     * @param {number} excludedRecords - Excluded records
     */
    generateSummaryReport(totalRecords, processedRecords, excludedRecords) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalRecords,
                processedRecords,
                excludedRecords,
                exclusionRate: (excludedRecords / totalRecords * 100).toFixed(2) + '%'
            },
            exclusionReasons: this.getExclusionSummary(),
            derivedFeatures: {
                trip_speed_mph: 'Calculated as distance/duration in mph - identifies traffic patterns',
                fare_per_mile: 'Calculated as fare_amount/distance - measures pricing efficiency',
                idle_time_minutes: 'Estimated time in traffic vs moving - congestion indicator'
            },
            dataQualityMetrics: this.calculateQualityMetrics()
        };

        const reportFile = path.join(path.dirname(outputFile), 'cleaning_report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log('\n📊 DATA CLEANING SUMMARY');
        console.log('========================');
        console.log(`Total Records: ${totalRecords.toLocaleString()}`);
        console.log(`Processed: ${processedRecords.toLocaleString()}`);
        console.log(`Excluded: ${excludedRecords.toLocaleString()}`);
        console.log(`Exclusion Rate: ${report.summary.exclusionRate}`);
        console.log(`📄 Detailed report: ${reportFile}`);
    }

    /**
     * Get summary of exclusion reasons
     * @returns {Object} - Summary of exclusions
     */
    getExclusionSummary() {
        const summary = {};
        this.excludedRecords.forEach(record => {
            summary[record.reason] = (summary[record.reason] || 0) + 1;
        });
        return summary;
    }

    /**
     * Calculate data quality metrics
     * @returns {Object} - Quality metrics
     */
    calculateQualityMetrics() {
        if (this.processedRecords.length === 0) {
            return {};
        }

        const speeds = this.processedRecords.map(r => r.trip_speed_mph).filter(s => s > 0);
        const faresPerMile = this.processedRecords.map(r => r.fare_per_mile).filter(f => f > 0);
        const idleTimes = this.processedRecords.map(r => r.idle_time_minutes).filter(i => i > 0);

        return {
            averageSpeed: speeds.length > 0 ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2) + ' mph' : 'N/A',
            averageFarePerMile: faresPerMile.length > 0 ? '$' + (faresPerMile.reduce((a, b) => a + b, 0) / faresPerMile.length).toFixed(2) : 'N/A',
            averageIdleTime: idleTimes.length > 0 ? (idleTimes.reduce((a, b) => a + b, 0) / idleTimes.length).toFixed(2) + ' minutes' : 'N/A'
        };
    }
}

module.exports = DataCleaner;
