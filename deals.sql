-- Create Database
CREATE DATABASE deals;
USE deals;

-- Create a Single Combined Table
CREATE TABLE deals (
  deal_id INT AUTO_INCREMENT PRIMARY KEY,

  
  customer_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(15),
  id_type ENUM('Aadhaar', 'PAN', 'Passport', 'Other'),
  government_id VARCHAR(30),

 
  airline VARCHAR(50),
  flight_number VARCHAR(20),
  origin VARCHAR(50),
  destination VARCHAR(50),
  flight_date DATE,
  departure_time TIME,
  arrival_time TIME,
  duration VARCHAR(20),
  base_price DECIMAL(10,2),

  
  discount_name VARCHAR(100),
  discount_percent DECIMAL(5,2),

  
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  travel_date DATE,
  total_amount DECIMAL(10,2),
  payment_method ENUM('UPI', 'Credit Card', 'Debit Card', 'Net Banking'),
  payment_status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',

 
  package_name VARCHAR(100),
  package_description TEXT,
  package_price DECIMAL(10,2)
);
