# Add Data Feature - Admin Dashboard

## Overview
A new "Add Data" tab has been added to the admin dashboard that allows administrators to add new flights, packages, deals, and hotels directly from the interface. All data is immediately reflected in the database and on the respective pages.

## Features Added

### 1. **Add New Flights**
Add flight routes to the system with complete details:
- **Airline/Flight Name**: Airline name (e.g., Air India, IndiGo, SpiceJet)
- **Flight Number**: Unique identifier (e.g., AI101)
- **Source & Destination**: Cities for the route
- **Departure & Arrival Times**: Flight schedule
- **Fares**: Economy, Business, and First Class pricing
- **Available Days**: Days of operation (comma-separated)

**Database**: `flights_dashboard.flights`  
**API Endpoint**: `POST /api/admin/flights`  
**Note**: Maps to `airline` and `flight_number` columns in database

### 2. **Add New Packages**
Create holiday packages with full details:
- **Package Name**: Descriptive title
- **Destination**: Location
- **Duration**: Number of days
- **Price**: Package cost
- **Description**: Detailed information
- **Image URL**: Package image
- **Inclusions**: What's included (comma-separated)

**Database**: `package.packages`  
**API Endpoint**: `POST /api/admin/packages`

### 3. **Add New Deals**
Create last-minute deals with discounts:
- **Deal Title**: Promotional name
- **Package Name**: Associated package
- **Original Price**: Base price
- **Discount %**: Percentage off (0-100)
- **Travel Date**: When the deal is valid
- **Destination**: Location
- **Duration**: Number of days

**Database**: `deals.deals`  
**API Endpoint**: `POST /api/admin/deals`  
**Auto-calculation**: Discounted price is calculated automatically

### 4. **Add New Hotels**
Add hotels to the inventory:
- **Hotel Name**: Property name
- **City**: Location
- **Price Per Night**: Room rate
- **Rating**: Star rating (1-5)
- **Image URL**: Hotel image
- **Availability**: Available/Unavailable status

**Database**: `hotels_dashboard.hotels`  
**API Endpoint**: `POST /api/admin/hotels`

## How to Use

### Accessing the Add Data Tab
1. Login to admin dashboard (`admin.html`)
2. Click on **"Add Data"** in the sidebar navigation (second item)
3. You'll see 4 forms in a grid layout

### Adding Data

#### To Add a Flight:
1. Fill in all required fields marked with *
2. Enter fare amounts for all three classes
3. Optionally specify available days (default: Daily)
4. Click **"Add Flight"** button
5. Success message will confirm addition

#### To Add a Package:
1. Enter package name and destination
2. Set duration and price
3. Add description and optional image URL
4. List inclusions (comma-separated)
5. Click **"Add Package"** button
6. Package will appear in packages list

#### To Add a Deal:
1. Enter deal title and package name
2. Set original price and discount percentage
3. Select travel date
4. Enter destination and duration
5. Click **"Add Deal"** button
6. Deal will appear in deals section with calculated discount

#### To Add a Hotel:
1. Enter hotel name and city
2. Set price per night and rating
3. Add optional image URL
4. Select availability status
5. Click **"Add Hotel"** button
6. Hotel will be available for booking

## Form Validation
- All fields marked with * are required
- Rating must be between 1-5
- Discount percentage must be 0-100
- Numeric fields only accept numbers
- URL fields validate proper format

## Data Reflection

### Where Data Appears:

**Flights**:
- `modern-flight-booking.html` - Flight search results
- Available for booking immediately

**Packages**:
- Package listing pages
- Admin packages table
- Available for booking

**Deals**:
- `deals.html` - Last-minute deals page
- Admin deals table
- Shows calculated discounted price

**Hotels**:
- `hotel.html` - Hotel search results
- Admin hotel bookings section
- Available for booking immediately

## Backend Implementation

### New API Endpoints:
```javascript
POST /api/admin/flights
POST /api/admin/packages
POST /api/admin/deals
POST /api/admin/hotels (existing, reused)
```

### Database Tables:
- `flights_dashboard.flights` - Flight routes
- `package.packages` - Holiday packages
- `deals.deals` - Last-minute deals
- `hotels_dashboard.hotels` - Hotel inventory

### Response Format:
```json
{
  "success": true,
  "flight_id": 123,  // or package_id, deal_id, hotel_id
  "message": "Flight added successfully"
}
```

## Technical Details

### Frontend (admin.html):
- New section with ID `add-data`
- 4 responsive form cards in grid layout
- Modern UI with icons and proper spacing
- Form validation with HTML5 attributes

### JavaScript (admin.js):
- `handleAddFlight()` - Flight form submission
- `handleAddPackage()` - Package form submission
- `handleAddDeal()` - Deal form submission
- `handleInlineHotelSubmit()` - Hotel form submission
- All forms reset after successful submission
- Success/error alerts for user feedback

### Backend (flight-server.js):
- Parameterized queries for SQL injection prevention
- Proper database switching for multi-DB architecture
- Error handling with detailed messages
- Auto-calculation for deal discounts

## Example Usage

### Adding a Flight:
```
Airline/Flight Name: Air India
Flight Number: AI101
Source: Delhi
Destination: Mumbai
Departure: 09:00
Arrival: 11:30
Economy: 5000
Business: 12000
First Class: 25000
Days: Monday,Wednesday,Friday
```

### Adding a Package:
```
Name: Goa Beach Paradise
Destination: Goa
Duration: 5 days
Price: 25000
Description: Enjoy pristine beaches and water sports
Image: https://example.com/goa.jpg
Inclusions: Hotel,Meals,Sightseeing,Airport Transfer
```

### Adding a Deal:
```
Title: Last Minute Goa Deal
Package: Goa Beach Paradise
Original Price: 25000
Discount: 30%
Travel Date: 2025-12-15
Destination: Goa
Duration: 5
→ Discounted Price: ₹17,500 (auto-calculated)
```

### Adding a Hotel:
```
Name: Taj Palace
City: Mumbai
Price: 8000
Rating: 4.8
Image: https://example.com/taj.jpg
Availability: Available
```

## Benefits
✅ No need to manually edit database  
✅ Instant data availability on frontend  
✅ Form validation prevents errors  
✅ User-friendly interface  
✅ Automatic calculations (deals)  
✅ Proper error handling  
✅ Data immediately searchable/bookable  

## Notes
- Server must be running on port 3000
- All prices are in INR (₹)
- Image URLs are optional but recommended
- Forms reset after successful submission
- Changes are immediate - no page refresh needed for new data to be available in database
