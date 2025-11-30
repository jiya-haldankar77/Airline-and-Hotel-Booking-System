# Deals & Hotels Dynamic Loading with Routes ✅

## Summary
Added **origin/source and destination fields** to deals and hotels, and made both **load dynamically from database** on their respective pages.

## Changes Made

### 1. Deals Form - Added Origin Field

#### Admin Form (`admin.html`)
```html
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
  <div class="form-group">
    <label class="form-label">Origin/Source *</label>
    <input type="text" id="dealOrigin" placeholder="e.g., Mumbai" required />
  </div>
  <div class="form-group">
    <label class="form-label">Destination *</label>
    <input type="text" id="dealDestination" placeholder="e.g., Goa" required />
  </div>
</div>
```

#### JavaScript Handler (`js/admin.js`)
```javascript
const data = {
    discount_name: document.getElementById('dealTitle').value,
    package_name: document.getElementById('dealPackageName').value,
    origin: document.getElementById('dealOrigin').value,  // ← NEW
    destination: document.getElementById('dealDestination').value,
    original_price: document.getElementById('dealOriginalPrice').value,
    discount_percent: document.getElementById('dealDiscount').value,
    travel_date: document.getElementById('dealTravelDate').value,
    duration: document.getElementById('dealDuration').value
};
```

#### Backend API (`flight-server.js`)
```javascript
app.post('/api/admin/deals', async (req, res) => {
    const { discount_name, package_name, origin, destination, ... } = req.body;
    
    await pool.query(
        'INSERT INTO deals (discount_name, discount_percent, origin, destination, ...) VALUES (?, ?, ?, ?, ...)',
        [discount_name, discount, origin, destination, ...]
    );
});
```

### 2. Hotels - Already Has City (Destination)
Hotels already have a `city` field which serves as the destination. No changes needed to the form.

### 3. New API Endpoints for Frontend Display

#### Get All Deals (`GET /api/deals`)
```javascript
app.get('/api/deals', async (req, res) => {
    await pool.query('USE deals');
    const [deals] = await pool.query('SELECT * FROM deals ORDER BY deal_id DESC');
    res.json({ success: true, deals: deals });
});
```

#### Get All Hotels (`GET /api/hotels`)
```javascript
app.get('/api/hotels', async (req, res) => {
    await pool.query('USE hotels_dashboard');
    const [hotels] = await pool.query('SELECT * FROM hotels ORDER BY hotel_id DESC');
    res.json({ success: true, hotels: hotels });
});
```

### 4. Dynamic Loading on last-minute-deals.html

#### Before (Hardcoded):
```javascript
const DEALS = [
  { from: 'Delhi', to: 'Mumbai', ... },
  { from: 'Bangalore', to: 'Goa', ... },
  // ... hardcoded deals
];
```

#### After (Database):
```javascript
let DEALS = [];

async function loadDealsFromDB() {
  const response = await fetch('http://localhost:3000/api/deals');
  const data = await response.json();
  
  if (data.success && data.deals) {
    DEALS = data.deals.map(deal => ({
      from: deal.origin || 'India',
      to: deal.destination || 'Destination',
      airline: deal.airline || 'IndiGo',
      flight_no: deal.flight_number || 'TBA',
      duration: deal.duration || '2h',
      date: deal.travel_date,
      price: parseFloat(deal.total_amount),
      badge: deal.discount_percent >= 30 ? 'Best Price' : 'Last Minute',
      // ... etc
    }));
    renderDeals(DEALS);
  }
}

loadDealsFromDB();
```

#### Route Display:
```javascript
const routeDisplay = d.from && d.to 
  ? `${d.from} → ${d.to}` 
  : d.discount_name || 'Special Deal';
```

### 5. Dynamic Loading on hotel.html

#### Before (Hardcoded):
```javascript
const sampleHotels = [
  { hotel_id: 1, hotel_name: 'Hotel Taj', city: 'Mumbai', ... },
  { hotel_id: 2, hotel_name: 'Grand Hyatt', city: 'Goa', ... },
  // ... hardcoded hotels
];
```

#### After (Database):
```javascript
let sampleHotels = [];

async function loadHotelsFromDB() {
  const response = await fetch('http://localhost:3000/api/hotels');
  const data = await response.json();
  
  if (data.success && data.hotels) {
    sampleHotels = data.hotels;
    console.log('Loaded hotels from database:', sampleHotels.length);
  }
}

loadHotelsFromDB();
```

## Data Flow

