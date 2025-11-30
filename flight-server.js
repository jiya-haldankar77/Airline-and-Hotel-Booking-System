const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection configuration
// Note: No default database specified - routes will switch to appropriate DB
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'upsc2027',
    // database: removed - we switch databases dynamically per route
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true, // Allow USE statements
    // Try with SSL disabled
    ssl: false,
    // Force MySQL to use native password authentication
    authPlugins: {
        mysql_native_password: () => require('mysql2/lib/auth_plugins/mysql_native_password')
    },
    // Add debug to see what's happening
    debug: false, // Set to true for debugging
    // Add support for old authentication
    insecureAuth: true
};

// Create connection pool
let pool;

const initializePool = () => {
    try {
        pool = mysql.createPool(dbConfig);
        
        // Test the connection
        pool.getConnection()
            .then(connection => {
                console.log('✅ Database connected successfully');
                // Test query to verify access
                return connection.query('SELECT 1 as test')
                    .then(() => {
                        console.log('✅ Test query executed successfully');
                        connection.release();
                    });
            })
            .catch(err => {
                console.error('❌ Database connection failed:', err);
                console.log('Retrying connection in 2 seconds...');
                setTimeout(initializePool, 2000);
            });
    } catch (err) {
        console.error('Failed to create connection pool:', err);
        setTimeout(initializePool, 2000);
    }
};

// Initialize the connection pool
initializePool();

// Middleware to handle database connection
app.use((req, res, next) => {
    if (!pool) {
        return res.status(500).json({ success: false, error: 'Database connection not initialized' });
    }
    next();
});

// ================== HOLIDAY PACKAGE ROUTES (package.sql) ==================

// Create a holiday package booking (stores to package DB)
app.post('/api/packages/book', async (req, res) => {
    const {
        // customer
        name, email, phone,
        // package details
        package_name, description, origin, destination, flight_number, airline, flight_date,
        departure_time, arrival_time, duration, stay_details, price, image_url,
        // booking/payment
        travel_date, payment_mode, transaction_id
    } = req.body;

    try {
        // Switch to package database
        await pool.query('USE package');

        // Ensure customer exists (by unique email)
        let customerId;
        const [existingCust] = await pool.query('SELECT customer_id FROM customers WHERE email = ?', [email]);
        if (existingCust.length > 0) {
            customerId = existingCust[0].customer_id;
            // Optionally update name/phone
            await pool.query('UPDATE customers SET name = ?, phone = ? WHERE customer_id = ?', [name, phone, customerId]);
        } else {
            const [custRes] = await pool.query(
                'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
                [name, email, phone]
            );
            customerId = custRes.insertId;
        }

        // Ensure package exists (by name + flight_number + airline + date)
        let packageId;
        const [existingPkg] = await pool.query(
            'SELECT package_id FROM packages WHERE package_name = ? AND flight_number = ? AND airline = ? AND flight_date = ?',
            [package_name, flight_number, airline, flight_date]
        );
        if (existingPkg.length > 0) {
            packageId = existingPkg[0].package_id;
            await pool.query(
                `UPDATE packages SET description = ?, origin = ?, destination = ?, departure_time = ?, arrival_time = ?, duration = ?, stay_details = ?, price = ?, image_url = ?
                 WHERE package_id = ?`,
                [description || null, origin || null, destination || null, departure_time || null, arrival_time || null, duration || null, stay_details || null, price || 0, image_url || null, packageId]
            );
        } else {
            const [pkgRes] = await pool.query(
                `INSERT INTO packages (package_name, description, origin, destination, flight_number, airline, flight_date, departure_time, arrival_time, duration, stay_details, price, image_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [package_name, description || null, origin || null, destination || null, flight_number || null, airline || null, flight_date || travel_date || null,
                 departure_time || null, arrival_time || null, duration || null, stay_details || null, price || 0, image_url || null]
            );
            packageId = pkgRes.insertId;
        }

        // Insert booking compatible with both schemas (with/without payment columns)
        const bookDate = travel_date || flight_date || new Date().toISOString().slice(0,10);
        const amt = Number(price) || 0;

        // Detect columns in bookings table
        const [cols] = await pool.query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings'",
            ['package']
        );
        const set = new Set(cols.map(c => String(c.COLUMN_NAME).toLowerCase()));
        const hasPayment = set.has('payment_mode');
        const hasTxn = set.has('transaction_id');

        let insertSql = '';
        let params = [];
        if (hasPayment && hasTxn) {
            insertSql = `INSERT INTO bookings (customer_id, package_id, travel_date, total_amount, payment_mode, transaction_id) VALUES (?, ?, ?, ?, ?, ?)`;
            params = [customerId, packageId, bookDate, amt, payment_mode || 'UPI', transaction_id || `TXN${Date.now()}`];
        } else {
            insertSql = `INSERT INTO bookings (customer_id, package_id, travel_date, total_amount) VALUES (?, ?, ?, ?)`;
            params = [customerId, packageId, bookDate, amt];
        }
        const [bookRes] = await pool.query(insertSql, params);

        res.status(201).json({
            success: true,
            booking_id: bookRes.insertId,
            customer_id: customerId,
            package_id: packageId,
            message: 'Package booked successfully'
        });
    } catch (error) {
        console.error('Package booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to book package',
            details: error.message
        });
    }
});

// Create or attach a review for a package
app.post('/api/packages/reviews', async (req, res) => {
    const {
        name, email, phone,
        package_name, description, origin, destination, flight_number, airline, flight_date,
        departure_time, arrival_time, duration, stay_details, price, image_url,
        rating, review_text
    } = req.body;
    try {
        await pool.query('USE package');

        // Upsert customer by email
        let customerId;
        const [custRows] = await pool.query('SELECT customer_id FROM customers WHERE email = ?', [email]);
        if (custRows.length) {
            customerId = custRows[0].customer_id;
            await pool.query('UPDATE customers SET name = ?, phone = ? WHERE customer_id = ?', [name || '', phone || '', customerId]);
        } else {
            const [ins] = await pool.query('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [name || '', email, phone || '']);
            customerId = ins.insertId;
        }

        // Upsert package by name + flight_number + airline (+ optional date)
        let packageId;
        const [pkgRows] = await pool.query(
            'SELECT package_id FROM packages WHERE package_name = ? AND (flight_number <=> ?) AND (airline <=> ?) AND (flight_date <=> ?)',
            [package_name, flight_number || null, airline || null, flight_date || null]
        );
        if (pkgRows.length) {
            packageId = pkgRows[0].package_id;
            await pool.query(
                `UPDATE packages SET description = ?, origin = ?, destination = ?, departure_time = ?, arrival_time = ?, duration = ?, stay_details = ?, price = ?, image_url = ?
                 WHERE package_id = ?`,
                [description || null, origin || null, destination || null, departure_time || null, arrival_time || null, duration || null, stay_details || null, Number(price) || 0, image_url || null, packageId]
            );
        } else {
            const [insPkg] = await pool.query(
                `INSERT INTO packages (package_name, description, origin, destination, flight_number, airline, flight_date, departure_time, arrival_time, duration, stay_details, price, image_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [package_name, description || null, origin || null, destination || null, flight_number || null, airline || null, flight_date || null,
                 departure_time || null, arrival_time || null, duration || null, stay_details || null, Number(price) || 0, image_url || null]
            );
            packageId = insPkg.insertId;
        }

        // Insert review
        const rate = Math.max(1, Math.min(5, Number(rating) || 5));
        const [rev] = await pool.query(
            'INSERT INTO reviews (customer_id, package_id, rating, review_text) VALUES (?, ?, ?, ?)',
            [customerId, packageId, rate, review_text || '']
        );

        res.status(201).json({ success: true, review_id: rev.insertId, customer_id: customerId, package_id: packageId });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, error: 'Failed to create review', details: error.message });
    }
});

