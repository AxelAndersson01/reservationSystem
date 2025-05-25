-- Drop existing procedure if it exists
DROP PROCEDURE IF EXISTS GetAvailableTables;
DROP PROCEDURE IF EXISTS AddMenuItem;


-- Create procedure to get available tables
CREATE PROCEDURE GetAvailableTables(
    IN check_time DATETIME,
    IN party_size INT,
    IN duration_minutes INT
)
BEGIN
    DECLARE end_time DATETIME;
    SET end_time = DATE_ADD(check_time, INTERVAL duration_minutes MINUTE);
    
    SELECT 
        tables.id,
        tables.name,
        tables.seats
    FROM tables
    WHERE tables.seats >= party_size
    AND tables.id NOT IN (
        SELECT reservations.table_id
        FROM reservations
        WHERE reservations.status != 'cancelled'
        AND (
            (reservations.reservation_time <= check_time AND reservations.end_time > check_time)
            OR (reservations.reservation_time < end_time AND reservations.end_time >= end_time)
            OR (reservations.reservation_time >= check_time AND reservations.end_time <= end_time)
        )
    )
    ORDER BY tables.seats ASC; 

-- Create procedure to add menu items
CREATE PROCEDURE AddMenuItem(
    IN item_name VARCHAR(100),
    IN item_category VARCHAR(50),
    IN item_price DECIMAL(6,2)
)
BEGIN
    DECLARE item_exists INT;
    SELECT COUNT(*) INTO item_exists 
    FROM menu_items 
    WHERE name = item_name;
    
    IF item_exists > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'This menu item already exists.';
    ELSE
        INSERT INTO menu_items (name, category, price)
        VALUES (item_name, item_category, item_price);
        
        SELECT * FROM menu_items WHERE id = LAST_INSERT_ID();
    END IF;
END;


CREATE FUNCTION table_utilization(tableId INT, day DATE)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE total_minutes INT DEFAULT 0;
    DECLARE reserved_minutes INT DEFAULT 0;
    
    SET total_minutes = 24 * 60;

    SELECT IFNULL(SUM(TIMESTAMPDIFF(MINUTE, reservation_time, end_time)), 0)
    INTO reserved_minutes
    FROM reservations
    WHERE table_id = tableId
      AND DATE(reservation_time) = day
      AND DATE(end_time) = day
      AND status != 'cancelled';

    RETURN (reserved_minutes / total_minutes) * 100;
END;