### Deals Flow:
```
┌─────────────────────────────────────────────────────────┐
│  1. ADMIN ADDS DEAL                                     │
│     Origin: Mumbai → Destination: Goa                   │
│     Discount: 20%                                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. SAVED TO DATABASE                                   │
│     deals.deals table with origin & destination         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. USER OPENS last-minute-deals.html                   │
│     JavaScript: GET /api/deals                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. DEAL CARD RENDERED                                  │
│     ┌─────────────────────────────┐                     │
│     │ Mumbai → Goa    [Best Price]│                     │
│     │ IndiGo · Today, 6:00 PM     │                     │
│     │ ₹5,600                      │                     │
│     │ [Details] [Book]            │                     │
│     └─────────────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

### Hotels Flow:
```
┌─────────────────────────────────────────────────────────┐
│  1. ADMIN ADDS HOTEL                                    │
│     Hotel Name: Taj Palace                              │
│     City: Delhi (destination)                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. SAVED TO DATABASE                                   │
│     hotels_dashboard.hotels table                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. USER OPENS hotel.html                               │
│     JavaScript: GET /api/hotels                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. USER SEARCHES FOR "Delhi"                           │
│     Filters hotels by city                              │
│     Shows: Taj Palace in Delhi                          │
└─────────────────────────────────────────────────────────┘
```

## Example: Adding a Deal

### Admin Form Input:
```
Deal Title: Mumbai to Goa Flash Sale
Package Name: Goa Beach Paradise
Origin: Mumbai          ← NEW FIELD
Destination: Goa
Original Price: ₹7,000
Discount: 20%
Travel Date: 2025-11-15
Duration: 2 days
```

### Saved to Database:
```sql
INSERT INTO deals (
  discount_name, 
  origin,           -- NEW
  destination, 
  base_price, 
  discount_percent, 
  total_amount, 
  ...
) VALUES (
  'Mumbai to Goa Flash Sale',
  'Mumbai',         -- NEW
  'Goa',
  7000,
  20,
  5600,             -- Auto-calculated
  ...
);
```

### Displayed on last-minute-deals.html:
```
┌─────────────────────────────────┐
│ Mumbai → Goa      [Best Price]  │  ← Route shown!
│ IndiGo · Nov 15, 2025           │
│ ₹5,600                          │
│ [Details] [Book]                │
└─────────────────────────────────┘
```

## Example: Adding a Hotel

### Admin Form Input:
```
Hotel Name: Oberoi Grand
City: Kolkata        ← This is the destination
Price Per Night: ₹8,500
Rating: 4.6
Availability: Available
```

### Saved to Database:
```sql
INSERT INTO hotels (
  hotel_name, 
  city,              -- Destination
  price_per_night, 
  rating, 
  availability
) VALUES (
  'Oberoi Grand',
  'Kolkata',
  8500,
  4.6,
  'Available'
);
```

### Displayed on hotel.html:
```
User searches for "Kolkata"
↓
┌─────────────────────────────────────────────┐
│ ID | Hotel Name    | City    | Price/Night │
├─────────────────────────────────────────────┤
│ 5  | Oberoi Grand  | Kolkata | ₹8,500      │
└─────────────────────────────────────────────┘
```

## Testing

### Test 1: Add Deal with Route
1. Go to Admin → Add Data → Add Deal
2. Fill in:
   - Origin: "Delhi"
   - Destination: "Manali"
   - Other fields...
3. Submit
4. Open `last-minute-deals.html`
5. ✅ Should see: "Delhi → Manali" on the deal card

### Test 2: Add Hotel
1. Go to Admin → Add Data → Add Hotel
2. Fill in:
   - Hotel Name: "Marriott"
   - City: "Bangalore"
   - Other fields...
3. Submit
4. Open `hotel.html`
5. Search for "Bangalore"
6. ✅ Should see: Marriott in search results

### Test 3: Verify APIs
```bash
# Test deals API
curl http://localhost:3000/api/deals

# Test hotels API
curl http://localhost:3000/api/hotels
```

## Benefits

✅ **Deals now show routes** - "Mumbai → Goa" instead of just "Goa"  
✅ **Dynamic data loading** - No more hardcoded deals/hotels  
✅ **Real-time updates** - Refresh page to see new deals/hotels  
✅ **Consistent with packages** - All three (packages, deals, hotels) now load from DB  
✅ **Better UX** - Users see actual available deals and hotels  
✅ **Admin control** - Add deals/hotels anytime via admin panel  

## Files Modified

1. **`admin.html`**
   - Added origin field to Deal form

2. **`js/admin.js`**
   - Updated `handleAddDeal()` to include origin

3. **`flight-server.js`**
   - Updated `POST /api/admin/deals` to save origin
   - Added `GET /api/deals` for frontend
   - Added `GET /api/hotels` for frontend

4. **`js/last-minute-deals.js`**
   - Replaced hardcoded DEALS with database loading
   - Added route display logic

5. **`hotel.html`**
   - Replaced hardcoded sampleHotels with database loading

## Summary

✅ **Origin field added** to deals form  
✅ **Hotels already have city** (destination)  
✅ **New API endpoints** created for deals and hotels  
✅ **Dynamic loading** implemented on both pages  
✅ **Route display** working for deals (Origin → Destination)  
✅ **Server restarted** - all changes live  

**All deals and hotels now load from database and display properly!** 🎉
