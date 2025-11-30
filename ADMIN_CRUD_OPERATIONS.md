# Admin Dashboard CRUD Operations

## Overview
Full CRUD (Create, Read, Update, Delete) functionality has been implemented for the admin dashboard across all major features.

## Implemented Features

### 1. **Users Management**
- **Create**: Add new users with name, email, and phone number
- **Read**: View all users in the dashboard
- **Update**: Edit existing user information
- **Delete**: Remove users from the system
- **UI**: "Add User" button + Edit/Delete buttons for each row
- **API Endpoints**:
  - `POST /api/admin/users` - Create user
  - `GET /api/admin/users` - Get all users
  - `PUT /api/admin/users/:id` - Update user
  - `DELETE /api/admin/users/:id` - Delete user

### 2. **Hotels Management**
- **Create**: Add new hotels with name, city, price, rating, image, and availability
- **Read**: View all hotels
- **Update**: Edit hotel information
- **Delete**: Remove hotels
- **UI**: "Add Hotel" button + Edit/Delete buttons for each row
- **API Endpoints**:
  - `POST /api/admin/hotels` - Create hotel
  - `GET /api/admin/hotels` - Get all hotels
  - `PUT /api/admin/hotels/:id` - Update hotel
  - `DELETE /api/admin/hotels/:id` - Delete hotel

### 3. **Hotel Bookings Management**
- **Read**: View all hotel bookings
- **Update**: Edit booking details (customer info, dates, guests, rooms)
- **Delete**: Cancel hotel bookings
- **UI**: Edit/Delete buttons for each booking row
- **API Endpoints**:
  - `GET /api/admin/hotel-bookings` - Get all bookings
  - `PUT /api/admin/hotel-bookings/:id` - Update booking
  - `DELETE /api/admin/hotel-bookings/:id` - Delete booking

### 4. **Flight Bookings Management**
- **Read**: View all flight bookings
- **Update**: Edit booking details (passenger name, flight info, seat, fare, etc.)
- **Delete**: Cancel flight bookings
- **UI**: Edit/Delete buttons for each booking row
- **API Endpoints**:
  - `GET /api/admin/bookings` - Get all flight bookings
  - `PUT /api/admin/bookings/:id` - Update booking
  - `DELETE /api/admin/bookings/:id` - Delete booking

### 5. **Reviews Management**
- **Read**: View all customer reviews
- **Update**: Edit review rating and text
- **Delete**: Remove reviews
- **UI**: Edit/Delete buttons for each review row
- **API Endpoints**:
  - `GET /api/admin/reviews` - Get all reviews
  - `PUT /api/admin/reviews/:id` - Update review
  - `DELETE /api/admin/reviews/:id` - Delete review

### 6. **Package Bookings Management**
- **Read**: View all package bookings
- **Delete**: Cancel package bookings
- **UI**: Delete button for each package row
- **API Endpoints**:
  - `GET /api/admin/packages` - Get all packages
  - `DELETE /api/admin/packages/:id` - Delete package booking

### 7. **Deals Management**
- **Read**: View all deals
- **Delete**: Remove deals
- **UI**: Delete button for each deal row
- **API Endpoints**:
  - `GET /api/admin/deals` - Get all deals
  - `DELETE /api/admin/deals/:id` - Delete deal

## UI Components

### Modal Forms
Five modal forms have been created for data entry and editing:
1. **User Modal** - Add/Edit users
2. **Hotel Modal** - Add/Edit hotels
3. **Hotel Booking Modal** - Edit hotel bookings
4. **Flight Booking Modal** - Edit flight bookings
5. **Review Modal** - Edit reviews

### Action Buttons
- **Edit Button** (Blue) - Opens modal with pre-filled data
- **Delete Button** (Red) - Confirms and deletes record
- **Add Button** (Primary) - Opens modal for new entry

## Database Operations

### Tables Modified
- `travelsease_db.users` - User management
- `hotels_dashboard.hotels` - Hotel inventory
- `hotels_dashboard.customers` - Hotel bookings
- `flight_booking.ticket` - Flight bookings
- `package.reviews` - Customer reviews
- `package.bookings` - Package bookings
- `deals.deals` - Last-minute deals

## How to Use

### Admin Login
1. Navigate to `admin.html`
2. Login with credentials:
   - **ID**: admin
   - **Password**: youradmin25

### Managing Records

#### To Add a Record:
1. Click the "Add [Type]" button (e.g., "Add User", "Add Hotel")
2. Fill in the required fields in the modal
3. Click "Save"
4. Record will be added and table will refresh

#### To Edit a Record:
1. Click the "Edit" button on any table row
2. Modify the fields in the modal
3. Click "Save"
4. Record will be updated and table will refresh

#### To Delete a Record:
1. Click the "Delete" button on any table row
2. Confirm the deletion in the popup
3. Record will be removed and table will refresh

## Technical Implementation

### Frontend (admin.html + admin.js)
- Modal overlays for forms
- Event handlers for buttons
- Fetch API calls to backend
- Dynamic table rendering with action buttons
- Form validation

### Backend (flight-server.js)
- RESTful API endpoints
- MySQL database operations
- Error handling and validation
- JSON responses
- Database switching for multi-database architecture

## Features
- ✅ Confirmation dialogs for delete operations
- ✅ Success/error messages
- ✅ Automatic table refresh after operations
- ✅ Form validation
- ✅ Responsive modal design
- ✅ Secure database operations with parameterized queries

## Testing
1. Start the server: `node flight-server.js`
2. Open `admin.html` in browser
3. Login with admin credentials
4. Test each CRUD operation:
   - Add new records
   - Edit existing records
   - Delete records
   - Verify changes in database

## Notes
- All delete operations require confirmation
- Edit operations pre-fill forms with existing data
- Server must be running on port 3000
- Database credentials are configured in `flight-server.js`
