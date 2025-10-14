# NYC Taxi Real Dataset Setup Guide

This guide explains how to process the official NYC Taxi Trip Dataset (`train.zip`) according to the assignment requirements.

## 📋 Assignment Requirements Met

### ✅ 1. Data Processing and Cleaning (Backend)
- **Load raw NYC dataset (CSV)** - Automatically extracts from `train.zip`
- **Handle missing values, duplicates, invalid records, and outliers** - Comprehensive validation pipeline
- **Normalize and format timestamps, coordinates, and numeric fields** - Standardized data format
- **Define and justify at least three derived features**:
  1. **Trip Speed (mph)** - Identifies traffic patterns and route efficiency
  2. **Fare per Mile ($)** - Measures pricing efficiency and premium routes  
  3. **Idle Time (minutes)** - Estimates traffic congestion vs moving time
- **Log excluded or suspicious records for transparency** - Detailed exclusion reports

### ✅ 2. Database Design and Implementation
- **Design normalized relational schema with appropriate indexing** - Optimized for queries
- **Implement the database in SQLite** - Lightweight and efficient
- **Write scripts to insert cleaned and enriched data** - Automated loading pipeline
- **Ensure data integrity and enable efficient queries** - Constraints and indexes

### ✅ 3. Frontend Dashboard Development
- **Build web-based dashboard using HTML, CSS, and JavaScript** - Complete frontend
- **Include filtering and sorting options** - Time, distance, location, fare filtering
- **Enable dynamic interaction with the data** - Real-time charts and insights
- **Present analytical insights using meaningful visualizations** - Chart.js integration

## 🚀 Quick Setup

### Step 1: Download the Dataset
1. Download `train.zip` from the official NYC Taxi Trip Dataset
2. Place it in one of these locations:
   ```
   Team-6_Taxi_App/data/raw/train.zip
   Team-6_Taxi_App/train.zip
   Team-6_Taxi_App/data/train.zip
   ```

### Step 2: Install Dependencies
```bash
cd backend
npm install
```

### Step 3: Process the Real Data
```bash
# Process the official dataset
npm run process-data

# Or run directly
node data_processing/process_real_data.js
```

### Step 4: Start the Dashboard
```bash
# Start the backend server
npm start

# Open your browser to:
# http://localhost:5000
```

## 📊 What Happens During Processing

### 1. Data Extraction
- Automatically finds and extracts `train.zip`
- Locates the CSV file inside the archive
- Extracts to `data/raw/` directory

### 2. Data Cleaning Pipeline
- **Missing Value Handling**: Fills missing non-critical fields, excludes records missing critical data
- **Timestamp Validation**: Ensures pickup < dropoff, validates date ranges (2015-2020)
- **Coordinate Validation**: Checks NYC bounds (40.4774° to 40.9176° lat, -74.2591° to -73.7004° lon)
- **Trip Metrics Validation**: Passenger count (1-6), distance (0-500 miles), duration (30s-24h)
- **Fare Data Validation**: Reasonable fare amounts and payment types
- **Outlier Detection**: Removes unrealistic speeds, fares, and idle times

### 3. Derived Features Calculation
```javascript
// Feature 1: Trip Speed (mph)
trip_speed_mph = trip_distance / (trip_duration / 3600)

// Feature 2: Fare per Mile ($/mile)  
fare_per_mile = fare_amount / trip_distance

// Feature 3: Idle Time (minutes)
// Assumes average city speed of 12 mph
expected_moving_time = (trip_distance / 12) * 60
idle_time_minutes = actual_time - expected_moving_time
```

### 4. Database Loading
- Creates normalized schema with constraints
- Adds comprehensive indexes for performance
- Loads data in batches for efficiency
- Verifies data integrity
- Creates analytical views

## 📈 Expected Results

### Data Quality Metrics
- **Success Rate**: Typically 85-95% of records pass cleaning
- **Exclusion Reasons**:
  - Invalid coordinates (outside NYC)
  - Invalid timestamps (pickup > dropoff)
  - Missing critical data
  - Unrealistic trip metrics
  - Outlier detection

