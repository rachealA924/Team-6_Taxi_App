#!/usr/bin/env python3
"""
Data processing script for NYC Taxi Analytics Dashboard
Downloads, cleans, and loads taxi trip data into the database
"""

import os
import sys
import logging
import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import requests
import zipfile
from pathlib import Path

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_cleaner import DataCleaner
from models.trip import Trip, db
from models.zone import Zone
from app import app

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataProcessor:
    """Main data processing class"""
    
    def __init__(self):
        self.cleaner = DataCleaner()
        self.data_dir = Path(__file__).parent.parent.parent / 'data'
        self.data_dir.mkdir(exist_ok=True)
        
    def download_sample_data(self):
        """Download a sample of NYC taxi data for demonstration"""
        logger.info("Downloading sample taxi data...")
        
        # For this demo, we'll create a sample dataset
        # In a real implementation, you would download the actual dataset
        sample_data_path = self.data_dir / 'sample_taxi_data.csv'
        
        if not sample_data_path.exists():
            logger.info("Creating sample dataset...")
            
            # Generate sample data based on NYC taxi patterns
            np.random.seed(42)  # For reproducible results
            
            n_trips = 10000  # Sample size
            
            # Generate timestamps (January 2019)
            start_date = pd.to_datetime('2019-01-01')
            end_date = pd.to_datetime('2019-01-31')
            pickup_times = pd.date_range(start_date, end_date, freq='30S').tolist()
            pickup_times = np.random.choice(pickup_times, n_trips, replace=True)
            
            # Generate trip durations (5-60 minutes)
            durations_minutes = np.random.lognormal(2.5, 0.8, n_trips)
            durations_minutes = np.clip(durations_minutes, 2, 120)
            
            # Generate distances (0.1-50 miles)
            distances = np.random.lognormal(1.2, 1.0, n_trips)
            distances = np.clip(distances, 0.1, 50)
            
            # NYC coordinates (rough bounds)
            pickup_lats = np.random.uniform(40.4774, 40.9176, n_trips)
            pickup_lons = np.random.uniform(-74.2591, -73.7004, n_trips)
            
            # Add some randomness to dropoff coordinates
            dropoff_lats = pickup_lats + np.random.normal(0, 0.01, n_trips)
            dropoff_lons = pickup_lons + np.random.normal(0, 0.01, n_trips)
            
            # Clamp to NYC bounds
            dropoff_lats = np.clip(dropoff_lats, 40.4774, 40.9176)
            dropoff_lons = np.clip(dropoff_lons, -74.2591, -73.7004)
            
            # Generate fares (base fare + distance + time)
            base_fare = 2.50
            distance_fare = distances * 2.50
            time_fare = durations_minutes * 0.50
            fare_amount = base_fare + distance_fare + time_fare + np.random.normal(0, 2, n_trips)
            fare_amount = np.maximum(fare_amount, 2.50)  # Minimum fare
            
            # Generate tips (higher for credit card payments)
            payment_types = np.random.choice([1, 2], n_trips, p=[0.7, 0.3])  # 70% credit, 30% cash
            tip_amount = np.where(
                payment_types == 1,  # Credit card
                np.random.exponential(2, n_trips),
                np.random.exponential(0.5, n_trips)  # Cash
            )
            tip_amount = np.clip(tip_amount, 0, 50)
            
            # Generate other amounts
            tolls_amount = np.random.choice([0, 5.50, 8.00], n_trips, p=[0.8, 0.15, 0.05])
            extra = np.random.choice([0, 1.00], n_trips, p=[0.95, 0.05])  # Night surcharge
            mta_tax = np.random.choice([0, 0.50], n_trips, p=[0.3, 0.7])
            improvement_surcharge = np.full(n_trips, 0.30)
            
            # Calculate total amount
            total_amount = fare_amount + tip_amount + tolls_amount + extra + mta_tax + improvement_surcharge
            
            # Generate other fields
            passenger_count = np.random.choice([1, 2, 3, 4, 5, 6], n_trips, p=[0.6, 0.2, 0.1, 0.05, 0.03, 0.02])
            vendor_ids = np.random.choice(['VTS', 'CMT'], n_trips, p=[0.6, 0.4])
            store_and_fwd_flags = np.random.choice(['Y', 'N'], n_trips, p=[0.05, 0.95])
            
            # Create DataFrame
            sample_data = pd.DataFrame({
                'vendor_id': vendor_ids,
                'pickup_datetime': pickup_times,
                'dropoff_datetime': pickup_times + pd.to_timedelta(durations_minutes, unit='min'),
                'passenger_count': passenger_count,
                'trip_distance': distances,
                'pickup_longitude': pickup_lons,
                'pickup_latitude': pickup_lats,
                'rate_code_id': 1,  # Standard rate
                'store_and_fwd_flag': store_and_fwd_flags,
                'dropoff_longitude': dropoff_lons,
                'dropoff_latitude': dropoff_lats,
                'payment_type': payment_types,
                'fare_amount': fare_amount,
                'extra': extra,
                'mta_tax': mta_tax,
                'tip_amount': tip_amount,
                'tolls_amount': tolls_amount,
                'improvement_surcharge': improvement_surcharge,
                'total_amount': total_amount
            })
            
            # Save sample data
            sample_data.to_csv(sample_data_path, index=False)
            logger.info(f"Sample data created: {sample_data_path}")
            
        return sample_data_path
    
    def process_data(self, file_path):
        """Process the taxi data file"""
        logger.info(f"Processing data from: {file_path}")
        
        # Load and clean data
        raw_data = self.cleaner.load_data(file_path)
        cleaned_data = self.cleaner.clean_data(raw_data)
        
        # Log cleaning summary
        cleaning_summary = self.cleaner.get_cleaning_summary()
        logger.info(f"Data cleaning summary: {cleaning_summary}")
        
        # Save cleaning log
        log_path = self.data_dir / 'cleaning_log.json'
        self.cleaner.save_cleaning_log(str(log_path))
        
        return cleaned_data
    
    def load_to_database(self, data):
        """Load cleaned data into the database"""
        logger.info("Loading data into database...")
        
        with app.app_context():
            # Create tables
            db.create_all()
            
            # Load data in batches
            batch_size = 1000
            total_rows = len(data)
            
            for i in range(0, total_rows, batch_size):
                batch = data.iloc[i:i+batch_size]
                
                # Convert batch to trip objects
                trips = []
                for _, row in batch.iterrows():
                    try:
                        # Map location IDs (simplified - in reality you'd use actual zone lookup)
                        pickup_location_id = self.get_location_id(row['pickup_latitude'], row['pickup_longitude'])
                        dropoff_location_id = self.get_location_id(row['dropoff_latitude'], row['dropoff_longitude'])
                        
                        trip = Trip(
                            pickup_datetime=row['pickup_datetime'],
                            dropoff_datetime=row['dropoff_datetime'],
                            pickup_location_id=pickup_location_id,
                            dropoff_location_id=dropoff_location_id,
                            pickup_longitude=row['pickup_longitude'],
                            pickup_latitude=row['pickup_latitude'],
                            dropoff_longitude=row['dropoff_longitude'],
                            dropoff_latitude=row['dropoff_latitude'],
                            passenger_count=int(row['passenger_count']),
                            trip_distance=row['trip_distance'],
                            trip_duration=row['trip_duration'],
                            fare_amount=row['fare_amount'],
                            tip_amount=row['tip_amount'],
                            tolls_amount=row['tolls_amount'],
                            total_amount=row['total_amount'],
                            payment_type=int(row['payment_type']),
                            trip_speed_mph=row.get('trip_speed_mph'),
                            fare_per_mile=row.get('fare_per_mile'),
                            idle_time_minutes=row.get('idle_time_minutes'),
                            vendor_id=row.get('vendor_id'),
                            store_and_fwd_flag=row.get('store_and_fwd_flag')
                        )
                        trips.append(trip)
                        
                    except Exception as e:
                        logger.warning(f"Error processing row {i}: {e}")
                        continue
                
                # Bulk insert
                try:
                    db.session.bulk_save_objects(trips)
                    db.session.commit()
                    logger.info(f"Loaded batch {i//batch_size + 1}/{(total_rows + batch_size - 1)//batch_size}")
                except Exception as e:
                    logger.error(f"Error loading batch: {e}")
                    db.session.rollback()
                    continue
            
            logger.info(f"Successfully loaded {total_rows} trips into database")
    
    def get_location_id(self, lat, lon):
        """Get location ID based on coordinates (simplified)"""
        # This is a simplified mapping - in reality you'd use proper geospatial lookup
        # For now, return a random location ID from our predefined zones
        
        # Manhattan
        if 40.7000 <= lat <= 40.8000 and -74.0500 <= lon <= -73.9000:
            return np.random.choice([4, 12, 13, 24, 25, 41, 42, 43, 67, 91, 96, 102, 103, 131, 132, 133, 134, 135, 139, 149, 152, 153, 154, 155, 157, 177, 200, 202, 215, 221, 222, 223, 224, 225, 227, 228, 229, 230, 240])
        
        # Brooklyn
        elif 40.5700 <= lat <= 40.7000 and -74.0500 <= lon <= -73.8000:
            return np.random.choice([11, 14, 21, 22, 25, 26, 29, 33, 34, 35, 36, 37, 40, 49, 51, 54, 60, 61, 62, 64, 65, 66, 75, 76, 81, 83, 88, 95, 97, 100, 101, 112, 122, 127, 140, 141, 145, 146, 156, 172, 179, 180, 181, 186, 208, 213, 216, 218, 219, 246, 247, 248, 249])
        
        # Queens
        elif 40.5400 <= lat <= 40.8000 and -74.0500 <= lon <= -73.7000:
            return np.random.choice([2, 7, 8, 9, 10, 15, 16, 27, 28, 30, 52, 55, 56, 63, 69, 72, 84, 85, 86, 87, 89, 92, 93, 106, 110, 111, 118, 119, 120, 121, 123, 124, 128, 129, 130, 136, 137, 148, 151, 161, 162, 164, 166, 170, 171, 182, 183, 184, 187, 188, 189, 194, 196, 198, 206, 207, 209, 210, 217, 243, 244, 250, 252, 253, 254])
        
        # Bronx
        elif 40.8000 <= lat <= 40.9200 and -73.9500 <= lon <= -73.8000:
            return np.random.choice([3, 18, 20, 31, 32, 46, 47, 57, 58, 59, 68, 77, 79, 80, 108, 115, 125, 126, 138, 150, 158, 159, 160, 165, 174, 175, 176, 191, 199, 203, 204, 211, 226, 231, 232, 233, 234, 235, 238, 239, 241, 245, 251])
        
        # Staten Island
        elif 40.5000 <= lat <= 40.6500 and -74.2500 <= lon <= -74.0000:
            return np.random.choice([5, 23, 44, 67, 90, 98, 99, 104, 107, 142, 147, 163, 167, 178, 195, 197, 205, 212, 236, 242])
        
        # Default to Manhattan
        else:
            return 4
    
    def run_full_pipeline(self):
        """Run the complete data processing pipeline"""
        try:
            logger.info("Starting NYC Taxi Data Processing Pipeline")
            
            # Download sample data
            data_file = self.download_sample_data()
            
            # Process data
            cleaned_data = self.process_data(data_file)
            
            # Load to database
            self.load_to_database(cleaned_data)
            
            logger.info("Data processing pipeline completed successfully!")
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            raise

def main():
    """Main entry point"""
    processor = DataProcessor()
    processor.run_full_pipeline()

if __name__ == '__main__':
    main()


