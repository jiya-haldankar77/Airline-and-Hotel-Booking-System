# Airline and Hotel Booking System

A comprehensive web-based booking system that allows users to search, book, and manage airline flights and hotel reservations with an integrated admin panel.

## 🚀 Features

### User Features
- **Flight Booking**: Search and book flights with real-time availability
- **Hotel Reservation**: Browse and book hotels with detailed information
- **Holiday Packages**: Complete travel packages with flights and hotels
- **Last-Minute Deals**: Special offers for spontaneous travelers
- **User Authentication**: Secure login and registration system
- **Interactive Chatbot**: AI-powered assistance for bookings
- **Modern UI**: Responsive design with smooth user experience

### Admin Features
- **Dashboard**: Comprehensive admin control panel
- **CRUD Operations**: Full management of flights, hotels, packages, and deals
- **User Management**: Monitor and manage user accounts
- **Booking Analytics**: Track reservations and generate reports
- **Database Management**: Integrated SQL database operations

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with animations
- **JavaScript (ES6+)**: Interactive functionality
- **Responsive Design**: Mobile-friendly interface

### Backend
- **Node.js**: Server-side runtime environment
- **Express.js**: Web application framework
- **MySQL**: Database management system
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing

### Dependencies
- `express`: Web framework
- `mysql2`: MySQL database driver
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password encryption
- `body-parser`: Request parsing
- `cors`: Cross-origin resource sharing
- `pdfkit`: PDF generation for tickets

## 📁 Project Structure

```
├── css/                 # Stylesheets
│   ├── chatbot.css
│   ├── holiday.css
│   └── last-minute-deals.css
├── js/                  # JavaScript files
│   ├── admin.js
│   ├── chatbot.js
│   ├── holiday.js
│   └── last-minute-deals.js
├── sql/                 # Database files
│   ├── booking.sql
│   ├── deals.sql
│   ├── flight.sql
│   ├── hotel.sql
│   └── user.sql
├── admin.html           # Admin dashboard
├── booking.html         # Main booking interface
├── hotel.html           # Hotel booking page
├── holiday.html         # Holiday packages
├── homepage.html        # Landing page
├── index.html           # Entry point
├── user.html            # User dashboard
├── chatbot.html         # Chatbot interface
├── flight-server.js     # Main server file
├── server.js            # Express server
└── package.json         # Project dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jiya-haldankar77/Airline-and-Hotel-Booking-System.git
   cd Airline-and-Hotel-Booking-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database named `booking_system`
   - Import the SQL files from the project root:
     ```sql
     mysql -u username -p booking_system < flight.sql
     mysql -u username -p booking_system < hotel.sql
     mysql -u username -p booking_system < user.sql
     mysql -u username -p booking_system < deals.sql
     mysql -u username -p booking_system < package.sql
     ```

4. **Configure Database Connection**
   - Update database credentials in `server.js` and `flight-server.js`

5. **Start the Application**
   ```bash
   npm start
   ```

6. **Access the Application**
   - Main Application: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin.html

## 🎯 Usage

### For Users
1. Browse available flights and hotels
2. Select desired options and dates
3. Complete booking process
4. Receive confirmation and tickets

### For Admins
1. Access admin dashboard
2. Manage flights, hotels, and packages
3. Monitor bookings and user activity
4. Generate reports and analytics

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=booking_system
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Database Tables
- `flights`: Flight information and schedules
- `hotels`: Hotel details and availability
- `users`: User accounts and authentication
- `bookings`: Reservation records
- `packages`: Travel packages
- `deals`: Special offers and discounts

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection Error**
   - Verify MySQL server is running
   - Check database credentials in server files

2. **Port Already in Use**
   - Change port in `package.json` and server files
   - Kill existing processes on the port

3. **Missing Dependencies**
   - Run `npm install` to install all required packages

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=app:* npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 Documentation

- [Admin Guide](./ADMIN_GUIDE.txt) - Detailed admin panel instructions
- [Database Setup](./HOTEL_BOOKING_SETUP.txt) - Database configuration
- [Feature Documentation](./) - Individual feature documentation files

## 📄 License

This project is licensed under the ISC License.

## 👥 Author

**Jiya Haldankar**
- GitHub: [@jiya-haldankar77](https://github.com/jiya-haldankar77)

## 🙏 Acknowledgments

- Thanks to all contributors and users of this booking system
- Built with modern web technologies for seamless travel booking experience

---

**Note**: This project is for educational and demonstration purposes. Please ensure proper security measures before deploying to production.
