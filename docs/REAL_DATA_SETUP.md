# Real NYC Taxi Dataset Setup Guide

This guide explains how to use your official NYC Taxi Trip Dataset (train.zip) with the analytics dashboard.

## 📁 File Placement

Place your dataset files in the following locations:

```
Team-6_Taxi_App/
├── data/
│   ├── raw/                      # ← Place your files here
│   │   ├── train.zip            # ← Official NYC Taxi Dataset
│   │   ├── train.csv            # ← Extracted CSV (auto-generated)
│   │   └── taxi+_zone_lookup.csv # ← Optional: Zone lookup table
│   └── processed/               # ← Cleaned data (auto-generated)
│       ├── cleaned_trips.csv
│       └── cleaning_summary.json
```

## 🚀 Quick Setup

### Option 1: Complete Setup with Real Data
```bash
# 1. Place your train.zip file in data/raw/
cp /path/to/your/train.zip /Users/owner/Team-6_Taxi_App/data/raw/

# 2. Run complete setup
cd /Users/owner/Team-6_Taxi_App
python setup.py full-real

# 3. Start the application
python setup.py start
```

### Option 2: Step-by-Step Setup
```bash
# 1. Set up environment
python setup.py env

# 2. Set up database
python setup.py db

# 3. Place your dataset
cp /path/to/your/train.zip data/raw/

# 4. Process real data
python setup.py real-data

# 5. Start application
python setup.py start
```

## 📊 Dataset Information

The official NYC Taxi Trip Dataset contains:

- **Pickup and drop-off timestamps**: Trip start/end times
- **Pickup and drop-off coordinates**: Longitude/latitude pairs
- **Trip duration and distance**: Time and distance metrics
- **Fare amount and tip**: Payment information
- **Passenger and payment metadata**: Additional trip details

### Expected Columns:
- `vendor_id`: Taxi vendor identifier
- `pickup_datetime`: Trip start time
- `dropoff_datetime`: Trip end time
- `passenger_count`: Number of passengers
- `trip_distance`: Distance in miles
- `pickup_longitude`: Pickup longitude
- `pickup_latitude`: Pickup latitude
- `rate_code_id`: Rate code
- `store_and_fwd_flag`: Store and forward flag
- `dropoff_longitude`: Dropoff longitude
- `dropoff_latitude`: Dropoff latitude
- `payment_type`: Payment method (1=Credit, 2=Cash, etc.)
- `fare_amount`: Base fare amount
- `extra`: Extra charges
- `mta_tax`: MTA tax
- `tip_amount`: Tip amount
- `tolls_amount`: Tolls
- `improvement_surcharge`: Improvement surcharge
- `total_amount`: Total fare amount

## 🔧 Data Processing Features

The processing pipeline will:

1. **Extract Data**: Automatically unzip train.zip if needed
2. **Clean Data**: Remove invalid records, handle missing values
3. **Calculate Derived Features**:
   - **Trip Speed (mph)**: `distance / (duration_in_hours)`
   - **Fare per Mile**: `fare_amount / trip_distance`
   - **Idle Time**: Estimated time in traffic vs. moving
4. **Validate Data**: Check for outliers and suspicious records
5. **Load to Database**: Insert cleaned data with proper indexing
6. **Generate Reports**: Create processing logs and summaries

## 📈 What You'll Get

After processing, your dashboard will show:

- **Real trip patterns** from NYC taxi data
- **Actual fare and tip analysis**
- **Geographic distribution** of trips
- **Time-based patterns** (hourly, daily, seasonal)
- **Speed and efficiency analysis**
- **Payment method insights**
- **Revenue and economic patterns**

## 🎯 Dashboard Insights

The processed data will enable insights like:

- Peak hours and rush patterns
- Popular pickup/dropoff locations
- Fare efficiency by distance and time
- Traffic patterns and speed analysis
- Payment preferences and tipping behavior
- Cross-borough travel patterns
- Revenue optimization opportunities

## 🛠️ Troubleshooting

### Dataset Not Found
```
Error: No dataset found! Please place train.zip or train.csv in data/raw/
```
**Solution**: Make sure your train.zip file is in the `data/raw/` directory.

### Memory Issues
If processing fails due to memory:
- The system processes data in batches (1000 records at a time)
- For very large datasets, consider using a smaller sample first
- Ensure you have sufficient RAM (8GB+ recommended)

### Database Errors
If database operations fail:
- Check that the database is properly set up: `python setup.py db`
- Verify database permissions and connectivity
- Check the database URL in your `.env` file

## 📝 Processing Logs

The system generates detailed logs:

- **Cleaning Summary**: Statistics on data quality
- **Excluded Records**: Count and reasons for excluded data
- **Processing Time**: Performance metrics
- **Error Logs**: Detailed error information

Check `data/processed/cleaning_summary.json` for detailed processing statistics.

## 🚀 Next Steps

After successful processing:

1. **Start the Dashboard**: `python setup.py start`
2. **Open Frontend**: Open `frontend/index.html` in your browser
3. **Explore Insights**: Navigate through different dashboard sections
4. **Analyze Patterns**: Use the interactive charts and maps
5. **Export Data**: Use the dashboard's export features if needed

## 📞 Support

If you encounter issues:

1. Check the processing logs in `data/processed/`
2. Verify your dataset format matches the expected structure
3. Ensure all dependencies are installed: `python setup.py env`
4. Check database connectivity and permissions

The system is designed to handle the official NYC Taxi Dataset format automatically!

