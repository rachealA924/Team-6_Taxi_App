#!/usr/bin/env python3
"""
Real NYC Taxi Data Processor
Processes the official NYC Taxi Trip Dataset (train.zip)
"""

import os
import sys
import logging
import pandas as pd
import numpy as np
import zipfile
from datetime import datetime
from pathlib import Path
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_cleaner import DataCleaner
from models.trip import Trip
from models.zone import Zone
from app import app, db

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class RealDataProcessor:
    """Processes the official NYC Taxi Trip Dataset"""
    
    def __init__(self):
        self.cleaner = DataCleaner()
        self.project_root = Path(__file__).parent.parent.parent
        self.data_dir = self.project_root / 'data'
        self.raw_dir = self.data_dir / 'raw'
        self.processed_dir = self.data_dir / 'processed'
        
        # Create directories if they don't exist
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
    def check_for_dataset(self):
        """Check if the dataset files exist"""
        train_zip = self.raw_dir / 'train.zip'
        train_csv = self.raw_dir / 'train.csv'
        
        if train_zip.exists():
            logger.info(f"Found train.zip at: {train_zip}")
            return 'zip'
        elif train_csv.exists():
            logger.info(f"Found train.csv at: {train_csv}")
            return 'csv'
        else:
            logger.warning("No dataset found. Please place train.zip or train.csv in data/raw/")
            return None
    
    def extract_dataset(self):
        """Extract the zip file if it exists"""
        train_zip = self.raw_dir / 'train.zip'
        train_csv = self.raw_dir / 'train.csv'
        
        if train_zip.exists() and not train_csv.exists():
            logger.info("Extracting train.zip...")
            try:
                with zipfile.ZipFile(train_zip, 'r') as zip_ref:
                    zip_ref.extractall(self.raw_dir)
                logger.info("Extraction completed successfully")
            except Exception as e:
                logger.error(f"Failed to extract train.zip: {e}")
                raise
        elif train_csv.exists():
            logger.info("train.csv already exists, skipping extraction")
    
    def load_zone_lookup(self):
        """Load taxi zone lookup table if available"""
        zone_file = self.raw_dir / 'taxi+_zone_lookup.csv'
        
        if zone_file.exists():
            logger.info("Loading taxi zone lookup table...")
            try:
                zones_df = pd.read_csv(zone_file)
                logger.info(f"Loaded {len(zones_df)} zones from lookup table")
                return zones_df
            except Exception as e:
                logger.error(f"Failed to load zone lookup: {e}")
                return None
        else:
            logger.warning("No taxi zone lookup table found. Using default zones.")
            return None
    
    def load_real_data(self, file_path):
        """Load the real NYC taxi dataset"""
        logger.info(f"Loading real dataset from: {file_path}")
        
        try:
            # The official NYC taxi dataset has these columns:
            # vendor_id, pickup_datetime, dropoff_datetime, passenger_count,
            # trip_distance, pickup_longitude, pickup_latitude, rate_code_id,
            # store_and_fwd_flag, dropoff_longitude, dropoff_latitude,
            # payment_type, fare_amount, extra, mta_tax, tip_amount,
            # tolls_amount, improvement_surcharge, total_amount
            
            # Read the CSV file
            df = pd.read_csv(file_path, low_memory=False)
            logger.info(f"Loaded {len(df)} records from dataset")
            
            # Display basic info about the dataset
            logger.info(f"Dataset shape: {df.shape}")
            logger.info(f"Columns: {list(df.columns)}")
            logger.info(f"Date range: {df['pickup_datetime'].min()} to {df['pickup_datetime'].max()}")
            
            return df
            
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            raise
    
    def process_real_data(self):
        """Process the real NYC taxi dataset"""
        logger.info("Starting real data processing pipeline...")
        
        # Check for dataset
        dataset_type = self.check_for_dataset()
        if not dataset_type:
            raise FileNotFoundError("No dataset found. Please place train.zip or train.csv in data/raw/")
        
        # Extract if necessary
        if dataset_type == 'zip':
            self.extract_dataset()
        
        # Load the dataset
        train_csv = self.raw_dir / 'train.csv'
        raw_data = self.load_real_data(train_csv)
        
        # Load zone lookup if available
        zones_df = self.load_zone_lookup()
        
        # Clean the data
        logger.info("Starting data cleaning...")
        cleaned_data = self.cleaner.clean_data(raw_data)
        
        # Save cleaned data
        cleaned_file = self.processed_dir / 'cleaned_trips.csv'
        cleaned_data.to_csv(cleaned_file, index=False)
        logger.info(f"Saved cleaned data to: {cleaned_file}")
        
        # Save cleaning summary
        cleaning_summary = self.cleaner.get_cleaning_summary()
        summary_file = self.processed_dir / 'cleaning_summary.json'
        
        import json
        with open(summary_file, 'w') as f:
            json.dump(cleaning_summary, f, indent=2)
        
        logger.info(f"Saved cleaning summary to: {summary_file}")
        
        # Load zones if available
        if zones_df is not None:
            self.load_zones_to_database(zones_df)
        
        # Load trips to database
        self.load_trips_to_database(cleaned_data)
        
        logger.info("Real data processing completed successfully!")
        
        return cleaned_data
    
    def load_zones_to_database(self, zones_df):
        """Load taxi zones to database"""
        logger.info("Loading taxi zones to database...")
        
        with app.app_context():
            try:
                # Clear existing zones
                Zone.query.delete()
                
                # Load zones from dataframe
                zones = []
                for _, row in zones_df.iterrows():
                    zone = Zone(
                        location_id=int(row['LocationID']),
                        borough=str(row['Borough']),
                        zone=str(row['Zone']),
                        service_zone=str(row['service_zone'])
                    )
                    zones.append(zone)
                
                # Bulk insert
                db.session.bulk_save_objects(zones)
                db.session.commit()
                
                logger.info(f"Successfully loaded {len(zones)} zones to database")
                
            except Exception as e:
                logger.error(f"Error loading zones: {e}")
                db.session.rollback()
                raise
    
    def load_trips_to_database(self, data):
        """Load cleaned trip data to database"""
        logger.info("Loading trips to database...")
        
        with app.app_context():
            try:
                # Clear existing trips
                Trip.query.delete()
                
                # Load data in batches
                batch_size = 1000
                total_rows = len(data)
                
                for i in range(0, total_rows, batch_size):
                    batch = data.iloc[i:i+batch_size]
                    
                    # Convert batch to trip objects
                    trips = []
                    for _, row in batch.iterrows():
                        try:
                            # Map location IDs (simplified - in reality you'd use proper zone lookup)
                            pickup_location_id = self.get_location_id_from_coords(
                                row['pickup_latitude'], row['pickup_longitude']
                            )
                            dropoff_location_id = self.get_location_id_from_coords(
                                row['dropoff_latitude'], row['dropoff_longitude']
                            )
                            
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
                                vendor_id=str(row.get('vendor_id', '')),
                                store_and_fwd_flag=str(row.get('store_and_fwd_flag', ''))
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
                
            except Exception as e:
                logger.error(f"Error loading trips: {e}")
                db.session.rollback()
                raise
    
    def get_location_id_from_coords(self, lat, lon):
        """Get location ID based on coordinates"""
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

def main():
    """Main entry point for real data processing"""
    processor = RealDataProcessor()
    processor.process_real_data()

if __name__ == '__main__':
    main()

