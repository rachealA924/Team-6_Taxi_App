from datetime import datetime
import uuid

# This will be set by the app initialization
db = None

class Trip(db.Model):
    __tablename__ = 'trips'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Timestamps
    pickup_datetime = db.Column(db.DateTime, nullable=False, index=True)
    dropoff_datetime = db.Column(db.DateTime, nullable=False, index=True)
    
    # Location data
    pickup_location_id = db.Column(db.Integer, db.ForeignKey('zones.location_id'), index=True)
    dropoff_location_id = db.Column(db.Integer, db.ForeignKey('zones.location_id'), index=True)
    pickup_longitude = db.Column(db.Float, nullable=False)
    pickup_latitude = db.Column(db.Float, nullable=False)
    dropoff_longitude = db.Column(db.Float, nullable=False)
    dropoff_latitude = db.Column(db.Float, nullable=False)
    
    # Trip metrics
    passenger_count = db.Column(db.Integer, nullable=False, default=1)
    trip_distance = db.Column(db.Float, nullable=False)  # in miles
    trip_duration = db.Column(db.Integer, nullable=False)  # in seconds
    
    # Fare information
    fare_amount = db.Column(db.Float, nullable=False)
    tip_amount = db.Column(db.Float, nullable=False, default=0.0)
    tolls_amount = db.Column(db.Float, nullable=False, default=0.0)
    total_amount = db.Column(db.Float, nullable=False)
    
    # Payment information
    payment_type = db.Column(db.Integer, nullable=False)  # 1=Credit card, 2=Cash, etc.
    
    # Derived features
    trip_speed_mph = db.Column(db.Float)  # miles per hour
    fare_per_mile = db.Column(db.Float)   # fare amount per mile
    idle_time_minutes = db.Column(db.Float)  # estimated idle time
    
    # Metadata
    vendor_id = db.Column(db.String(10))
    store_and_fwd_flag = db.Column(db.String(1))
    
    # Relationships
    pickup_zone = db.relationship('Zone', foreign_keys=[pickup_location_id], backref='pickup_trips')
    dropoff_zone = db.relationship('Zone', foreign_keys=[dropoff_location_id], backref='dropoff_trips')
    
    def to_dict(self):
        return {
            'id': self.id,
            'pickup_datetime': self.pickup_datetime.isoformat() if self.pickup_datetime else None,
            'dropoff_datetime': self.dropoff_datetime.isoformat() if self.dropoff_datetime else None,
            'pickup_location_id': self.pickup_location_id,
            'dropoff_location_id': self.dropoff_location_id,
            'pickup_longitude': self.pickup_longitude,
            'pickup_latitude': self.pickup_latitude,
            'dropoff_longitude': self.dropoff_longitude,
            'dropoff_latitude': self.dropoff_latitude,
            'passenger_count': self.passenger_count,
            'trip_distance': self.trip_distance,
            'trip_duration': self.trip_duration,
            'fare_amount': self.fare_amount,
            'tip_amount': self.tip_amount,
            'tolls_amount': self.tolls_amount,
            'total_amount': self.total_amount,
            'payment_type': self.payment_type,
            'trip_speed_mph': self.trip_speed_mph,
            'fare_per_mile': self.fare_per_mile,
            'idle_time_minutes': self.idle_time_minutes,
            'vendor_id': self.vendor_id,
            'store_and_fwd_flag': self.store_and_fwd_flag
        }
    
    def __repr__(self):
        return f'<Trip {self.id}: {self.pickup_datetime} -> {self.dropoff_datetime}>'
