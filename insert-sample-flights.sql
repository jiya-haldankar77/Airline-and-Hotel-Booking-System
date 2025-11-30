-- Insert sample flights into the flights table
USE travelsease_db;

-- Clear existing data (be careful with this in production!)
TRUNCATE TABLE flights;

-- Insert sample flights
INSERT INTO flights (flight_number, airline, source, destination, departure_time, arrival_time, status) VALUES
('AI101', 'Air India', 'DEL', 'BOM', '2025-11-04 08:00:00', '2025-11-04 10:15:00', 'On Time'),
('6E202', 'IndiGo', 'BOM', 'DEL', '2025-11-04 11:00:00', '2025-11-04 13:15:00', 'On Time'),
('UK303', 'Vistara', 'DEL', 'BOM', '2025-11-04 14:00:00', '2025-11-04 16:15:00', 'On Time'),
('SG404', 'SpiceJet', 'BOM', 'DEL', '2025-11-04 17:00:00', '2025-11-04 19:15:00', 'Delayed'),
('AI505', 'Air India', 'DEL', 'BOM', '2025-11-04 20:00:00', '2025-11-04 22:15:00', 'On Time');

-- Verify the data was inserted
SELECT * FROM flights;
