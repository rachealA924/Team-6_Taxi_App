from sqlalchemy import Column, Integer, String, Float

# Import db from the package
from . import db

class Zone(db.Model):
    __tablename__ = 'zones'
    
    id = Column(Integer, primary_key=True)
    zone_name = Column(String(100), nullable=False)
    borough = Column(String(50), nullable=False)
    zone_latitude = Column(Float, nullable=False)
    zone_longitude = Column(Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'zoneName': self.zone_name,
            'borough': self.borough,
            'latitude': self.zone_latitude,
            'longitude': self.zone_longitude
        }