// List reviews for a package
app.get('/api/packages/:id/reviews', async (req, res) => {
    try {
        await pool.query('USE package');
        const [rows] = await pool.query(
            `SELECT r.review_id, r.rating, r.review_text, r.review_date,
                    c.customer_id, c.name AS customer_name,
                    p.package_id, p.package_name
             FROM reviews r
             JOIN customers c ON r.customer_id = c.customer_id
             JOIN packages p ON r.package_id = p.package_id
             WHERE p.package_id = ?
             ORDER BY r.review_date DESC`,
            [req.params.id]
        );
        res.json({ success: true, reviews: rows });
    } catch (error) {
        console.error('List reviews error:', error);
        res.status(500).json({ success: false, error: 'Failed to get reviews', details: error.message });
    }
});

// Get a package booking (joined data)
app.get('/api/package-bookings/:id', async (req, res) => {
    try {
        await pool.query('USE package');
        const [cols] = await pool.query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings'",
            ['package']
        );
        const set = new Set(cols.map(c => String(c.COLUMN_NAME).toLowerCase()));
        const hasPayment = set.has('payment_mode');
        const hasTxn = set.has('transaction_id');
        const hasBookingTime = set.has('booking_time');
        const paymentSel = hasPayment ? 'b.payment_mode' : "'UPI' AS payment_mode";
        const txnSel = hasTxn ? 'b.transaction_id' : 'NULL AS transaction_id';
        const bookingTimeSel = hasBookingTime ? 'b.booking_time' : 'NULL';
        const sql = `
            SELECT b.booking_id, b.travel_date, b.total_amount, ${paymentSel}, ${txnSel},
                   COALESCE(${bookingTimeSel}, b.booking_date) AS booking_time,
                   c.customer_id, c.name AS customer_name, c.email, c.phone,
                   p.package_id, p.package_name, p.description, p.origin, p.destination, p.flight_number, p.airline, p.flight_date,
                   p.departure_time, p.arrival_time, p.duration, p.stay_details, p.price, p.image_url
            FROM bookings b
            JOIN customers c ON b.customer_id = c.customer_id
            JOIN packages p ON b.package_id = p.package_id
            WHERE b.booking_id = ?`;
        const [rows] = await pool.query(sql, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Package booking not found' });
        }
        res.json({ success: true, booking: rows[0] });
    } catch (error) {
        console.error('Get package booking error:', error);
        res.status(500).json({ success: false, error: 'Failed to get package booking', details: error.message });
    }
});

