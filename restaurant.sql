DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tables;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL
);

CREATE TABLE tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20), 
    seats INT
);

CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    table_id INT,
    reservation_time DATETIME,
    end_time DATETIME,  
    party_size INT,     
    special_requests TEXT,  
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
);

CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(6,2)
);


INSERT INTO users (name, role) VALUES
('Alice', 'customer'),
('Bob', 'customer'),
('Emma', 'admin'),
('David', 'customer'),
('Sophia', 'customer'),
('Liam', 'customer'),
('Olivia', 'customer'),
('Noah', 'customer'),
('Ava', 'customer'),
('Mia', 'customer');


INSERT INTO tables (name, seats) VALUES
('Table 1', 2),
('Table 2', 4),
('Table 3', 6),
('Table 4', 2),
('Table 5', 4),
('Table 6', 6),
('Table 7', 2),
('Table 8', 4),
('Table 9', 6),
('Table 10', 4);


INSERT INTO menu_items (name, category, price) VALUES
('Pizza', 'Main Course', 89.00),
('Burger', 'Main Course', 75.00),
('Salad', 'Appetizer', 45.00),
('Water', 'Drink', 15.00),
('Ice Cream', 'Dessert', 30.00),
('Pasta', 'Main Course', 95.00),
('Steak', 'Main Course', 145.00),
('Soup', 'Appetizer', 35.00),
('Soda', 'Drink', 20.00),
('Cake', 'Dessert', 40.00);


INSERT INTO reservations (user_id, table_id, reservation_time, end_time, party_size, special_requests, status) VALUES
(1, 2, '2025-05-06 18:00:00', '2025-05-06 20:00:00', 3, 'Window seat preferred', 'confirmed'),
(2, 3, '2025-05-06 19:30:00', '2025-05-06 21:30:00', 5, 'Birthday celebration', 'pending'),
(4, 4, '2025-05-07 17:45:00', '2025-05-07 19:45:00', 2, 'Quiet table preferred', 'confirmed'),
(5, 5, '2025-05-07 18:15:00', '2025-05-07 20:15:00', 4, NULL, 'confirmed'),
(6, 6, '2025-05-07 19:00:00', '2025-05-07 21:00:00', 6, 'Group celebration', 'pending'),
(7, 1, '2025-05-08 18:30:00', '2025-05-08 20:30:00', 2, NULL, 'confirmed'),
(8, 7, '2025-05-08 19:00:00', '2025-05-08 21:00:00', 2, 'Anniversary dinner', 'confirmed'),
(9, 8, '2025-05-08 20:00:00', '2025-05-08 22:00:00', 4, NULL, 'pending'),
(10, 9, '2025-05-09 18:45:00', '2025-05-09 20:45:00', 6, 'Business dinner', 'confirmed'),
(3, 10, '2025-05-09 19:15:00', '2025-05-09 21:15:00', 4, NULL, 'confirmed');