### Derived Features Insights
- **Average Trip Speed**: 12-15 mph (typical city driving)
- **Average Fare per Mile**: $2-4 (varies by route and time)
- **Average Idle Time**: 5-15 minutes (traffic congestion)

### Database Performance
- **Indexed Queries**: Sub-second response times
- **Batch Loading**: 1000 records per batch
- **Analytical Views**: Pre-computed summaries for dashboard

## 🔍 Verification

### Check Processing Results
```bash
# View cleaning report
cat backend/data_processing/cleaning_report.json

# Check database records
sqlite3 backend/taxi_data.db "SELECT COUNT(*) FROM trips;"

# View derived features summary
sqlite3 backend/taxi_data.db "SELECT AVG(trip_speed_mph), AVG(fare_per_mile), AVG(idle_time_minutes) FROM trips;"
```

### Dashboard Verification
1. Open http://localhost:5000
2. Check that data loads from API (not sample data)
3. Verify filtering and sorting work
4. Confirm charts show real data patterns
5. Test all interactive features

## 📁 File Structure After Processing

```
Team-6_Taxi_App/
├── data/
│   ├── raw/
│   │   ├── train.zip          # Original dataset
│   │   └── train.csv          # Extracted CSV
│   └── processed/
│       ├── cleaned_taxi_data.csv      # Cleaned data
│       └── cleaning_report.json       # Processing report
├── backend/
│   ├── taxi_data.db           # SQLite database with real data
│   └── data_processing/
│       ├── data_cleaner.js    # Cleaning pipeline
│       ├── database_loader.js # Database loading
│       └── process_real_data.js # Main processor
└── index.html                 # Dashboard (unchanged)
```

## 🎯 Assignment Compliance Summary

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Load raw NYC dataset | ✅ | Automatic extraction from train.zip |
| Handle missing values | ✅ | Comprehensive validation pipeline |
| Handle duplicates/invalid records | ✅ | Database constraints + validation |
| Handle outliers | ✅ | Statistical outlier detection |
| Normalize timestamps | ✅ | Moment.js standardization |
| Normalize coordinates | ✅ | NYC bounds validation |
| Normalize numeric fields | ✅ | Type conversion + validation |
| Define 3 derived features | ✅ | Speed, fare/mile, idle time |
| Justify derived features | ✅ | Documented business logic |
| Log excluded records | ✅ | Detailed JSON reports |
| Normalized schema | ✅ | Relational design with constraints |
| Appropriate indexing | ✅ | 10+ indexes for performance |
| SQLite implementation | ✅ | Production-ready database |
| Data integrity scripts | ✅ | Automated loading pipeline |
| Efficient queries | ✅ | Optimized for dashboard needs |
| HTML/CSS/JS dashboard | ✅ | Interactive frontend |
| Filtering/sorting | ✅ | Multi-dimensional filters |
| Dynamic interaction | ✅ | Real-time charts |
| Meaningful visualizations | ✅ | Chart.js integration |

## 🚨 Troubleshooting

### Common Issues

1. **"train.zip not found"**
   - Ensure train.zip is in the correct location
   - Check file permissions

2. **"No CSV file found in train.zip"**
   - Verify train.zip contains a CSV file
   - Check if file is corrupted

3. **"Database locked"**
   - Stop the server: `Ctrl+C`
   - Delete `backend/taxi_data.db`
   - Re-run processing

4. **"Out of memory"**
   - Process in smaller batches
   - Increase Node.js memory: `node --max-old-space-size=4096`

5. **"CORS errors"**
   - Ensure server is running on port 5000
   - Check browser console for errors

### Performance Tips

- **Large datasets**: Processing may take 10-30 minutes
- **Memory usage**: Requires 2-4GB RAM for large datasets
- **Storage**: Cleaned data is ~60% of original size

## 📞 Support

If you encounter issues:
1. Check the cleaning report for detailed error information
2. Verify all dependencies are installed
3. Ensure sufficient disk space and memory
4. Review the console output for specific error messages

The system is designed to handle the full NYC taxi dataset while maintaining performance and data quality.
