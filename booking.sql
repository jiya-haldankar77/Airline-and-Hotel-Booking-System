CREATE DATABASE IF NOT EXISTS flight_booking;
USE flight_booking;
CREATE TABLE ticket (
  ticket_id INT AUTO_INCREMENT PRIMARY KEY,
  pnr_no VARCHAR(20) UNIQUE NOT NULL,
  flight_no VARCHAR(10) NOT NULL,
  passenger_name VARCHAR(100) NOT NULL,
  class_type ENUM('Economy', 'Business') DEFAULT 'Economy',
  seat_no VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL,
  destination VARCHAR(50) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  fare DECIMAL(10,2) NOT NULL,
  payment_mode ENUM('UPI', 'CreditCard', 'DebitCard', 'NetBanking') DEFAULT 'UPI',
  transaction_id VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);