// Generate PDF for a package booking
app.get('/api/package-bookings/:id/pdf', async (req, res) => {
    try {
        await pool.query('USE package');
        const [cols] = await pool.query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings'",
            ['package']
        );
        const set = new Set(cols.map(c => String(c.COLUMN_NAME).toLowerCase()));
        const hasPayment = set.has('payment_mode');
        const hasTxn = set.has('transaction_id');
        const hasBookingTime = set.has('booking_time');
        const paymentSel = hasPayment ? 'b.payment_mode' : "'UPI' AS payment_mode";
        const txnSel = hasTxn ? 'b.transaction_id' : 'NULL AS transaction_id';
        const bookingTimeSel = hasBookingTime ? 'b.booking_time' : 'NULL';
        const sql = `
            SELECT b.booking_id, b.travel_date, b.total_amount, ${paymentSel}, ${txnSel},
                   COALESCE(${bookingTimeSel}, b.booking_date) AS booking_time,
                   c.name AS customer_name, c.email, c.phone,
                   p.package_name, p.origin, p.destination, p.flight_number, p.airline, p.flight_date,
                   p.departure_time, p.arrival_time, p.duration, p.price
            FROM bookings b
            JOIN customers c ON b.customer_id = c.customer_id
            JOIN packages p ON b.package_id = p.package_id
            WHERE b.booking_id = ?`;
        const [rows] = await pool.query(sql, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Package booking not found' });
        }
        const b = rows[0];

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=package-booking-${b.booking_id}.pdf`);
        doc.pipe(res);

        // Header
        doc.rect(0, 0, doc.page.width, 110).fill('#0ea5e9');
        doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold').text('Jealous Flights', 50, 28);
        doc.fontSize(12).fillColor('#e0f2fe').text('Holiday Package Confirmation', 50, 66);

        // Booking summary
        doc.fillColor('#000').font('Helvetica');
        doc.fontSize(14).font('Helvetica-Bold').text('Booking Summary', 50, 140);
        doc.moveTo(50, 160).lineTo(550, 160).stroke();
        doc.fontSize(11).font('Helvetica')
           .text(`Booking ID: ${b.booking_id}`, 50, 172)
           .text(`Travel Date: ${b.travel_date}`, 50, 188)
           .text(`Payment Mode: ${b.payment_mode}`, 50, 204)
           .text(`Transaction ID: ${b.transaction_id}`, 50, 220);

        // Passenger
        doc.fontSize(14).font('Helvetica-Bold').text('Passenger', 50, 250);
        doc.moveTo(50, 268).lineTo(550, 268).stroke();
        doc.fontSize(11).font('Helvetica')
           .text(`Name: ${b.customer_name}`, 50, 282)
           .text(`Email: ${b.email}`, 50, 298)
           .text(`Phone: ${b.phone}`, 50, 314);

        // Package
        doc.fontSize(14).font('Helvetica-Bold').text('Package Details', 50, 344);
        doc.moveTo(50, 362).lineTo(550, 362).stroke();
        doc.fontSize(11).font('Helvetica')
           .text(`Package: ${b.package_name}`, 50, 376)
           .text(`Route: ${b.origin} → ${b.destination}`, 50, 392)
           .text(`Airline: ${b.airline}`, 50, 408)
           .text(`Flight No: ${b.flight_number}`, 300, 408)
           .text(`Date: ${b.flight_date || b.travel_date}`, 50, 424)
           .text(`Departure: ${b.departure_time || ''}`, 50, 440)
           .text(`Arrival: ${b.arrival_time || ''}`, 300, 440)
           .text(`Duration: ${b.duration || ''}`, 50, 456);

        // Amount
        doc.fontSize(14).font('Helvetica-Bold').text('Payment Details', 50, 486);
        doc.moveTo(50, 504).lineTo(550, 504).stroke();
        doc.fontSize(12).font('Helvetica')
           .text('Total Amount:', 50, 520)
           .font('Helvetica-Bold').fillColor('#10b981').fontSize(16)
           .text(`₹${Number(b.total_amount || b.price || 0).toLocaleString('en-IN')}`, 150, 518);

        // Footer
        doc.fontSize(10).fillColor('#64748b').font('Helvetica')
           .text('Thank you for booking with Jealous Flights. This is an e-confirmation. Please carry a valid ID.', 50, 570);

        doc.end();
    } catch (error) {
        console.error('Package booking PDF error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate package PDF', details: error.message });
    }
});

// Routes
app.get('/', (req, res) => {
    res.send('Flight Booking API is running...');
});

// ================== USER ROUTES ==================

// Register User (aligned with user.sql: id, name, email, number)
app.post('/register', async (req, res) => {
    const { name, email, number } = req.body;
    
    try {
        // Switch to travelsease_db
        await pool.query('USE travelsease_db');
        
        // Check if user already exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'User with this email already exists' 
            });
        }
        
        const [result] = await pool.query(
            'INSERT INTO users (name, email, number) VALUES (?, ?, ?)',
            [name, email, number]
        );
        
        // Get the created user
        const [users] = await pool.query(
            'SELECT id, name, email, number FROM users WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ 
            success: true, 
            user: users[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Registration failed',
            details: error.message 
        });
    }
});

// Login User (aligned with user.sql)
app.post('/login', async (req, res) => {
    const { email } = req.body;
    
    try {
        // Switch to travelsease_db
        await pool.query('USE travelsease_db');
        
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        const user = users[0];
        
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                number: user.number
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Login failed',
            details: error.message 
        });
    }
});

// Get User Profile (aligned with user.sql)
app.get('/api/users/:id', async (req, res) => {
    try {
        // Switch to travelsease_db
        await pool.query('USE travelsease_db');
        
        const [users] = await pool.query(
            'SELECT id, name, email, number FROM users WHERE id = ?', 
            [req.params.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        res.json({ 
            success: true, 
            user: users[0] 
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get user',
            details: error.message 
        });
    }
});

// ================== FLIGHT ROUTES ==================

// Search Flights (aligned with flight.sql)
app.get('/api/flights/search', async (req, res) => {
    // Accept both 'arrival' and 'destination' for backward compatibility
    const { departure, arrival, destination, date } = req.query;
    const arrivalCity = arrival || destination;
    
    if (!departure || !arrivalCity) {
        return res.status(400).json({ 
            success: false, 
            error: 'Departure and arrival/destination locations are required' 
        });
    }

    try {
        // Switch to flights_dashboard
        await pool.query('USE flights_dashboard');
        // Map of airport codes to city names (case-insensitive)
        const cityMap = {
            'del': 'Delhi',
            'bom': 'Mumbai',
            'maa': 'Chennai',
            'blr': 'Bangalore',
            'goi': 'Goa',
            'ccu': 'Kolkata',
            'pnq': 'Pune'
        };

        // Convert airport codes to city names if needed
        const fromCity = cityMap[departure.toLowerCase()] || departure;
        const toCity = cityMap[arrivalCity.toLowerCase()] || arrivalCity;
        const searchDate = date || new Date().toISOString().split('T')[0];

        console.log(`Searching flights from ${fromCity} to ${toCity} on ${searchDate}`);
        
        const [flights] = await pool.query(
            `SELECT * FROM flights 
             WHERE (source LIKE ? OR source = ?)
             AND (destination LIKE ? OR destination = ?)
             AND DATE(departure_time) = ?`,
            [
                `%${fromCity}%`, fromCity,
                `%${toCity}%`, toCity,
                searchDate
            ]
        );
        
        console.log(`Searching: ${fromCity} -> ${toCity} on ${searchDate}`);
        console.log(`Found ${flights.length} flights`);
        
        // If no flights found, log available flights for debugging
        if (flights.length === 0) {
            const [allFlights] = await pool.query('SELECT source, destination, DATE(departure_time) as date FROM flights LIMIT 5');
            console.log('Sample available flights:', allFlights);
        }
        
        const formattedFlights = flights.map(flight => ({
            ...flight,
            price: flight.price || 5000, // Default price if NULL
            departure_time: flight.departure_time ? new Date(flight.departure_time).toISOString() : null,
            arrival_time: flight.arrival_time ? new Date(flight.arrival_time).toISOString() : null,
            duration: flight.duration || '2h 30m', // Default duration if not provided
            from: flight.source,  // Add alias for frontend
            to: flight.destination,  // Add alias for frontend
            id: flight.flight_id  // Ensure ID is included
        }));

        res.json({ 
            success: true, 
            flights: formattedFlights
        });
    } catch (error) {
        console.error('Search flights error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to search flights',
            details: error.message,
            query: req.query
        });
    }
});

// Get Flight Details
app.get('/api/flights/:id', async (req, res) => {
    try {
        // Switch to flights_dashboard
        await pool.query('USE flights_dashboard');
        const [flights] = await pool.query(
            'SELECT * FROM flights WHERE flight_id = ?', 
            [req.params.id]
        );
        
        if (flights.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Flight not found' 
            });
        }

        const flight = flights[0];
        const departureTime = flight.departure_time ? new Date(flight.departure_time) : null;
        const arrivalTime = flight.arrival_time ? new Date(flight.arrival_time) : null;
        
        // Calculate duration if both times are available
        let duration = '2h 30m'; // Default duration
        if (departureTime && arrivalTime) {
            const diffMs = arrivalTime - departureTime;
            const diffHrs = Math.floor(diffMs / 3600000); // hours
            const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
            duration = `${diffHrs}h ${diffMins}m`;
        }

        const response = {
            ...flight,
            id: flight.flight_id,
            flight_number: flight.flight_number || 'N/A',
            airline: flight.airline || 'Airline',
            from: flight.source,
            to: flight.destination,
            departure_time: departureTime ? departureTime.toISOString() : null,
            arrival_time: arrivalTime ? arrivalTime.toISOString() : null,
            duration: duration,
            price: flight.price || 5000,
            status: flight.status || 'Scheduled',
            // Add more fields as needed by your frontend
            departure_date: departureTime ? departureTime.toISOString().split('T')[0] : null,
            departure_time_formatted: departureTime ? departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
            arrival_time_formatted: arrivalTime ? arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute:2, hour12: false }) : null
        };

        res.json({ 
            success: true, 
            flight: response
        });
    } catch (error) {
        console.error('Get flight error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get flight details',
            details: error.message 
        });
    }
});

// ================== HOTEL ROUTES ==================

// Search Hotels (aligned with hotel.sql: city, not location)
app.get('/api/hotels/search', async (req, res) => {
    const { location, city, check_in, check_out, guests } = req.query;
    
    try {
        // Switch to hotels_dashboard
        await pool.query('USE hotels_dashboard');
        
        // Use city parameter if provided, otherwise use location for backward compatibility
        const searchCity = city || location;
        
        const [hotels] = await pool.query(
            `SELECT hotel_id, hotel_name, city, price_per_night, rating, image_url, availability 
             FROM hotels 
             WHERE city LIKE ?`,
            [`%${searchCity}%`]
        );
        
        res.json({ 
            success: true, 
            hotels: hotels
        });
    } catch (error) {
        console.error('Search hotels error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to search hotels',
            details: error.message
        });
    }
});

// Get Hotel Details (aligned with hotel.sql)
app.get('/api/hotels/:id', async (req, res) => {
    try {
        // Switch to hotels_dashboard
        await pool.query('USE hotels_dashboard');
        
        const [hotels] = await pool.query(
            'SELECT hotel_id, hotel_name, city, price_per_night, rating, image_url, availability FROM hotels WHERE hotel_id = ?', 
            [req.params.id]
        );
        
        if (hotels.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Hotel not found' 
            });
        }
        
        res.json({ 
            success: true, 
            hotel: hotels[0]
        });
    } catch (error) {
        console.error('Get hotel error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get hotel',
            details: error.message 
        });
    }
});

// ================== BOOKING ROUTES ==================

// Book Seat (aligned with booking.sql: ticket table)
app.post('/api/book-seat', async (req, res) => {
    const { 
        pnr_no, flight_no, passenger_name, class_type, seat_no, 
        date, source, destination, departure_time, arrival_time, 
        fare, payment_mode, transaction_id, amount 
    } = req.body;
    
    try {
        // Switch to flight_booking database
        await pool.query('USE flight_booking');
        
        // Check if PNR already exists
        const [existing] = await pool.query('SELECT * FROM ticket WHERE pnr_no = ?', [pnr_no]);
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'PNR already exists' 
            });
        }
        
        const [result] = await pool.query(
            `INSERT INTO ticket (pnr_no, flight_no, passenger_name, class_type, seat_no, 
                                date, source, destination, departure_time, arrival_time, 
                                fare, payment_mode, transaction_id, amount) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [pnr_no, flight_no, passenger_name, class_type, seat_no, 
             date, source, destination, departure_time, arrival_time, 
             fare, payment_mode, transaction_id, amount]
        );
        
        res.status(201).json({ 
            success: true, 
            ticket_id: result.insertId,
            pnr_no: pnr_no,
            message: 'Seat booked successfully'
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to book seat',
            details: error.message 
        });
    }
});

// Get Ticket by PNR
app.get('/api/ticket/:pnr', async (req, res) => {
    try {
        // Switch to flight_booking database
        await pool.query('USE flight_booking');
        
        const [tickets] = await pool.query(
            'SELECT * FROM ticket WHERE pnr_no = ?',
            [req.params.pnr]
        );
        
        if (tickets.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Ticket not found' 
            });
        }
        
        res.json({ 
            success: true, 
            ticket: tickets[0]
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get ticket',
            details: error.message 
        });
    }
});

