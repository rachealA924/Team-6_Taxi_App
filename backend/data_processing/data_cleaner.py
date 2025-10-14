import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import os
from typing import Tuple, Dict, List

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataCleaner:
    """Handles data cleaning and preprocessing for NYC taxi data"""
    
    def __init__(self):
        self.excluded_records = []
        self.suspicious_records = []
        
    def load_data(self, file_path: str) -> pd.DataFrame:
        """Load raw CSV data"""
        try:
            logger.info(f"Loading data from {file_path}")
            
            # Define column names based on NYC taxi dataset format
            columns = [
                'vendor_id', 'pickup_datetime', 'dropoff_datetime',
                'passenger_count', 'trip_distance', 'pickup_longitude',
                'pickup_latitude', 'rate_code_id', 'store_and_fwd_flag',
                'dropoff_longitude', 'dropoff_latitude', 'payment_type',
                'fare_amount', 'extra', 'mta_tax', 'tip_amount',
                'tolls_amount', 'improvement_surcharge', 'total_amount'
            ]
            
            df = pd.read_csv(file_path, names=columns, low_memory=False)
            logger.info(f"Loaded {len(df)} records")
            return df
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Main data cleaning pipeline"""
        logger.info("Starting data cleaning process")
        
        initial_count = len(df)
        
        # 1. Handle missing values
        df = self._handle_missing_values(df)
        
        # 2. Remove duplicates
        df = self._remove_duplicates(df)
        
        # 3. Validate and clean timestamps
        df = self._clean_timestamps(df)
        
        # 4. Validate and clean coordinates
        df = self._clean_coordinates(df)
        
        # 5. Validate trip metrics
        df = self._validate_trip_metrics(df)
        
        # 6. Validate fare data
        df = self._validate_fare_data(df)
        
        # 7. Calculate derived features
        df = self._calculate_derived_features(df)
        
        # 8. Remove outliers
        df = self._remove_outliers(df)
        
        final_count = len(df)
        excluded_count = initial_count - final_count
        
        logger.info(f"Data cleaning complete. Excluded {excluded_count} records ({excluded_count/initial_count*100:.2f}%)")
        logger.info(f"Final dataset: {final_count} records")
        
        return df
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset"""
        logger.info("Handling missing values")
        
        # Remove rows with missing critical data
        critical_columns = ['pickup_datetime', 'dropoff_datetime', 'pickup_longitude', 
                          'pickup_latitude', 'dropoff_longitude', 'dropoff_latitude']
        
        missing_critical = df[critical_columns].isnull().any(axis=1)
        excluded_count = missing_critical.sum()
        
        if excluded_count > 0:
            self.excluded_records.extend([
                {'reason': 'missing_critical_data', 'count': excluded_count}
            ])
            logger.info(f"Excluding {excluded_count} records with missing critical data")
        
        df = df.dropna(subset=critical_columns)
        
        # Fill missing values for other columns
        df['passenger_count'] = df['passenger_count'].fillna(1)
        df['trip_distance'] = df['trip_distance'].fillna(0)
        df['fare_amount'] = df['fare_amount'].fillna(0)
        df['tip_amount'] = df['tip_amount'].fillna(0)
        df['tolls_amount'] = df['tolls_amount'].fillna(0)
        df['total_amount'] = df['total_amount'].fillna(0)
        df['payment_type'] = df['payment_type'].fillna(1)  # Default to credit card
        
        return df
    
    def _remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove duplicate records"""
        logger.info("Removing duplicate records")
        
        initial_count = len(df)
        
        # Remove exact duplicates
        df = df.drop_duplicates()
        
        # Remove trips with same pickup/dropoff time and location (likely duplicates)
        df = df.drop_duplicates(subset=['pickup_datetime', 'dropoff_datetime', 
                                       'pickup_longitude', 'pickup_latitude',
                                       'dropoff_longitude', 'dropoff_latitude'], keep='first')
        
        duplicate_count = initial_count - len(df)
        
        if duplicate_count > 0:
            self.excluded_records.append({
                'reason': 'duplicate_records', 
                'count': duplicate_count
            })
            logger.info(f"Removed {duplicate_count} duplicate records")
        
        return df
    
    def _clean_timestamps(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate timestamp data"""
        logger.info("Cleaning timestamps")
        
        # Convert to datetime
        df['pickup_datetime'] = pd.to_datetime(df['pickup_datetime'], errors='coerce')
        df['dropoff_datetime'] = pd.to_datetime(df['dropoff_datetime'], errors='coerce')
        
        # Remove invalid timestamps
        invalid_timestamps = df['pickup_datetime'].isnull() | df['dropoff_datetime'].isnull()
        invalid_count = invalid_timestamps.sum()
        
        if invalid_count > 0:
            self.excluded_records.append({
                'reason': 'invalid_timestamps',
                'count': invalid_count
            })
            logger.info(f"Excluding {invalid_count} records with invalid timestamps")
        
        df = df.dropna(subset=['pickup_datetime', 'dropoff_datetime'])
        
        # Remove trips where dropoff is before pickup
        invalid_order = df['dropoff_datetime'] < df['pickup_datetime']
        invalid_order_count = invalid_order.sum()
        
        if invalid_order_count > 0:
            self.excluded_records.append({
                'reason': 'dropoff_before_pickup',
                'count': invalid_order_count
            })
            logger.info(f"Excluding {invalid_order_count} records where dropoff is before pickup")
        
        df = df[df['dropoff_datetime'] >= df['pickup_datetime']]
        
        # Remove trips outside reasonable date range (2015-2020 for this dataset)
        start_date = pd.to_datetime('2015-01-01')
        end_date = pd.to_datetime('2020-12-31')
        
        date_out_of_range = (df['pickup_datetime'] < start_date) | (df['pickup_datetime'] > end_date)
        date_out_count = date_out_of_range.sum()
        
        if date_out_count > 0:
            self.excluded_records.append({
                'reason': 'date_out_of_range',
                'count': date_out_count
            })
            logger.info(f"Excluding {date_out_count} records outside date range")
        
        df = df[~date_out_of_range]
        
        return df
    
    def _clean_coordinates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate coordinate data"""
        logger.info("Cleaning coordinates")
        
        # Convert to numeric
        coord_columns = ['pickup_longitude', 'pickup_latitude', 'dropoff_longitude', 'dropoff_latitude']
        for col in coord_columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Remove records with invalid coordinates
        invalid_coords = df[coord_columns].isnull().any(axis=1)
        invalid_coord_count = invalid_coords.sum()
        
        if invalid_coord_count > 0:
            self.excluded_records.append({
                'reason': 'invalid_coordinates',
                'count': invalid_coord_count
            })
            logger.info(f"Excluding {invalid_coord_count} records with invalid coordinates")
        
        df = df.dropna(subset=coord_columns)
        
        # Remove coordinates outside NYC area (rough bounds)
        nyc_bounds = {
            'min_lat': 40.4774,  # Staten Island
            'max_lat': 40.9176,  # Bronx
            'min_lon': -74.2591, # New Jersey border
            'max_lon': -73.7004  # Queens
        }
        
        outside_nyc = (
            (df['pickup_latitude'] < nyc_bounds['min_lat']) | 
            (df['pickup_latitude'] > nyc_bounds['max_lat']) |
            (df['pickup_longitude'] < nyc_bounds['min_lon']) | 
            (df['pickup_longitude'] > nyc_bounds['max_lon']) |
            (df['dropoff_latitude'] < nyc_bounds['min_lat']) | 
            (df['dropoff_latitude'] > nyc_bounds['max_lat']) |
            (df['dropoff_longitude'] < nyc_bounds['min_lon']) | 
            (df['dropoff_longitude'] > nyc_bounds['max_lon'])
        )
        
        outside_count = outside_nyc.sum()
        
        if outside_count > 0:
            self.excluded_records.append({
                'reason': 'coordinates_outside_nyc',
                'count': outside_count
            })
            logger.info(f"Excluding {outside_count} records with coordinates outside NYC")
        
        df = df[~outside_nyc]
        
        return df
    
    def _validate_trip_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate trip distance, duration, and passenger count"""
        logger.info("Validating trip metrics")
        
        # Validate passenger count (1-6 passengers)
        invalid_passengers = (df['passenger_count'] < 1) | (df['passenger_count'] > 6)
        invalid_passenger_count = invalid_passengers.sum()
        
        if invalid_passenger_count > 0:
            self.excluded_records.append({
                'reason': 'invalid_passenger_count',
                'count': invalid_passenger_count
            })
            logger.info(f"Excluding {invalid_passenger_count} records with invalid passenger count")
        
        df = df[~invalid_passengers]
        
        # Validate trip distance (0-500 miles)
        invalid_distance = (df['trip_distance'] < 0) | (df['trip_distance'] > 500)
        invalid_distance_count = invalid_distance.sum()
        
        if invalid_distance_count > 0:
            self.excluded_records.append({
                'reason': 'invalid_trip_distance',
                'count': invalid_distance_count
            })
            logger.info(f"Excluding {invalid_distance_count} records with invalid trip distance")
        
        df = df[~invalid_distance]
        
        # Flag suspicious records for analysis
        suspicious_distance = (df['trip_distance'] == 0) & (df['fare_amount'] > 0)
        suspicious_count = suspicious_distance.sum()
        
        if suspicious_count > 0:
            self.suspicious_records.append({
                'reason': 'zero_distance_nonzero_fare',
                'count': suspicious_count
            })
            logger.info(f"Flagged {suspicious_count} suspicious records with zero distance but nonzero fare")
        
        return df
    
    def _validate_fare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate fare and payment data"""
        logger.info("Validating fare data")
        
        # Validate fare amount (0-1000)
        invalid_fare = (df['fare_amount'] < 0) | (df['fare_amount'] > 1000)
        invalid_fare_count = invalid_fare.sum()
        
        if invalid_fare_count > 0:
            self.excluded_records.append({
                'reason': 'invalid_fare_amount',
                'count': invalid_fare_count
            })
            logger.info(f"Excluding {invalid_fare_count} records with invalid fare amount")
        
        df = df[~invalid_fare]
        
        # Validate tip amount (0-500)
        invalid_tip = (df['tip_amount'] < 0) | (df['tip_amount'] > 500)
        invalid_tip_count = invalid_tip.sum()
        
        if invalid_tip_count > 0:
            self.excluded_records.append({
                'reason': 'invalid_tip_amount',
                'count': invalid_tip_count
            })
            logger.info(f"Excluding {invalid_tip_count} records with invalid tip amount")
        
        df = df[~invalid_tip]
        
        # Validate total amount
        invalid_total = (df['total_amount'] < 0) | (df['total_amount'] > 2000)
        invalid_total_count = invalid_total.sum()
        
        if invalid_total_count > 0:
            self.excluded_records.append({
                'reason': 'invalid_total_amount',
                'count': invalid_total_count
            })
            logger.info(f"Excluding {invalid_total_count} records with invalid total amount")
        
        df = df[~invalid_total]
        
        return df
    
    def _calculate_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate derived features"""
        logger.info("Calculating derived features")
        
        # Calculate trip duration in seconds
        df['trip_duration'] = (df['dropoff_datetime'] - df['pickup_datetime']).dt.total_seconds()
        
        # Calculate trip speed (mph) - Feature 1
        df['trip_speed_mph'] = np.where(
            df['trip_duration'] > 0,
            (df['trip_distance'] / (df['trip_duration'] / 3600)).replace([np.inf, -np.inf], np.nan),
            np.nan
        )
        
        # Calculate fare per mile - Feature 2
        df['fare_per_mile'] = np.where(
            df['trip_distance'] > 0,
            df['fare_amount'] / df['trip_distance'],
            np.nan
        )
        
        # Calculate idle time estimate - Feature 3
        # Assume average city speed is 12 mph, any time beyond that is idle
        df['idle_time_minutes'] = np.where(
            df['trip_distance'] > 0,
            np.maximum(0, (df['trip_duration'] / 60) - (df['trip_distance'] / 12 * 60)),
            np.nan
        )
        
        logger.info("Derived features calculated:")
        logger.info(f"- Trip speed: {df['trip_speed_mph'].notna().sum()} valid calculations")
        logger.info(f"- Fare per mile: {df['fare_per_mile'].notna().sum()} valid calculations")
        logger.info(f"- Idle time: {df['idle_time_minutes'].notna().sum()} valid calculations")
        
        return df
    
    def _remove_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove statistical outliers"""
        logger.info("Removing outliers")
        
        initial_count = len(df)
        
        # Remove trips with unrealistic duration (< 30 seconds or > 24 hours)
        duration_outliers = (df['trip_duration'] < 30) | (df['trip_duration'] > 86400)
        duration_outlier_count = duration_outliers.sum()
        
        if duration_outlier_count > 0:
            self.excluded_records.append({
                'reason': 'duration_outliers',
                'count': duration_outlier_count
            })
            logger.info(f"Excluding {duration_outlier_count} duration outliers")
        
        df = df[~duration_outliers]
        
        # Remove trips with unrealistic speed (> 100 mph or < 0.1 mph for moving trips)
        speed_outliers = (
            (df['trip_speed_mph'] > 100) | 
            ((df['trip_speed_mph'] < 0.1) & (df['trip_distance'] > 0.1))
        )
        speed_outlier_count = speed_outliers.sum()
        
        if speed_outlier_count > 0:
            self.excluded_records.append({
                'reason': 'speed_outliers',
                'count': speed_outlier_count
            })
            logger.info(f"Excluding {speed_outlier_count} speed outliers")
        
        df = df[~speed_outliers]
        
        # Remove trips with unrealistic fare per mile (> $50/mile)
        fare_per_mile_outliers = df['fare_per_mile'] > 50
        fare_outlier_count = fare_per_mile_outliers.sum()
        
        if fare_outlier_count > 0:
            self.excluded_records.append({
                'reason': 'fare_per_mile_outliers',
                'count': fare_outlier_count
            })
            logger.info(f"Excluding {fare_outlier_count} fare per mile outliers")
        
        df = df[~fare_per_mile_outliers]
        
        final_count = len(df)
        outlier_count = initial_count - final_count
        
        logger.info(f"Outlier removal complete. Excluded {outlier_count} outliers")
        
        return df
    
    def get_cleaning_summary(self) -> Dict:
        """Get summary of data cleaning process"""
        total_excluded = sum(record['count'] for record in self.excluded_records)
        total_suspicious = sum(record['count'] for record in self.suspicious_records)
        
        return {
            'excluded_records': self.excluded_records,
            'suspicious_records': self.suspicious_records,
            'total_excluded': total_excluded,
            'total_suspicious': total_suspicious
        }
    
    def save_cleaning_log(self, output_path: str):
        """Save cleaning log to file"""
        import json
        
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'summary': self.get_cleaning_summary()
        }
        
        with open(output_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        logger.info(f"Cleaning log saved to {output_path}")


