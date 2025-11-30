CREATE DATABASE hotels_dashboard;
USE hotels_dashboard;
CREATE TABLE hotels (
    hotel_id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_name VARCHAR(100),
    city VARCHAR(50),
    price_per_night DECIMAL(10,2),
    rating DECIMAL(2,1),
    image_url VARCHAR(500),
    availability VARCHAR(20)
);
INSERT INTO hotels (hotel_name, city, price_per_night, rating, image_url, availability) VALUES
('Hotel Taj', 'Mumbai', 12000.00, 4.9, 'https://img.freepik.com/premium-photo/facade-taj-mahal-palace-hotel-colaba-district-mumbai-india_117930-1914.jpg?w=2000', 'Available'),
('Grand Hyatt', 'Goa', 9500.00, 4.8, 'https://media-cdn.tripadvisor.com/media/photo-s/03/1e/26/6b/grand-hyatt-goa-palace.jpg', 'Available'),
('The Leela Palace', 'Chennai', 11000.00, 4.7, 'https://tse3.mm.bing.net/th/id/OIP.RFM8vfRhBF3MJsJdqMgF1wHaDt?pid=Api&P=0&h=220', 'Available'),
('Taj Palace', 'Delhi', 10500.00, 4.8, 'https://tse4.mm.bing.net/th/id/OIP.7KW1YBjFcwes5yyDmfj9cAHaEc?pid=Api&P=0&h=220', 'Available');

SELECT * FROM hotels;

-- Updated customers table with all required fields for hotel bookings
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(15),
    hotel_id INT,
    check_in DATE,
    check_out DATE,
    guests INT,
    rooms INT,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

SELECT 
    c.customer_id,
    c.customer_name,
    c.email,
    c.phone,
    h.hotel_name,
    h.city,
    h.price_per_night,
    h.rating,
    h.image_url,
    h.availability
FROM 
    customers c
JOIN 
    hotels h
ON 
    c.hotel_id = h.hotel_id;
