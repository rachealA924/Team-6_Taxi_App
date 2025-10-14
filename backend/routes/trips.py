from flask import Blueprint, jsonify, request
from sqlalchemy import and_, or_, desc, asc
from datetime import datetime, timedelta
from models.trip import Trip
from models.zone import Zone
from app import db
import json

trips_bp = Blueprint('trips', __name__)

@trips_bp.route('/')
def get_trips():
    """Get trips with filtering and pagination"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        
        # Build query
        query = Trip.query
        
        # Apply filters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        min_fare = request.args.get('min_fare')
        max_fare = request.args.get('max_fare')
        min_distance = request.args.get('min_distance')
        max_distance = request.args.get('max_distance')
        borough = request.args.get('borough')
        payment_type = request.args.get('payment_type')
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Trip.pickup_datetime >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Trip.pickup_datetime <= end_dt)
        
        if min_fare:
            query = query.filter(Trip.fare_amount >= float(min_fare))
        
        if max_fare:
            query = query.filter(Trip.fare_amount <= float(max_fare))
        
        if min_distance:
            query = query.filter(Trip.trip_distance >= float(min_distance))
        
        if max_distance:
            query = query.filter(Trip.trip_distance <= float(max_distance))
        
        if payment_type:
            query = query.filter(Trip.payment_type == int(payment_type))
        
        if borough:
            # Join with zones table to filter by borough
            query = query.join(Zone, Trip.pickup_location_id == Zone.location_id)\
                        .filter(Zone.borough.ilike(f'%{borough}%'))
        
        # Apply sorting
        sort_by = request.args.get('sort_by', 'pickup_datetime')
        sort_order = request.args.get('sort_order', 'desc')
        
        if hasattr(Trip, sort_by):
            if sort_order == 'desc':
                query = query.order_by(desc(getattr(Trip, sort_by)))
            else:
                query = query.order_by(asc(getattr(Trip, sort_by)))
        
        # Execute paginated query
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        trips = [trip.to_dict() for trip in pagination.items]
        
        return jsonify({
            'trips': trips,
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trips_bp.route('/<trip_id>')
def get_trip(trip_id):
    """Get a specific trip by ID"""
    try:
        trip = Trip.query.get_or_404(trip_id)
        return jsonify(trip.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trips_bp.route('/search')
def search_trips():
    """Search trips by various criteria"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'trips': [], 'total': 0})
        
        # Search in pickup/dropoff zones
        trips = Trip.query.join(
            Zone, Trip.pickup_location_id == Zone.location_id
        ).filter(
            or_(
                Zone.zone.ilike(f'%{query}%'),
                Zone.borough.ilike(f'%{query}%')
            )
        ).limit(100).all()
        
        return jsonify({
            'trips': [trip.to_dict() for trip in trips],
            'total': len(trips)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trips_bp.route('/zones')
def get_zones():
    """Get all taxi zones"""
    try:
        zones = Zone.query.all()
        return jsonify([zone.to_dict() for zone in zones])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trips_bp.route('/boroughs')
def get_boroughs():
    """Get unique boroughs"""
    try:
        boroughs = db.session.query(Zone.borough).distinct().all()
        return jsonify([borough[0] for borough in boroughs])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trips_bp.route('/recent')
def get_recent_trips():
    """Get recent trips for dashboard"""
    try:
        limit = int(request.args.get('limit', 10))
        recent_trips = Trip.query.order_by(desc(Trip.pickup_datetime)).limit(limit).all()
        
        return jsonify([trip.to_dict() for trip in recent_trips])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
