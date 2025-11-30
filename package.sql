CREATE DATABASE package;
USE package;
CREATE TABLE packages (
  package_id INT AUTO_INCREMENT PRIMARY KEY,
  package_name VARCHAR(100) NOT NULL,
  description TEXT,
  origin VARCHAR(50),
  destination VARCHAR(50),
  flight_number VARCHAR(20),
  airline VARCHAR(50),
  flight_date DATE,
  departure_time TIME,
  arrival_time TIME,
  duration VARCHAR(30),
  stay_details VARCHAR(100),
  price DECIMAL(10,2),
  image_url VARCHAR(255)
);
CREATE TABLE customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL
);

-- Bookings table for holiday packages (required by /api/packages/book)
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  package_id INT NOT NULL,
  travel_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(20) DEFAULT 'UPI',
  transaction_id VARCHAR(50),
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_id),
  INDEX idx_package (package_id),
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  CONSTRAINT fk_bookings_package  FOREIGN KEY (package_id)  REFERENCES packages(package_id)
);

CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  package_id INT,
  travel_date DATE,
  total_amount DECIMAL(10,2),
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE CASCADE
);
CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  package_id INT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE CASCADE
);