// Generate PDF Ticket
app.get('/api/ticket/:pnr/pdf', async (req, res) => {
    try {
        // Switch to flight_booking database
        await pool.query('USE flight_booking');
        
        const [tickets] = await pool.query(
            'SELECT * FROM ticket WHERE pnr_no = ?',
            [req.params.pnr]
        );
        
        if (tickets.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Ticket not found' 
            });
        }
        
        const ticket = tickets[0];
        
        // Create PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.pnr_no}.pdf`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add content to PDF
        // Header with background
        doc.rect(0, 0, doc.page.width, 120).fill('#2563eb');
        
        // Logo/Title
        doc.fontSize(32).fillColor('#ffffff').font('Helvetica-Bold')
           .text('SkyWings Airlines', 50, 30);
        doc.fontSize(14).fillColor('#e0f2fe')
           .text('Your Journey Begins Here', 50, 70);
        
        // Ticket Type
        doc.fontSize(10).fillColor('#ffffff')
           .text('E-TICKET', doc.page.width - 150, 40);
        
        // Reset to black for body
        doc.fillColor('#000000');
        
        // PNR Section
        doc.fontSize(12).font('Helvetica-Bold')
           .text('PNR Number:', 50, 150);
        doc.fontSize(16).fillColor('#2563eb')
           .text(ticket.pnr_no, 200, 148);
        
        // Passenger Details Section
        doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
           .text('Passenger Details', 50, 190);
        doc.moveTo(50, 210).lineTo(550, 210).stroke();
        
        doc.fontSize(11).font('Helvetica')
           .text('Name:', 50, 225)
           .font('Helvetica-Bold')
           .text(ticket.passenger_name, 200, 225);
        
        doc.font('Helvetica')
           .text('Class:', 50, 245)
           .font('Helvetica-Bold')
           .text(ticket.class_type, 200, 245);
        
        doc.font('Helvetica')
           .text('Seat Number:', 50, 265)
           .font('Helvetica-Bold')
           .text(ticket.seat_no, 200, 265);
        
        // Flight Details Section
        doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
           .text('Flight Details', 50, 310);
        doc.moveTo(50, 330).lineTo(550, 330).stroke();
        
        doc.fontSize(11).font('Helvetica')
           .text('Flight Number:', 50, 345)
           .font('Helvetica-Bold')
           .text(ticket.flight_no, 200, 345);
        
        doc.font('Helvetica')
           .text('Date:', 50, 365)
           .font('Helvetica-Bold')
           .text(new Date(ticket.date).toLocaleDateString('en-IN', { 
               weekday: 'long', 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
           }), 200, 365);
        
        // Journey Details in a box
        doc.rect(50, 400, 500, 120).stroke();
        
        // From
        doc.fontSize(10).font('Helvetica').fillColor('#666666')
           .text('FROM', 70, 420);
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000')
           .text(ticket.source, 70, 440);
        doc.fontSize(12).font('Helvetica').fillColor('#2563eb')
           .text(ticket.departure_time, 70, 470);
        
        // Arrow
        doc.fontSize(24).fillColor('#2563eb')
           .text('→', 270, 445);
        
        // To
        doc.fontSize(10).font('Helvetica').fillColor('#666666')
           .text('TO', 350, 420);
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000')
           .text(ticket.destination, 350, 440);
        doc.fontSize(12).font('Helvetica').fillColor('#2563eb')
           .text(ticket.arrival_time, 350, 470);
        
        // Payment Details Section
        doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
           .text('Payment Details', 50, 550);
        doc.moveTo(50, 570).lineTo(550, 570).stroke();
        
        doc.fontSize(11).font('Helvetica')
           .text('Fare:', 50, 585)
           .font('Helvetica-Bold')
           .text(`₹${Number(ticket.fare).toLocaleString('en-IN')}`, 200, 585);
        
        doc.font('Helvetica')
           .text('Payment Mode:', 50, 605)
           .font('Helvetica-Bold')
           .text(ticket.payment_mode, 200, 605);
        
        doc.font('Helvetica')
           .text('Transaction ID:', 50, 625)
           .font('Helvetica-Bold')
           .text(ticket.transaction_id, 200, 625);
        
        doc.font('Helvetica')
           .text('Total Amount:', 50, 645)
           .font('Helvetica-Bold').fontSize(14).fillColor('#10b981')
           .text(`₹${Number(ticket.amount).toLocaleString('en-IN')}`, 200, 643);
        
        // Footer
        doc.fontSize(10).fillColor('#666666').font('Helvetica')
           .text('Booking Time: ' + new Date(ticket.booking_time).toLocaleString('en-IN'), 50, 700);
        
        // Important Notice
        doc.rect(50, 730, 500, 60).fillAndStroke('#fef3c7', '#f59e0b');
        doc.fontSize(9).fillColor('#92400e').font('Helvetica-Bold')
           .text('Important:', 60, 740);
        doc.font('Helvetica')
           .text('Please carry a valid photo ID proof. Check-in closes 45 minutes before departure.', 60, 755)
           .text('This is an electronic ticket. Please carry a printout or show on mobile.', 60, 770);
        
        // Finalize PDF
        doc.end();
        
    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate ticket PDF',
            details: error.message 
        });
    }
});

// Create Booking (legacy route for compatibility)
app.post('/api/bookings', async (req, res) => {
    const { user_id, flight_id, hotel_id, check_in, check_out, total_amount, passengers } = req.body;
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        // Create booking
        const [bookingResult] = await connection.query(
            'INSERT INTO bookings (user_id, flight_id, hotel_id, check_in, check_out, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, flight_id, hotel_id, check_in, check_out, total_amount, 'confirmed']
        );
        
        const bookingId = bookingResult.insertId;
        
        // Add passengers if it's a flight booking
        if (flight_id && passengers && passengers.length > 0) {
            for (const passenger of passengers) {
                await connection.query(
                    'INSERT INTO booking_passengers (booking_id, name, age, gender, seat_number) VALUES (?, ?, ?, ?, ?)',
                    [bookingId, passenger.name, passenger.age, passenger.gender, passenger.seat_number]
                );
            }
        }
        
        await connection.commit();
        
        res.status(201).json({ 
            success: true, 
            booking_id: bookingId,
            message: 'Booking created successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create booking error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create booking',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get Booking Details
app.get('/api/bookings/:id', async (req, res) => {
    try {
        // Get booking details
        const [bookings] = await pool.query(
            `SELECT b.*, 
                    f.flight_number, f.airline, f.source, f.destination, f.departure_time, f.arrival_time,
                    h.hotel_name, h.location
             FROM bookings b
             LEFT JOIN flights f ON b.flight_id = f.flight_id
             LEFT JOIN hotels h ON b.hotel_id = h.hotel_id
             WHERE b.booking_id = ?`,
            [req.params.id]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Booking not found' 
            });
        }
        
        const booking = bookings[0];
        
        // Get passengers if it's a flight booking
        let passengers = [];
        if (booking.flight_id) {
            const [passengerRows] = await pool.query(
                'SELECT * FROM booking_passengers WHERE booking_id = ?',
                [req.params.id]
            );
            passengers = passengerRows;
        }
        
        // Format dates for response
        const formattedBooking = {
            ...booking,
            check_in: booking.check_in ? new Date(booking.check_in).toISOString() : null,
            check_out: booking.check_out ? new Date(booking.check_out).toISOString() : null,
            departure_time: booking.departure_time ? new Date(booking.departure_time).toISOString() : null,
            arrival_time: booking.arrival_time ? new Date(booking.arrival_time).toISOString() : null,
            passengers
        };
        
        res.json({ 
            success: true, 
            booking: formattedBooking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get booking',
            details: error.message 
        });
    }
});

// Get User Bookings
app.get('/api/users/:id/bookings', async (req, res) => {
    try {
        const [bookings] = await pool.query(
            `SELECT b.*, 
                    f.flight_number, f.airline, f.source, f.destination,
                    h.hotel_name, h.location
             FROM bookings b
             LEFT JOIN flights f ON b.flight_id = f.flight_id
             LEFT JOIN hotels h ON b.hotel_id = h.hotel_id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC`,
            [req.params.id]
        );
        
        res.json({ 
            success: true, 
            bookings: bookings.map(booking => ({
                ...booking,
                check_in: booking.check_in ? new Date(booking.check_in).toISOString() : null,
                check_out: booking.check_out ? new Date(booking.check_out).toISOString() : null,
                booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString() : null
            }))
        });
    } catch (error) {
        console.error('Get user bookings error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get user bookings',
            details: error.message 
        });
    }
});

// Cancel Booking
app.put('/api/bookings/:id/cancel', async (req, res) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        // Check if booking exists and is not already cancelled
        const [bookings] = await connection.query(
            'SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE',
            [req.params.id]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Booking not found' 
            });
        }
        
        const booking = bookings[0];
        
        if (booking.status === 'cancelled') {
            return res.status(400).json({ 
                success: false, 
                error: 'Booking is already cancelled' 
            });
        }
        
        // Update booking status to cancelled
        await connection.query(
            'UPDATE bookings SET status = ? WHERE booking_id = ?',
            ['cancelled', req.params.id]
        );
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            message: 'Booking cancelled successfully' 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel booking error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to cancel booking',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// ================== SEAT SELECTION ==================

