# This will be set by the app initialization
db = None

class Zone(db.Model):
    __tablename__ = 'zones'
    
    location_id = db.Column(db.Integer, primary_key=True)
    borough = db.Column(db.String(50), nullable=False, index=True)
    zone = db.Column(db.String(100), nullable=False, index=True)
    service_zone = db.Column(db.String(50), nullable=False)
    
    def to_dict(self):
        return {
            'location_id': self.location_id,
            'borough': self.borough,
            'zone': self.zone,
            'service_zone': self.service_zone
        }
    
    def __repr__(self):
        return f'<Zone {self.location_id}: {self.zone}, {self.borough}>'
