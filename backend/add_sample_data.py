#!/usr/bin/env python3
"""
Script to add sample data to the database for testing
"""

from app import app, db
from models import Trip, Zone
from datetime import datetime, timedelta
import random

def add_sample_data():
    """Add sample trip data to the database"""
    
    with app.app_context():
        # Clear existing data
        Trip.query.delete()
        Zone.query.delete()
        
        # Add sample zones
        zones = [
            Zone(id=1, zone_name='Manhattan', borough='Manhattan', zone_latitude=40.7831, zone_longitude=-73.9712),
            Zone(id=2, zone_name='Brooklyn', borough='Brooklyn', zone_latitude=40.6782, zone_longitude=-73.9442),
            Zone(id=3, zone_name='Queens', borough='Queens', zone_latitude=40.7282, zone_longitude=-73.7949),
            Zone(id=4, zone_name='Bronx', borough='Bronx', zone_latitude=40.8448, zone_longitude=-73.8648),
            Zone(id=5, zone_name='Staten Island', borough='Staten Island', zone_latitude=40.5795, zone_longitude=-74.1502)
        ]
        
        for zone in zones:
            db.session.add(zone)
        
        # Add sample trips
        base_date = datetime(2024, 1, 15, 8, 0, 0)
        payment_types = [1, 2, 1, 1, 2, 1, 1, 2]  # Mix of credit card and cash
        
        for i in range(50):
            # Random time within the day
            pickup_time = base_date + timedelta(
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )
            
            # Trip duration between 5 and 60 minutes
            duration_minutes = random.randint(5, 60)
            dropoff_time = pickup_time + timedelta(minutes=duration_minutes)
            
            # Random distance between 0.5 and 15 miles
            distance = round(random.uniform(0.5, 15.0), 2)
            
            # Fare calculation (rough estimate)
            base_fare = 2.50
            distance_fare = distance * 2.50
            time_fare = duration_minutes * 0.50
            fare_amount = round(base_fare + distance_fare + time_fare, 2)
            
            # Tip (10-20% of fare)
            tip_amount = round(fare_amount * random.uniform(0.10, 0.20), 2)
            
            # Tolls (random)
            tolls_amount = round(random.uniform(0, 5.0), 2)
            
            trip = Trip(
                pickup_datetime=pickup_time,
                dropoff_datetime=dropoff_time,
                passenger_count=random.randint(1, 4),
                trip_distance=distance,
                trip_duration=duration_minutes * 60,  # Convert to seconds
                fare_amount=fare_amount,
                tip_amount=tip_amount,
                tolls_amount=tolls_amount,
                total_amount=round(fare_amount + tip_amount + tolls_amount, 2),
                payment_type=random.choice(payment_types),
                pickup_longitude=round(random.uniform(-74.1, -73.7), 6),
                pickup_latitude=round(random.uniform(40.6, 40.9), 6),
                dropoff_longitude=round(random.uniform(-74.1, -73.7), 6),
                dropoff_latitude=round(random.uniform(40.6, 40.9), 6),
                trip_speed_mph=round((distance / (duration_minutes / 60)), 2) if duration_minutes > 0 else 0,
                fare_per_mile=round(fare_amount / distance, 2) if distance > 0 else 0,
                idle_time_minutes=round(random.uniform(0, 10), 2),
                pickup_zone_id=random.randint(1, 5),
                dropoff_zone_id=random.randint(1, 5)
            )
            
            db.session.add(trip)
        
        # Commit all changes
        db.session.commit()
        print(f"Added {len(zones)} zones and 50 sample trips to the database!")

if __name__ == '__main__':
    add_sample_data()