// Get Booked Seats for a Flight
app.get('/api/flights/:id/seats', async (req, res) => {
    try {
        const [seats] = await pool.query(
            `SELECT bp.seat_number 
             FROM booking_passengers bp 
             JOIN bookings b ON bp.booking_id = b.booking_id 
             WHERE b.flight_id = ? AND b.status != 'cancelled'`,
            [req.params.id]
        );
        
        res.json({ 
            success: true, 
            bookedSeats: seats.map(s => s.seat_number) 
        });
    } catch (error) {
        console.error('Get booked seats error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get booked seats',
            details: error.message 
        });
    }
});
// Deals (Last-Minute) Booking Routes (deals.deals)
app.post('/api/deals/book', async (req, res) => {
    const {
        customer_name, email, phone, id_type, government_id, age,
        airline, flight_number, origin, destination, flight_date,
        departure_time, arrival_time, duration, base_price,
        discount_name, discount_percent,
        travel_date, total_amount, payment_method
    } = req.body;
    try {
        await pool.query('USE deals');

        // Detect available columns
        const [cols] = await pool.query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'deals' AND TABLE_NAME = 'deals'"
        );
        const set = new Set(cols.map(c => String(c.COLUMN_NAME).toLowerCase()));
        const hasAge = set.has('age');

        const columns = [
            'customer_name','email','phone','id_type','government_id',
            ...(hasAge ? ['age'] : []),
            'airline','flight_number','origin','destination','flight_date',
            'departure_time','arrival_time','duration','base_price',
            'discount_name','discount_percent',
            'travel_date','total_amount','payment_method','payment_status'
        ];
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO deals (${columns.join(', ')}) VALUES (${placeholders})`;

        // Convert ISO dates to MySQL DATE format (YYYY-MM-DD)
        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            try {
                const d = new Date(dateStr);
                return d.toISOString().slice(0, 10);
            } catch {
                return null;
            }
        };

        const params = [
            customer_name || '', email || '', phone || '', id_type || 'Aadhaar', government_id || '',
            ...(hasAge ? [Number(age) || null] : []),
            airline || '', flight_number || null, origin || '', destination || '', formatDate(flight_date),
            departure_time || null, arrival_time || null, duration || null, Number(base_price) || 0,
            discount_name || 'None', Number(discount_percent) || 0,
            formatDate(travel_date || flight_date) || new Date().toISOString().slice(0,10),
            Number(total_amount) || 0,
            payment_method || 'UPI',
            'Completed'
        ];

        const [ins] = await pool.query(sql, params);
        res.status(201).json({ success: true, deal_id: ins.insertId });
    } catch (error) {
        console.error('Deals booking error:', error);
        res.status(500).json({ success: false, error: 'Failed to store deal booking', details: error.message });
    }
});

app.get('/api/deals/bookings/:id/pdf', async (req, res) => {
    try {
        await pool.query('USE deals');
        const [rows] = await pool.query('SELECT * FROM deals WHERE deal_id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success:false, error:'Deal booking not found' });
        const b = rows[0];

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=deal-booking-${b.deal_id}.pdf`);
        doc.pipe(res);

        // Header
        doc.rect(0, 0, doc.page.width, 110).fill('#1d4ed8');
        doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold').text('Jealous Flights', 50, 28);
        doc.fontSize(12).fillColor('#bfdbfe').text('Last-Minute Deal Ticket', 50, 66);

        // Booking summary
        doc.fillColor('#000');
        doc.fontSize(14).font('Helvetica-Bold').text('Booking Summary', 50, 140);
        doc.moveTo(50, 160).lineTo(550, 160).stroke();
        doc.fontSize(11).font('Helvetica')
           .text(`Booking ID: ${b.deal_id}`, 50, 172)
           .text(`Booking Date: ${new Date(b.booking_date).toLocaleString('en-IN')}`, 50, 188)
           .text(`Payment Method: ${b.payment_method}`, 50, 204)
           .text(`Payment Status: ${b.payment_status}`, 50, 220);

        // Passenger
        doc.fontSize(14).font('Helvetica-Bold').text('Passenger', 50, 250);
        doc.moveTo(50, 268).lineTo(550, 268).stroke();
        doc.fontSize(11).font('Helvetica')
           .text(`Name: ${b.customer_name}`, 50, 282)
           .text(`Email: ${b.email}`, 50, 298)
           .text(`Phone: ${b.phone}`, 50, 314)
           .text(`ID: ${b.id_type} - ${b.government_id}`, 50, 330);

        // Flight
        doc.fontSize(14).font('Helvetica-Bold').text('Flight Details', 50, 360);
        doc.moveTo(50, 378).lineTo(550, 378).stroke();
        doc.fontSize(11).font('Helvetica')
           .text(`Airline: ${b.airline}`, 50, 392)
           .text(`Flight No: ${b.flight_number || '—'}`, 50, 408)
           .text(`Route: ${b.origin} → ${b.destination}`, 50, 424)
           .text(`Date: ${b.flight_date || b.travel_date}`, 50, 440)
           .text(`Departure: ${b.departure_time || ''}`, 50, 456)
           .text(`Arrival: ${b.arrival_time || ''}`, 300, 456)
           .text(`Duration: ${b.duration || ''}`, 50, 472);

        // Amounts
        doc.fontSize(14).font('Helvetica-Bold').text('Fare Summary', 50, 502);
        doc.moveTo(50, 520).lineTo(550, 520).stroke();
        const baseAmt = Number(b.base_price || 0);
        const discPct = Number(b.discount_percent || 0);
        const discAmt = Math.round(baseAmt * discPct / 100);
        const finalAmt = Number(b.total_amount || 0);
        doc.fontSize(12).font('Helvetica')
           .text(`Base Fare: ₹${baseAmt.toLocaleString('en-IN')}`, 50, 536)
           .text(`Discount (${b.discount_name || 'None'} - ${discPct}%): -₹${discAmt.toLocaleString('en-IN')}`, 50, 552)
           .font('Helvetica-Bold').fillColor('#10b981').fontSize(16)
           .text(`Total: ₹${finalAmt.toLocaleString('en-IN')}`, 50, 576);

        doc.end();
    } catch (error) {
        console.error('Deals PDF error:', error);
        res.status(500).json({ success:false, error:'Failed to generate deal PDF', details:error.message });
    }
});

// ================== ADMIN ROUTES ==================

// Get all users from travelsease_db
app.get('/api/admin/users', async (req, res) => {
    try {
        await pool.query('USE travelsease_db');
        const [users] = await pool.query('SELECT * FROM users ORDER BY id DESC');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users', details: error.message });
    }
});

