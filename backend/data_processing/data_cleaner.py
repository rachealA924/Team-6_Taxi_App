import pandas as pd
import numpy as np
from datetime import datetime
import logging

class DataCleaner:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def clean_data(self, df):
        """Clean the raw taxi data"""
        original_count = len(df)
        self.logger.info(f"Starting data cleaning with {original_count} records")
        
        # Remove duplicates
        df = df.drop_duplicates()
        self.logger.info(f"Removed duplicates: {original_count - len(df)} records")
        
        # Handle missing values
        df = self.handle_missing_values(df)
        
        # Validate timestamps
        df = self.validate_timestamps(df)
        
        # Validate coordinates
        df = self.validate_coordinates(df)
        
        # Validate trip metrics
        df = self.validate_trip_metrics(df)
        
        # Calculate derived features
        df = self.calculate_derived_features(df)
        
        # Remove outliers
        df = self.remove_outliers(df)
        
        final_count = len(df)
        self.logger.info(f"Data cleaning complete: {final_count} records ({final_count/original_count*100:.1f}% retained)")
        
        return df
    
    def handle_missing_values(self, df):
        """Handle missing values in the dataset"""
        # Drop rows with missing critical data
        critical_columns = ['pickup_datetime', 'dropoff_datetime', 
                          'pickup_longitude', 'pickup_latitude',
                          'dropoff_longitude', 'dropoff_latitude']
        
        df = df.dropna(subset=critical_columns)
        
        # Fill missing values for other columns
        df['passenger_count'] = df['passenger_count'].fillna(1)
        df['trip_distance'] = df['trip_distance'].fillna(0)
        df['fare_amount'] = df['fare_amount'].fillna(0)
        df['tip_amount'] = df['tip_amount'].fillna(0)
        df['tolls_amount'] = df['tolls_amount'].fillna(0)
        df['total_amount'] = df['total_amount'].fillna(0)
        df['payment_type'] = df['payment_type'].fillna(1)
        
        return df
    
    def validate_timestamps(self, df):
        """Validate and clean timestamp data"""
        # Convert to datetime
        df['pickup_datetime'] = pd.to_datetime(df['pickup_datetime'], errors='coerce')
        df['dropoff_datetime'] = pd.to_datetime(df['dropoff_datetime'], errors='coerce')
        
        # Remove rows with invalid timestamps
        df = df.dropna(subset=['pickup_datetime', 'dropoff_datetime'])
        
        # Remove rows where dropoff is before pickup
        df = df[df['dropoff_datetime'] > df['pickup_datetime']]
        
        # Calculate trip duration
        df['trip_duration'] = (df['dropoff_datetime'] - df['pickup_datetime']).dt.total_seconds()
        
        # Remove trips that are too short (< 30 seconds) or too long (> 24 hours)
        df = df[(df['trip_duration'] >= 30) & (df['trip_duration'] <= 86400)]
        
        return df
    
    def validate_coordinates(self, df):
        """Validate coordinate data"""
        # NYC bounds
        nyc_bounds = {
            'min_lat': 40.4774,  # Staten Island
            'max_lat': 40.9176,  # Bronx
            'min_lon': -74.2591, # New Jersey border
            'max_lon': -73.7004  # Queens
        }
        
        # Filter coordinates within NYC bounds
        df = df[
            (df['pickup_latitude'] >= nyc_bounds['min_lat']) &
            (df['pickup_latitude'] <= nyc_bounds['max_lat']) &
            (df['pickup_longitude'] >= nyc_bounds['min_lon']) &
            (df['pickup_longitude'] <= nyc_bounds['max_lon']) &
            (df['dropoff_latitude'] >= nyc_bounds['min_lat']) &
            (df['dropoff_latitude'] <= nyc_bounds['max_lat']) &
            (df['dropoff_longitude'] >= nyc_bounds['min_lon']) &
            (df['dropoff_longitude'] <= nyc_bounds['max_lon'])
        ]
        
        return df
    
    def validate_trip_metrics(self, df):
        """Validate trip metrics"""
        # Passenger count (1-6)
        df = df[(df['passenger_count'] >= 1) & (df['passenger_count'] <= 6)]
        
        # Trip distance (0-500 miles)
        df = df[(df['trip_distance'] >= 0) & (df['trip_distance'] <= 500)]
        
        # Fare amounts (reasonable ranges)
        df = df[
            (df['fare_amount'] >= 0) & (df['fare_amount'] <= 1000) &
            (df['tip_amount'] >= 0) & (df['tip_amount'] <= 500) &
            (df['tolls_amount'] >= 0) & (df['tolls_amount'] <= 100) &
            (df['total_amount'] >= 0) & (df['total_amount'] <= 2000)
        ]
        
        # Payment type (1-6)
        df = df[(df['payment_type'] >= 1) & (df['payment_type'] <= 6)]
        
        return df
    
    def calculate_derived_features(self, df):
        """Calculate derived features"""
        # Trip speed (mph)
        df['trip_speed_mph'] = df['trip_distance'] / (df['trip_duration'] / 3600)
        df['trip_speed_mph'] = df['trip_speed_mph'].clip(upper=100)  # Cap at 100 mph
        
        # Fare per mile
        df['fare_per_mile'] = df['fare_amount'] / df['trip_distance']
        df['fare_per_mile'] = df['fare_per_mile'].fillna(0)
        
        # Idle time (estimated time spent in traffic)
        # Assume average city speed is 12 mph
        expected_moving_time = (df['trip_distance'] / 12) * 60  # minutes
        actual_time = df['trip_duration'] / 60  # minutes
        df['idle_time_minutes'] = np.maximum(0, actual_time - expected_moving_time)
        
        return df
    
    def remove_outliers(self, df):
        """Remove statistical outliers"""
        # Remove trips with unrealistic speeds
        df = df[df['trip_speed_mph'] <= 80]
        
        # Remove trips with unrealistic fare per mile
        df = df[df['fare_per_mile'] <= 50]
        
        # Remove trips with excessive idle time
        df = df[df['idle_time_minutes'] <= 120]
        
        return df
