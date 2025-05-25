from flask import Flask, request, jsonify, render_template
import mysql.connector
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}

# Error handling decorator
def handle_db_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except mysql.connector.Error as e:
            print(f"Database error: {e}")
            return jsonify({ str(e)})
        except Exception as e:
            print(f"Unexpected error: {e}")
            return jsonify({ str(e)})
    return wrapper

def get_db_connection():
    """Create and return a new database connection."""
    return mysql.connector.connect(**DB_CONFIG)

def mark_completed_reservations():
    """Set status too completed when the reservation is over."""
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "UPDATE reservations SET status = 'completed' WHERE end_time < NOW() AND status != 'completed'"
        )
        connection.commit()
    finally:
        cursor.close()
        connection.close()

# Page routes
@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/user-dashboard')
def user_dashboard():
    """Render the user dashboard page."""
    return render_template('user_dashboard.html')

@app.route('/admin-dashboard')
def admin_dashboard():
    """Render the admin dashboard page."""
    return render_template('admin_dashboard.html')

# API endpoints
@app.route('/api/tables', methods=['GET'])
@handle_db_errors
def get_tables():
    """Get all tables."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT id, name, seats FROM tables")
    tables = cursor.fetchall()
    return jsonify(tables)

@app.route('/api/tables/available', methods=['GET'])
@handle_db_errors
def get_available_tables():
    """Get available tables for a given time and party size."""
    check_time = request.args.get('time')
    party_size = request.args.get('party_size', type=int)
    
    if not check_time or not party_size:
        return jsonify({ 'Time and party size are required'})

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.callproc('GetAvailableTables', [check_time, party_size, 120])
    
    available_tables = []
    for result in cursor.stored_results():
        available_tables = result.fetchall()
        break
    
    return jsonify(available_tables)

@app.route('/api/bookings', methods=['POST'])
@handle_db_errors
def create_booking():
    """Create a new reservation."""
    data = request.json
    if not data:
        return jsonify({ 'No data provided'})

    required_fields = ['name', 'date', 'time', 'table_id', 'party_size']
    if not all(field in data for field in required_fields):
        return jsonify({ 'Missing required fields'})

    try:
        reservation_time = datetime.strptime(f"{data['date']} {data['time']}", "%Y-%m-%d %H:%M")
    except ValueError:
        return jsonify({ 'Invalid date or time format'})

    end_time = reservation_time + timedelta(hours=2)
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # Create user if not exists
        cursor.execute(
            "INSERT INTO users (name, role) VALUES (%s, %s)",
            (data['name'], 'customer')
        )
        user_id = cursor.lastrowid

        # Create reservation
        query = """
            INSERT INTO reservations (
                user_id, table_id, reservation_time, end_time,
                party_size, special_requests, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            user_id,
            data['table_id'],
            reservation_time,
            end_time,
            data.get('party_size', 2),
            data.get('special_requests'),
            'pending'
        )
        cursor.execute(query, values)
        connection.commit()

        return jsonify({
            'reservation_id': cursor.lastrowid
        })

    except mysql.connector.Error as e:
        connection.rollback()
        raise e

@app.route('/api/add_menu_item', methods=['POST'])
@handle_db_errors
def add_menu_item():
    """Add a new menu item."""
    data = request.json
    if not data:
        return jsonify({ 'No data provided'})

    required_fields = ['name', 'category', 'price']
    if not all(field in data for field in required_fields):
        return jsonify({ 'Missing required fields'})

    try:
        price = float(data['price'])
    except ValueError:
        return jsonify({ 'Invalid price format'})

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.callproc('AddMenuItem', [data['name'], data['category'], price])
        for result in cursor.stored_results():
            new_item = result.fetchone()
            if new_item:
                connection.commit()
                return jsonify({
                    'item': new_item
                })
    except mysql.connector.Error as e:
        connection.rollback()
        raise e

@app.route('/api/menu_items', methods=['GET'])
@handle_db_errors
def get_menu_items():
    """Get all menu items."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT id, name, category, price FROM menu_items ORDER BY category, name")
    menu_items = cursor.fetchall()
    return jsonify(menu_items)

@app.route('/api/reservation_stats', methods=['GET'])
@handle_db_errors
def get_reservation_stats():
    """Get reservation and menu statistics."""
    mark_completed_reservations()
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Get reservation details with user and table information
    cursor.execute("""
        SELECT 
            reservations.id,
            reservations.reservation_time,
            users.name as customer_name,
            tables.name as table_name,
            tables.seats,
            reservations.party_size,
            reservations.status
        FROM reservations 
        INNER JOIN users ON reservations.user_id = users.id
        INNER JOIN tables ON reservations.table_id = tables.id
        ORDER BY reservations.reservation_time DESC
    """)
    reservations = cursor.fetchall()

    # Get menu item statistics
    cursor.execute("""
        SELECT 
            category,
            COUNT(*) as number_of_items,
            AVG(price) as average_price,
            MIN(price) as cheapest_item,
            MAX(price) as most_expensive_item
        FROM menu_items
        GROUP BY category
    """)
    menu_stats = cursor.fetchall()

    return jsonify({
        'reservations': reservations,
        'menu_stats': menu_stats
    })

@app.route('/api/accept_reservation/<int:reservation_id>', methods=['POST'])
@handle_db_errors
def accept_reservation(reservation_id: int):
    """Accept a reservation (set status to confirmed)."""
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        cursor.execute(
            "UPDATE reservations SET status = 'confirmed' WHERE id = %s",
            (reservation_id,)
        )
        connection.commit()
        return jsonify({'message': 'Reservation accepted'})
    except mysql.connector.Error as e:
        connection.rollback()
        raise e

@app.route('/api/table_utilization', methods=['GET'])
@handle_db_errors
def get_table_utilization():
    """Get table utilization statistics for a specific date."""
    date = request.args.get('date')
    if not date:
        return jsonify({ 'Date is required'})

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            tables.id AS table_id,
            tables.name AS table_name,
            tables.seats,
            table_utilization(tables.id, %s) AS utilization_percent
        FROM tables 
        ORDER BY utilization_percent DESC
    """, (date,))
    
    results = cursor.fetchall()
    return jsonify(results)

@app.route('/api/add_table', methods=['POST'])
@handle_db_errors
def add_table():
    data = request.json
    if not data:
        return jsonify({ 'No data provided'})

    required_fields = ['table_number', 'capacity']
    if not all(field in data for field in required_fields):
        return jsonify({ 'Missing required fields'})

    try:
        table_number = int(data['table_number'])
        capacity = int(data['capacity'])
    except ValueError:
        return jsonify({ 'Invalid number format'})

    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO tables (name, seats) VALUES (%s, %s)",
            (str(table_number), capacity)
        )
        connection.commit()
        return jsonify({'table_id': cursor.lastrowid})
    except mysql.connector.Error as e:
        connection.rollback()
        raise e

if __name__ == '__main__':
    app.run(debug=True)