// Get all flight bookings from flight_booking
app.get('/api/admin/bookings', async (req, res) => {
    try {
        await pool.query('USE flight_booking');
        const [bookings] = await pool.query('SELECT * FROM ticket ORDER BY booking_time DESC');
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Admin get bookings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings', details: error.message });
    }
});

// Book a hotel (save customer details)
app.post('/api/hotels/book', async (req, res) => {
    const { customer_name, email, phone, hotel_id, check_in, check_out, guests, rooms } = req.body;
    
    try {
        await pool.query('USE hotels_dashboard');
        
        // Insert customer booking
        const [result] = await pool.query(
            'INSERT INTO customers (customer_name, email, phone, hotel_id, check_in, check_out, guests, rooms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [customer_name, email, phone, hotel_id, check_in, check_out, guests, rooms]
        );
        
        res.status(201).json({
            success: true,
            customer_id: result.insertId,
            message: 'Hotel booked successfully'
        });
    } catch (error) {
        console.error('Hotel booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to book hotel',
            details: error.message
        });
    }
});

// Get all hotel bookings with customer details
app.get('/api/admin/hotel-bookings', async (req, res) => {
    try {
        await pool.query('USE hotels_dashboard');
        const [bookings] = await pool.query(`
            SELECT c.customer_id, c.customer_name, c.email, c.phone, c.check_in, c.check_out, c.guests, c.rooms,
                   h.hotel_id, h.hotel_name, h.city, h.price_per_night, h.rating
            FROM customers c
            JOIN hotels h ON c.hotel_id = h.hotel_id
            ORDER BY c.customer_id DESC
        `);
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Admin get hotel bookings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch hotel bookings', details: error.message });
    }
});

// Get all hotels from hotels_dashboard
app.get('/api/admin/hotels', async (req, res) => {
    try {
        await pool.query('USE hotels_dashboard');
        const [hotels] = await pool.query('SELECT * FROM hotels ORDER BY hotel_id DESC');
        res.json({ success: true, data: hotels });
    } catch (error) {
        console.error('Admin get hotels error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch hotels', details: error.message });
    }
});

// Get all packages (for holiday.html display)
app.get('/api/packages', async (req, res) => {
    try {
        await pool.query('USE package');
        const [packages] = await pool.query('SELECT * FROM packages ORDER BY package_id DESC');
        res.json({ success: true, packages: packages });
    } catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch packages', details: error.message });
    }
});

// Get all deals (for last-minute-deals.html display)
app.get('/api/deals', async (req, res) => {
    try {
        await pool.query('USE deals');
        const [deals] = await pool.query('SELECT * FROM deals ORDER BY deal_id DESC');
        res.json({ success: true, deals: deals });
    } catch (error) {
        console.error('Get deals error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch deals', details: error.message });
    }
});

// Get all hotels (for hotel.html display)
app.get('/api/hotels', async (req, res) => {
    try {
        await pool.query('USE hotels_dashboard');
        const [hotels] = await pool.query('SELECT * FROM hotels ORDER BY hotel_id DESC');
        res.json({ success: true, hotels: hotels });
    } catch (error) {
        console.error('Get hotels error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch hotels', details: error.message });
    }
});

// Get all package bookings from package
app.get('/api/admin/packages', async (req, res) => {
    try {
        await pool.query('USE package');
        const [bookings] = await pool.query(`
            SELECT b.*, c.name as customer_name, c.email, c.phone, 
                   p.package_name, p.price, p.destination, p.origin
            FROM bookings b
            JOIN customers c ON b.customer_id = c.customer_id
            JOIN packages p ON b.package_id = p.package_id
            ORDER BY b.booking_id DESC
        `);
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Admin get packages error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch packages', details: error.message });
    }
});

// Get all deals from deals database
app.get('/api/admin/deals', async (req, res) => {
    try {
        await pool.query('USE deals');
        const [deals] = await pool.query('SELECT * FROM deals ORDER BY deal_id DESC');
        res.json({ success: true, data: deals });
    } catch (error) {
        console.error('Admin get deals error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch deals', details: error.message });
    }
});

// Get all deal bookings (customers who booked deals)
app.get('/api/admin/deal-bookings', async (req, res) => {
    try {
        await pool.query('USE deals');
        const [bookings] = await pool.query(`
            SELECT * FROM deals 
            WHERE customer_name IS NOT NULL 
            ORDER BY booking_date DESC
        `);
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Admin get deal bookings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch deal bookings', details: error.message });
    }
});

// Get all reviews from package database
app.get('/api/admin/reviews', async (req, res) => {
    try {
        await pool.query('USE package');
        const [reviews] = await pool.query(`
            SELECT r.*, c.name as customer_name, c.email, 
                   p.package_name
            FROM reviews r
            JOIN customers c ON r.customer_id = c.customer_id
            JOIN packages p ON r.package_id = p.package_id
            ORDER BY r.review_date DESC
        `);
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('Admin get reviews error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews', details: error.message });
    }
});

// Get dashboard statistics
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Get flight bookings count
        await pool.query('USE flight_booking');
        const [ticketCount] = await pool.query('SELECT COUNT(*) as count FROM ticket');
        
        // Get hotel bookings count
        await pool.query('USE hotels_dashboard');
        const [hotelCount] = await pool.query('SELECT COUNT(*) as count FROM customers');
        
        // Get package bookings count
        await pool.query('USE package');
        const [packageCount] = await pool.query('SELECT COUNT(*) as count FROM bookings');
        
        // Get average rating
        const [avgRating] = await pool.query('SELECT AVG(rating) as avg_rating FROM reviews');
        
        // Get deals count
        await pool.query('USE deals');
        const [dealsCount] = await pool.query('SELECT COUNT(*) as count FROM deals');
        
        res.json({
            success: true,
            stats: {
                totalTickets: ticketCount[0].count,
                totalHotels: hotelCount[0].count,
                totalPackages: packageCount[0].count,
                avgRating: parseFloat(avgRating[0].avg_rating || 0).toFixed(1),
                totalDeals: dealsCount[0].count
            }
        });
    } catch (error) {
        console.error('Admin get stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats', details: error.message });
    }
});

// Get revenue breakdown
app.get('/api/admin/revenue', async (req, res) => {
    try {
        const revenue = {};
        
        // 1. Flight Revenue
        await pool.query('USE flight_booking');
        const [flightRev] = await pool.query('SELECT SUM(amount) as total FROM ticket');
        revenue.flights = parseFloat(flightRev[0].total) || 0;
        
        // 2. Hotel Revenue
        await pool.query('USE hotels_dashboard');
        const [hotelBookings] = await pool.query(`
            SELECT SUM(h.price_per_night * DATEDIFF(c.check_out, c.check_in) * c.rooms) as total
            FROM customers c
            JOIN hotels h ON c.hotel_id = h.hotel_id
        `);
        revenue.hotels = parseFloat(hotelBookings[0].total) || 0;
        
        // 3. Package Revenue
        await pool.query('USE package');
        const [packageRev] = await pool.query(`
            SELECT SUM(p.price) as total
            FROM bookings b
            JOIN packages p ON b.package_id = p.package_id
        `);
        revenue.packages = parseFloat(packageRev[0].total) || 0;
        
        // 4. Deal Revenue
        await pool.query('USE deals');
        const [dealRev] = await pool.query(`
            SELECT SUM(total_amount) as total
            FROM deals
            WHERE customer_name IS NOT NULL
        `);
        revenue.deals = parseFloat(dealRev[0].total) || 0;
        
        // Calculate totals
        revenue.total = revenue.flights + revenue.hotels + revenue.packages + revenue.deals;
        
        // Calculate Profit & Loss (assuming 30% operational costs)
        revenue.costs = revenue.total * 0.30;
        revenue.profit = revenue.total * 0.70;
        revenue.profitMargin = 70;
        
        res.json({ success: true, revenue });
    } catch (error) {
        console.error('Revenue error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch revenue', details: error.message });
    }
});

