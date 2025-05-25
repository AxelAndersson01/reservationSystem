# Restaurant Reservation System

A web-based application for managing restaurant reservations, table availability, and menu items.  
Built with **Flask** (Python), **MySQL**, and **Bootstrap**.

---

## Features

- **Customer Dashboard:**  
  - View available tables
  - Make reservations
- **Admin Dashboard:**  
  - Manage reservations (accept, view status)
  - Add and view menu items
  - **Add and view tables**
  - View restaurant and menu statistics
  - See table utilization by date
- **Smart Table Booking:**  
  - Prevents double-booking and overlapping reservations
- **Automatic Status Updates:**  
  - Reservations are marked as completed after their end time

---


## Getting Started

### Prerequisites

- Python 3.8+
- MySQL Server

### Installation

1. **Clone the repository:**
   ```bash
   git clone 
   cd restaurant-reservation-system
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your MySQL constants:
     ```
     DB_HOST=localhost
     DB_USER=your_mysql_user
     DB_PASSWORD=your_mysql_password
     DB_NAME=restaurant_db
     ```

4. **Set up the database:**
   - Create the database and tables:
     ```bash
     mysql -u your_mysql_user -p < restaurant.sql
     mysql -u your_mysql_user -p < create_procedures.sql
     ```

5. **Run the Flask app:**
   ```bash
   python smart_booking.py
   ```
   - The app will be available at [http://localhost:5000]

---

## Usage

- **Customers:**  
  Go to `/user-dashboard` to view tables and make reservations.
- **Admins:**  
  Go to `/admin-dashboard` to manage reservations, menu, **add/view tables**, and view statistics.

---

## API Endpoints

- `GET /api/tables` — List all tables
- `GET /api/tables/available?time=YYYY-MM-DD HH:MM&party_size=N` — Get available tables
- `POST /api/bookings` — Create a reservation
- `POST /api/accept_reservation/<reservation_id>` — Accept a reservation
- `GET /api/menu_items` — List menu items
- `POST /api/add_menu_item` — Add a menu item
- `POST /api/add_table` — Add a new table
- `GET /api/reservation_stats` — Get reservation and menu statistics
- `GET /api/table_utilization?date=YYYY-MM-DD` — Get table utilization for a specific date

---

## Custom SQL Functions & Procedures

- **GetAvailableTables:**  
  Returns available tables for a given time and party size.
- **AddMenuItem:**  
  Adds a new menu item, preventing duplicates.
- **table_utilization:**  
  Returns the percentage of a day a table is reserved.


---

## License

MIT License

---

## Acknowledgements

- [Flask](https://flask.palletsprojects.com/)
- [Bootstrap](https://getbootstrap.com/)
- [MySQL](https://www.mysql.com/)

---
