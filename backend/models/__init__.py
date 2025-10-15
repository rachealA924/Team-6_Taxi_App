# Models package
from flask_sqlalchemy import SQLAlchemy

# This will be initialized by the main app
db = SQLAlchemy()

# Import models after db is defined
from .trip import Trip
from .zone import Zone