// Get analytics insights
app.get('/api/admin/analytics', async (req, res) => {
    try {
        const analytics = {};
        
        // 1. Most Popular Routes (Flight Bookings)
        await pool.query('USE flight_booking');
        const [popularRoutes] = await pool.query(`
            SELECT source, destination, COUNT(*) as booking_count
            FROM ticket
            GROUP BY source, destination
            ORDER BY booking_count DESC
            LIMIT 5
        `);
        analytics.popularRoutes = popularRoutes;
        
        // 2. Least Popular Routes
        const [leastPopularRoutes] = await pool.query(`
            SELECT source, destination, COUNT(*) as booking_count
            FROM ticket
            GROUP BY source, destination
            ORDER BY booking_count ASC
            LIMIT 5
        `);
        analytics.leastPopularRoutes = leastPopularRoutes;
        
        // 3. Max Tickets Sold (by route)
        const [maxTickets] = await pool.query(`
            SELECT source, destination, COUNT(*) as total_tickets
            FROM ticket
            GROUP BY source, destination
            ORDER BY total_tickets DESC
            LIMIT 1
        `);
        analytics.maxTickets = maxTickets[0] || null;
        
        // 4. Top Packages
        await pool.query('USE package');
        const [topPackages] = await pool.query(`
            SELECT p.package_name, p.destination, COUNT(b.booking_id) as booking_count
            FROM packages p
            LEFT JOIN bookings b ON p.package_id = b.package_id
            GROUP BY p.package_id, p.package_name, p.destination
            ORDER BY booking_count DESC
            LIMIT 5
        `);
        analytics.topPackages = topPackages;
        
        // 5. Most Preferred Deals
        await pool.query('USE deals');
        const [topDeals] = await pool.query(`
            SELECT 
                discount_name, 
                destination,
                SUM(CASE WHEN customer_name IS NOT NULL THEN 1 ELSE 0 END) as booking_count
            FROM deals
            WHERE discount_name IS NOT NULL
            GROUP BY discount_name, destination
            ORDER BY booking_count DESC, discount_name ASC
            LIMIT 5
        `);
        analytics.topDeals = topDeals;
        
        // 6. AI Predictions (based on trends)
        await pool.query('USE flight_booking');
        const [recentBookings] = await pool.query(`
            SELECT source, destination, COUNT(*) as count
            FROM ticket
            GROUP BY source, destination
            ORDER BY count DESC
            LIMIT 3
        `);
        
        // Generate AI predictions
        const predictions = [];
        if (recentBookings.length > 0) {
            const topRoute = recentBookings[0];
            predictions.push({
                type: 'trending',
                message: `${topRoute.source} → ${topRoute.destination} is the most popular route with ${topRoute.count} total bookings`,
                confidence: 'High'
            });
            
            if (recentBookings.length > 1) {
                const secondRoute = recentBookings[1];
                predictions.push({
                    type: 'emerging',
                    message: `${secondRoute.source} → ${secondRoute.destination} is gaining popularity (${secondRoute.count} bookings)`,
                    confidence: 'Medium'
                });
            }
        }
        
        // Revenue prediction
        const [totalRevenue] = await pool.query(`
            SELECT SUM(amount) as revenue, COUNT(*) as total_bookings
            FROM ticket
        `);
        
        if (totalRevenue[0].revenue && totalRevenue[0].total_bookings > 0) {
            const avgPerBooking = totalRevenue[0].revenue / totalRevenue[0].total_bookings;
            predictions.push({
                type: 'revenue',
                message: `Average revenue per booking: ₹${Math.round(avgPerBooking).toLocaleString()}`,
                confidence: 'High'
            });
        }
        
        // Growth prediction based on current data
        const totalBookings = totalRevenue[0].total_bookings || 0;
        if (totalBookings > 5) {
            predictions.push({
                type: 'growth',
                message: `With ${totalBookings} bookings, you're on track for strong growth. Consider adding more routes!`,
                confidence: 'Medium'
            });
        }
        
        analytics.aiPredictions = predictions;
        
        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics', details: error.message });
    }
});

// ================== CRUD OPERATIONS FOR ADMIN ==================

// === HOTELS CRUD ===
// Add new hotel
app.post('/api/admin/hotels', async (req, res) => {
    const { hotel_name, city, price_per_night, rating, image_url, availability } = req.body;
    try {
        await pool.query('USE hotels_dashboard');
        const [result] = await pool.query(
            'INSERT INTO hotels (hotel_name, city, price_per_night, rating, image_url, availability) VALUES (?, ?, ?, ?, ?, ?)',
            [hotel_name, city, price_per_night, rating, image_url || null, availability || 'Available']
        );
        res.status(201).json({ success: true, hotel_id: result.insertId, message: 'Hotel added successfully' });
    } catch (error) {
        console.error('Add hotel error:', error);
        res.status(500).json({ success: false, error: 'Failed to add hotel', details: error.message });
    }
});

// Update hotel
app.put('/api/admin/hotels/:id', async (req, res) => {
    const { hotel_name, city, price_per_night, rating, image_url, availability } = req.body;
    try {
        await pool.query('USE hotels_dashboard');
        await pool.query(
            'UPDATE hotels SET hotel_name = ?, city = ?, price_per_night = ?, rating = ?, image_url = ?, availability = ? WHERE hotel_id = ?',
            [hotel_name, city, price_per_night, rating, image_url, availability, req.params.id]
        );
        res.json({ success: true, message: 'Hotel updated successfully' });
    } catch (error) {
        console.error('Update hotel error:', error);
        res.status(500).json({ success: false, error: 'Failed to update hotel', details: error.message });
    }
});

// Delete hotel
app.delete('/api/admin/hotels/:id', async (req, res) => {
    try {
        await pool.query('USE hotels_dashboard');
        await pool.query('DELETE FROM hotels WHERE hotel_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Hotel deleted successfully' });
    } catch (error) {
        console.error('Delete hotel error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete hotel', details: error.message });
    }
});

// === HOTEL BOOKINGS CRUD ===
// Delete hotel booking
app.delete('/api/admin/hotel-bookings/:id', async (req, res) => {
    try {
        await pool.query('USE hotels_dashboard');
        await pool.query('DELETE FROM customers WHERE customer_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Hotel booking deleted successfully' });
    } catch (error) {
        console.error('Delete hotel booking error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete booking', details: error.message });
    }
});

// Update hotel booking
app.put('/api/admin/hotel-bookings/:id', async (req, res) => {
    const { customer_name, email, phone, check_in, check_out, guests, rooms } = req.body;
    try {
        await pool.query('USE hotels_dashboard');
        await pool.query(
            'UPDATE customers SET customer_name = ?, email = ?, phone = ?, check_in = ?, check_out = ?, guests = ?, rooms = ? WHERE customer_id = ?',
            [customer_name, email, phone, check_in, check_out, guests, rooms, req.params.id]
        );
        res.json({ success: true, message: 'Hotel booking updated successfully' });
    } catch (error) {
        console.error('Update hotel booking error:', error);
        res.status(500).json({ success: false, error: 'Failed to update booking', details: error.message });
    }
});

// === FLIGHT BOOKINGS CRUD ===
// Delete flight booking
app.delete('/api/admin/bookings/:id', async (req, res) => {
    try {
        await pool.query('USE flight_booking');
        await pool.query('DELETE FROM ticket WHERE ticket_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Flight booking deleted successfully' });
    } catch (error) {
        console.error('Delete flight booking error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete booking', details: error.message });
    }
});

