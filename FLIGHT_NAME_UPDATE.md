# Flight Name Field Added to Add Flight Form

## Update Summary
Added an "Airline/Flight Name" field to the Add Flight form in the admin dashboard's Add Data section.

## Changes Made

### 1. Frontend (admin.html)
**Location**: Add Data section → Add Flight form

**New Field Added**:
```html
<div class="form-group">
  <label class="form-label">Airline/Flight Name *</label>
  <input type="text" id="flightName" class="form-input" 
         placeholder="e.g., Air India, IndiGo, SpiceJet" required />
</div>
```

**Position**: First field in the form (before Flight Number)

### 2. JavaScript (admin.js)
**Function**: `handleAddFlight()`

**Updated Data Object**:
```javascript
const data = {
    flight_name: document.getElementById('flightName').value,  // NEW
    flight_no: document.getElementById('flightNo').value,
    source: document.getElementById('flightSourceCity').value,
    destination: document.getElementById('flightDestCity').value,
    // ... rest of fields
};
```

### 3. Backend (flight-server.js)
**Endpoint**: `POST /api/admin/flights`

**Database Mapping**:
- `flight_name` (from form) → `airline` (database column)
- `flight_no` (from form) → `flight_number` (database column)

**Updated Query**:
```javascript
INSERT INTO flights 
  (airline, flight_number, source, destination, departure_time, arrival_time, status, price) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

**Additional Processing**:
- Converts time inputs to datetime format for database
- Sets status as 'Active' by default
- Uses economy fare as the base price

## Database Schema
**Table**: `flights_dashboard.flights`

**Relevant Columns**:
- `airline` (VARCHAR(50)) - Stores the airline/flight name
- `flight_number` (VARCHAR(10)) - Stores the flight number
- `source` (VARCHAR(50)) - Departure city
- `destination` (VARCHAR(50)) - Arrival city
- `departure_time` (DATETIME) - Departure date and time
- `arrival_time` (DATETIME) - Arrival date and time
- `status` (VARCHAR(20)) - Flight status (default: 'Active')
- `price` (DECIMAL(10,2)) - Base price (economy fare)

## Form Fields Order
1. **Airline/Flight Name** * (NEW)
2. Flight Number *
3. Source *
4. Destination *
5. Departure Time *
6. Arrival Time *
7. Economy Fare *
8. Business Fare *
9. First Class Fare *
10. Available Days

## Example Input
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

## Database Result
```sql
INSERT INTO flights VALUES (
  airline: 'Air India',
  flight_number: 'AI101',
  source: 'Delhi',
  destination: 'Mumbai',
  departure_time: '2025-11-06 09:00:00',
  arrival_time: '2025-11-06 11:30:00',
  status: 'Active',
  price: 5000.00
);
```

## User Experience
1. Admin opens Add Data tab
2. Fills in airline name (e.g., "IndiGo")
3. Fills in flight number (e.g., "6E2134")
4. Completes rest of the form
5. Clicks "Add Flight" button
6. Receives success message
7. Flight is immediately available in flight search

## Validation
- Field is marked as required (*)
- Cannot submit form without entering airline name
- Accepts any text input (airline names, codes, etc.)

## Benefits
✅ More descriptive flight information  
✅ Users can see which airline operates the flight  
✅ Better flight identification in search results  
✅ Matches industry standard flight display format  
✅ Required field ensures data completeness  

## Notes
- The airline name is stored in the `airline` column of the database
- This field is now mandatory for adding new flights
- Existing flights in the database are not affected
- The field accepts any text format (full names, codes, etc.)
