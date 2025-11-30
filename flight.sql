CREATE DATABASE flights_dashboard;
USE flights_dashboard;
CREATE TABLE flights (
    flight_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(10),
    airline VARCHAR(50),
    source VARCHAR(50),
    destination VARCHAR(50),
    departure_time DATETIME,
    arrival_time DATETIME,
    status VARCHAR(20)
);
INSERT INTO flights (flight_number, airline, source, destination, departure_time, arrival_time, status)
VALUES
('AI101', 'Air India', 'Mumbai', 'Delhi', '2025-11-05 09:30:00', '2025-11-05 11:45:00', 'On Time'),
('6E202', 'IndiGo', 'Goa', 'Bangalore', '2025-11-05 14:00:00', '2025-11-05 15:30:00', 'Delayed');

INSERT INTO flights (flight_number, airline, source, destination, departure_time, arrival_time, status)
VALUES
('AI303', 'Air India', 'Chennai', 'Pune', '2025-11-06 08:00:00', '2025-11-06 10:30:00', 'On Time'),
('SG404', 'SpiceJet', 'Delhi', 'Goa', '2025-11-06 14:15:00', '2025-11-06 17:30:00', 'Delayed'),
('UK505', 'Vistara', 'Bangalore', 'Mumbai', '2025-11-06 12:45:00', '2025-11-06 14:55:00', 'On Time'),
('6E606', 'IndiGo', 'Kolkata', 'Delhi', '2025-11-06 09:30:00', '2025-11-06 11:55:00', 'Cancelled');

INSERT INTO flights (flight_number, airline, source, destination, departure_time, arrival_time, status)
VALUES
('AI303', 'Air India', 'Delhi', 'Chennai', '2025-11-06 06:30:00', '2025-11-06 09:10:00', 'On Time'),
('6E404', 'IndiGo', 'Mumbai', 'Goa', '2025-11-06 07:00:00', '2025-11-06 08:15:00', 'Delayed'),
('UK505', 'Vistara', 'Chennai', 'Mumbai', '2025-11-06 09:45:00', '2025-11-06 11:55:00', 'On Time'),
('SG606', 'SpiceJet', 'Goa', 'Delhi', '2025-11-06 12:00:00', '2025-11-06 14:30:00', 'On Time'),
('AI707', 'Air India', 'Mumbai', 'Delhi', '2025-11-06 13:15:00', '2025-11-06 15:45:00', 'Delayed'),
('6E808', 'IndiGo', 'Chennai', 'Goa', '2025-11-06 15:00:00', '2025-11-06 17:00:00', 'On Time'),
('UK909', 'Vistara', 'Goa', 'Mumbai', '2025-11-06 16:30:00', '2025-11-06 17:45:00', 'On Time'),
('SG010', 'SpiceJet', 'Delhi', 'Goa', '2025-11-06 17:45:00', '2025-11-06 20:00:00', 'Cancelled'),
('AI111', 'Air India', 'Chennai', 'Delhi', '2025-11-06 18:30:00', '2025-11-06 21:15:00', 'On Time'),
('6E212', 'IndiGo', 'Goa', 'Chennai', '2025-11-06 20:00:00', '2025-11-06 22:00:00', 'Delayed');

SELECT * FROM flights;
SELECT * FROM flights;
DELETE FROM flights;