// Update flight booking
app.put('/api/admin/bookings/:id', async (req, res) => {
    const { passenger_name, flight_no, seat_no, class_type, source, destination, date, departure_time, arrival_time, fare, payment_mode } = req.body;
    try {
        await pool.query('USE flight_booking');
        await pool.query(
            'UPDATE ticket SET passenger_name = ?, flight_no = ?, seat_no = ?, class_type = ?, source = ?, destination = ?, date = ?, departure_time = ?, arrival_time = ?, fare = ?, payment_mode = ? WHERE ticket_id = ?',
            [passenger_name, flight_no, seat_no, class_type, source, destination, date, departure_time, arrival_time, fare, payment_mode, req.params.id]
        );
        res.json({ success: true, message: 'Flight booking updated successfully' });
    } catch (error) {
        console.error('Update flight booking error:', error);
        res.status(500).json({ success: false, error: 'Failed to update booking', details: error.message });
    }
});

// === USERS CRUD ===
// Add new user
app.post('/api/admin/users', async (req, res) => {
    const { name, email, number } = req.body;
    try {
        await pool.query('USE travelsease_db');
        const [result] = await pool.query(
            'INSERT INTO users (name, email, number) VALUES (?, ?, ?)',
            [name, email, number]
        );
        res.status(201).json({ success: true, user_id: result.insertId, message: 'User added successfully' });
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({ success: false, error: 'Failed to add user', details: error.message });
    }
});

// Update user
app.put('/api/admin/users/:id', async (req, res) => {
    const { name, email, number } = req.body;
    try {
        await pool.query('USE travelsease_db');
        await pool.query(
            'UPDATE users SET name = ?, email = ?, number = ? WHERE id = ?',
            [name, email, number, req.params.id]
        );
        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, error: 'Failed to update user', details: error.message });
    }
});

// Delete user
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await pool.query('USE travelsease_db');
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user', details: error.message });
    }
});

// === REVIEWS CRUD ===
// Delete review
app.delete('/api/admin/reviews/:id', async (req, res) => {
    try {
        await pool.query('USE package');
        await pool.query('DELETE FROM reviews WHERE review_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete review', details: error.message });
    }
});

// Update review
app.put('/api/admin/reviews/:id', async (req, res) => {
    const { rating, review_text } = req.body;
    try {
        await pool.query('USE package');
        await pool.query(
            'UPDATE reviews SET rating = ?, review_text = ? WHERE review_id = ?',
            [rating, review_text, req.params.id]
        );
        res.json({ success: true, message: 'Review updated successfully' });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ success: false, error: 'Failed to update review', details: error.message });
    }
});

// === PACKAGES CRUD ===
// Delete package booking
app.delete('/api/admin/packages/:id', async (req, res) => {
    try {
        await pool.query('USE package');
        await pool.query('DELETE FROM bookings WHERE booking_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Package booking deleted successfully' });
    } catch (error) {
        console.error('Delete package error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete package booking', details: error.message });
    }
});

// === DEALS CRUD ===
// Add new deal
app.post('/api/admin/deals', async (req, res) => {
    const { discount_name, package_name, origin, destination, original_price, discount_percent, travel_date, duration } = req.body;
    try {
        await pool.query('USE deals');
        
        // Calculate discounted price
        const base_price = parseFloat(original_price);
        const discount = parseFloat(discount_percent);
        const total_amount = base_price - (base_price * discount / 100);
        
        // Map to actual database columns for deals table
        const [result] = await pool.query(
            'INSERT INTO deals (discount_name, discount_percent, origin, destination, flight_date, travel_date, base_price, total_amount, duration, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [discount_name, discount, origin, destination, travel_date, travel_date, base_price, total_amount, duration, 'Pending']
        );
        res.status(201).json({ success: true, deal_id: result.insertId, message: 'Deal added successfully' });
    } catch (error) {
        console.error('Add deal error:', error);
        res.status(500).json({ success: false, error: 'Failed to add deal', details: error.message });
    }
});

// Delete deal
app.delete('/api/admin/deals/:id', async (req, res) => {
    try {
        await pool.query('USE deals');
        await pool.query('DELETE FROM deals WHERE deal_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Deal deleted successfully' });
    } catch (error) {
        console.error('Delete deal error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete deal', details: error.message });
    }
});

// === FLIGHTS CRUD ===
// Add new flight
app.post('/api/admin/flights', async (req, res) => {
    const { flight_name, flight_no, source, destination, departure_time, arrival_time, economy_fare, business_fare, first_class_fare, flight_date } = req.body;
    try {
        await pool.query('USE flights_dashboard');
        
        // Map to actual database column names
        const airline = flight_name;
        const flight_number = flight_no;
        const price = economy_fare; // Use economy fare as base price
        const status = 'Active';
        
        // Combine selected date with time for datetime fields
        const flightDate = flight_date || new Date().toISOString().split('T')[0];
        const departure_datetime = `${flightDate} ${departure_time}:00`;
        const arrival_datetime = `${flightDate} ${arrival_time}:00`;
        
        const [result] = await pool.query(
            'INSERT INTO flights (airline, flight_number, source, destination, departure_time, arrival_time, status, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [airline, flight_number, source, destination, departure_datetime, arrival_datetime, status, price]
        );
        res.status(201).json({ success: true, flight_id: result.insertId, message: 'Flight added successfully' });
    } catch (error) {
        console.error('Add flight error:', error);
        res.status(500).json({ success: false, error: 'Failed to add flight', details: error.message });
    }
});

// === PACKAGES CRUD ===
// Add new package
app.post('/api/admin/packages', async (req, res) => {
    const { package_name, origin, destination, duration, price, description, image_url, inclusions } = req.body;
    try {
        await pool.query('USE package');
        
        // Map to actual database columns
        const stay_details = inclusions || 'Standard package inclusions';
        
        const [result] = await pool.query(
            'INSERT INTO packages (package_name, description, origin, destination, duration, stay_details, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [package_name, description, origin, destination, duration, stay_details, price, image_url || null]
        );
        res.status(201).json({ success: true, package_id: result.insertId, message: 'Package added successfully' });
    } catch (error) {
        console.error('Add package error:', error);
        res.status(500).json({ success: false, error: 'Failed to add package', details: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
    console.log('\n📋 Available Routes:');
    console.log('\n🔐 Admin Routes:');
    console.log('   GET /api/admin/users - Get all users');
    console.log('   GET /api/admin/bookings - Get all flight bookings');
    console.log('   GET /api/admin/hotel-bookings - Get all hotel bookings');
    console.log('   GET /api/admin/hotels - Get all hotels');
    console.log('   GET /api/admin/packages - Get all package bookings');
    console.log('   GET /api/admin/deals - Get all deals');
    console.log('   GET /api/admin/reviews - Get all reviews');
    console.log('   GET /api/admin/stats - Get dashboard statistics');
    console.log('\n👤 User Routes (travelsease_db):');
    console.log('   POST /register - Register new user');
    console.log('   POST /login - User login');
    console.log('   GET /api/users/:id - Get user profile');
    console.log('\n✈️  Flight Routes (flights_dashboard):');
    console.log('   GET /api/flights/search - Search flights');
    console.log('   GET /api/flights/:id - Get flight details');
    console.log('   GET /api/flights/:id/seats - Get booked seats');
    console.log('\n🏨 Hotel Routes (hotels_dashboard):');
    console.log('   GET /api/hotels/search - Search hotels');
    console.log('   GET /api/hotels/:id - Get hotel details');
    console.log('   POST /api/hotels/book - Book a hotel');
    console.log('\n🎫 Booking Routes (flight_booking):');
    console.log('   POST /api/book-seat - Book a seat (ticket table)');
    console.log('   GET /api/ticket/:pnr - Get ticket by PNR');
    console.log('   GET /api/ticket/:pnr/pdf - Download ticket as PDF');
    console.log('\n🔥 Deals Routes (deals):');
    console.log('   POST /api/deals/book - Book a last-minute deal');
    console.log('   GET /api/deals/bookings/:id/pdf - Download deal PDF');
    console.log('\n📅 Legacy Booking Routes:');
    console.log('   POST /api/bookings - Create booking');
    console.log('   GET /api/bookings/:id - Get booking details');
    console.log('   GET /api/users/:id/bookings - Get user bookings');
    console.log('   PUT /api/bookings/:id/cancel - Cancel booking');
});
