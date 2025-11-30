const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "upsc2027", // your MySQL password
  database: "travelsease_db"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL successfully!");
  }
});

// Register route
app.post("/register", (req, res) => {
  const { name, email, number } = req.body;

  if (!name || !email || !number) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "INSERT INTO users (name, email, number) VALUES (?, ?, ?)";
  db.query(sql, [name, email, number], (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).json({ message: "Failed to register. Please try again." });
    }
    console.log("New user registered:", name);
    res.status(200).json({ message: "Registration successful!" });
  });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
