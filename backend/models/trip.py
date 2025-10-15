from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

# Import db from the package
from . import db

class Trip(db.Model):
    __tablename__ = 'trips'
    
    id = Column(Integer, primary_key=True)
    pickup_datetime = Column(DateTime, nullable=False)
    dropoff_datetime = Column(DateTime, nullable=False)
    passenger_count = Column(Integer, nullable=False)
    trip_distance = Column(Float, nullable=False)
    trip_duration = Column(Integer, nullable=False)  # in seconds
    fare_amount = Column(Float, nullable=False)
    tip_amount = Column(Float, nullable=False)
    tolls_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_type = Column(Integer, nullable=False)
    pickup_longitude = Column(Float, nullable=False)
    pickup_latitude = Column(Float, nullable=False)
    dropoff_longitude = Column(Float, nullable=False)
    dropoff_latitude = Column(Float, nullable=False)
    
    # Derived features
    trip_speed_mph = Column(Float, nullable=False, default=0)
    fare_per_mile = Column(Float, nullable=False, default=0)
    idle_time_minutes = Column(Float, nullable=False, default=0)
    
    # Foreign keys
    pickup_zone_id = Column(Integer, ForeignKey('zones.id'))
    dropoff_zone_id = Column(Integer, ForeignKey('zones.id'))
    
    # Relationships
    pickup_zone = relationship('Zone', foreign_keys=[pickup_zone_id])
    dropoff_zone = relationship('Zone', foreign_keys=[dropoff_zone_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'pickupTime': self.pickup_datetime.isoformat() if self.pickup_datetime else None,
            'dropoffTime': self.dropoff_datetime.isoformat() if self.dropoff_datetime else None,
            'passengerCount': self.passenger_count,
            'tripDistance': self.trip_distance,
            'tripDuration': self.trip_duration,
            'fareAmount': self.fare_amount,
            'tipAmount': self.tip_amount,
            'tollsAmount': self.tolls_amount,
            'totalAmount': self.total_amount,
            'paymentType': self.get_payment_type_name(),
            'pickupLat': self.pickup_latitude,
            'pickupLon': self.pickup_longitude,
            'dropoffLat': self.dropoff_latitude,
            'dropoffLon': self.dropoff_longitude,
            'tripSpeedMph': self.trip_speed_mph,
            'farePerMile': self.fare_per_mile,
            'idleTimeMinutes': self.idle_time_minutes
        }
    
    def get_payment_type_name(self):
        payment_types = {
            1: 'Credit card',
            2: 'Cash',
            3: 'No charge',
            4: 'Dispute',
            5: 'Unknown',
            6: 'Voided trip'
        }
        return payment_types.get(self.payment_type, 'Unknown')
