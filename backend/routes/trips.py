from flask import Blueprint, jsonify, request
from models import Trip, Zone, db
from datetime import datetime
from sqlalchemy import desc, asc

trips_bp = Blueprint('trips', __name__)

@trips_bp.route('/trips', methods=['GET'])
def get_trips():
    """Get trips with filtering and pagination"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        sort = request.args.get('sort', 'pickup_datetime')
        order = request.args.get('order', 'desc')
        
        # Filter parameters
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        passenger_count = request.args.get('passengerCount')
        min_fare = request.args.get('minFare')
        max_fare = request.args.get('maxFare')
        min_distance = request.args.get('minDistance')
        max_distance = request.args.get('maxDistance')
        search = request.args.get('search')
        
        # Build query
        query = Trip.query
        
        # Apply filters
        if start_date:
            query = query.filter(Trip.pickup_datetime >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Trip.pickup_datetime <= datetime.fromisoformat(end_date))
        if passenger_count:
            query = query.filter(Trip.passenger_count == int(passenger_count))
        if min_fare:
            query = query.filter(Trip.fare_amount >= float(min_fare))
        if max_fare:
            query = query.filter(Trip.fare_amount <= float(max_fare))
        if min_distance:
            query = query.filter(Trip.trip_distance >= float(min_distance))
        if max_distance:
            query = query.filter(Trip.trip_distance <= float(max_distance))
        if search:
            query = query.filter(Trip.payment_type.like(f'%{search}%'))
        
        # Apply sorting
        sort_column = getattr(Trip, sort, Trip.pickup_datetime)
        if order == 'desc':
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        trips = query.offset((page - 1) * limit).limit(limit).all()
        
        # Convert to dictionary format
        trips_data = [trip.to_dict() for trip in trips]
        
        return jsonify({
            'trips': trips_data,
            'pagination': {
                'currentPage': page,
                'totalPages': (total_count + limit - 1) // limit,
                'totalItems': total_count,
                'itemsPerPage': limit
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trips_bp.route('/trips/<int:trip_id>', methods=['GET'])
def get_trip(trip_id):
    """Get a specific trip by ID"""
    try:
        trip = Trip.query.get_or_404(trip_id)
        return jsonify(trip.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500
