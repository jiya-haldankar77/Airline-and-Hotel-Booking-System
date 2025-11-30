CREATE DATABASE travelsease_db;
USE travelsease_db;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  number VARCHAR(20)
);
DESCRIBE users;
