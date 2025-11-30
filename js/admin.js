// Admin Dashboard JavaScript
const API_BASE = 'http://localhost:3000';

// Global variables for CRUD operations
let currentEditId = null;
let currentEditType = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Dashboard Loaded');
    
    // Load dashboard statistics
    loadStats();
    
    // Load all data sections
    loadUsers();
    loadFlightBookings();
    loadHotelBookings();
    loadPackages();
    loadDeals();
    loadDealBookings();
    loadReviews();
    loadRevenue();
    loadAnalytics();
    
    // Route filter event listeners
    document.getElementById('filterRouteBtn')?.addEventListener('click', filterByRoute);
    document.getElementById('clearRouteBtn')?.addEventListener('click', clearRouteFilter);
    
    // Allow Enter key to trigger filter
    document.getElementById('routeSource')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterByRoute();
    });
    document.getElementById('routeDestination')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterByRoute();
    });
    
    // Refresh Analytics button
    document.getElementById('refreshAnalyticsBtn')?.addEventListener('click', () => {
        loadRevenue();
        loadAnalytics();
    });
    
    // Setup navigation
    setupNavigation();
    
    // Setup export buttons
    setupExportButtons();
    
    // Setup search and filters
    setupSearchAndFilters();
    
    // Setup charts
    setupCharts();
    
    // Setup settings toggles
    setupSettings();
    
    // Setup CRUD handlers
    setupCRUDHandlers();
});

// ================== CRUD HANDLERS ==================
function setupCRUDHandlers() {
    // User CRUD
    document.getElementById('addUserBtn')?.addEventListener('click', () => openUserModal());
    document.getElementById('userForm')?.addEventListener('submit', handleUserSubmit);
    
    // Hotel CRUD
    document.getElementById('addHotelBtn')?.addEventListener('click', () => openHotelModal());
    document.getElementById('hotelForm')?.addEventListener('submit', handleHotelSubmit);
    document.getElementById('addHotelFormInline')?.addEventListener('submit', handleInlineHotelSubmit);
    
    // Hotel Booking CRUD
    document.getElementById('hotelBookingForm')?.addEventListener('submit', handleHotelBookingSubmit);
    
    // Review CRUD
    document.getElementById('reviewForm')?.addEventListener('submit', handleReviewSubmit);
    
    // Flight Booking CRUD
    document.getElementById('flightBookingForm')?.addEventListener('submit', handleFlightBookingSubmit);
    
    // Add Data Forms
    document.getElementById('addFlightForm')?.addEventListener('submit', handleAddFlight);
    document.getElementById('addPackageForm')?.addEventListener('submit', handleAddPackage);
    document.getElementById('addDealForm')?.addEventListener('submit', handleAddDeal);
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// User CRUD
function openUserModal(user = null) {
    currentEditId = user ? user.id : null;
    document.getElementById('userModalTitle').textContent = user ? 'Edit User' : 'Add User';
    if (user) {
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userNumber').value = user.number || '';
    } else {
        document.getElementById('userForm').reset();
    }
    openModal('userModal');
}

async function handleUserSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        number: document.getElementById('userNumber').value
    };
    try {
        const url = currentEditId ? `${API_BASE}/api/admin/users/${currentEditId}` : `${API_BASE}/api/admin/users`;
        const response = await fetch(url, {
            method: currentEditId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            closeModal('userModal');
            loadUsers();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadUsers();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Hotel CRUD
function openHotelModal(hotel = null) {
    currentEditId = hotel ? hotel.hotel_id : null;
    document.getElementById('hotelModalTitle').textContent = hotel ? 'Edit Hotel' : 'Add Hotel';
    if (hotel) {
        document.getElementById('hotelName').value = hotel.hotel_name || '';
        document.getElementById('hotelCity').value = hotel.city || '';
        document.getElementById('hotelPrice').value = hotel.price_per_night || '';
        document.getElementById('hotelRating').value = hotel.rating || '';
        document.getElementById('hotelImage').value = hotel.image_url || '';
        document.getElementById('hotelAvailability').value = hotel.availability || 'Available';
    } else {
        document.getElementById('hotelForm').reset();
    }
    openModal('hotelModal');
}

async function handleHotelSubmit(e) {
    e.preventDefault();
    const data = {
        hotel_name: document.getElementById('hotelName').value,
        city: document.getElementById('hotelCity').value,
        price_per_night: document.getElementById('hotelPrice').value,
        rating: document.getElementById('hotelRating').value,
        image_url: document.getElementById('hotelImage').value,
        availability: document.getElementById('hotelAvailability').value
    };
    try {
        const url = currentEditId ? `${API_BASE}/api/admin/hotels/${currentEditId}` : `${API_BASE}/api/admin/hotels`;
        const response = await fetch(url, {
            method: currentEditId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            closeModal('hotelModal');
            loadHotelBookings();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteHotel(id) {
    if (!confirm('Are you sure you want to delete this hotel?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/admin/hotels/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadHotelBookings();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Hotel Booking CRUD
function openHotelBookingModal(booking) {
    currentEditId = booking.customer_id;
    document.getElementById('bookingCustomerName').value = booking.customer_name || '';
    document.getElementById('bookingEmail').value = booking.email || '';
    document.getElementById('bookingPhone').value = booking.phone || '';
    document.getElementById('bookingCheckIn').value = booking.check_in || '';
    document.getElementById('bookingCheckOut').value = booking.check_out || '';
    document.getElementById('bookingGuests').value = booking.guests || '';
    document.getElementById('bookingRooms').value = booking.rooms || '';
    openModal('hotelBookingModal');
}

async function handleHotelBookingSubmit(e) {
    e.preventDefault();
    const data = {
        customer_name: document.getElementById('bookingCustomerName').value,
        email: document.getElementById('bookingEmail').value,
        phone: document.getElementById('bookingPhone').value,
        check_in: document.getElementById('bookingCheckIn').value,
        check_out: document.getElementById('bookingCheckOut').value,
        guests: document.getElementById('bookingGuests').value,
        rooms: document.getElementById('bookingRooms').value
    };
    try {
        const response = await fetch(`${API_BASE}/api/admin/hotel-bookings/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            closeModal('hotelBookingModal');
            loadHotelBookings();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteHotelBooking(id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/admin/hotel-bookings/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadHotelBookings();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Flight Booking CRUD
function openFlightBookingModal(booking) {
    currentEditId = booking.ticket_id;
    document.getElementById('flightPassengerName').value = booking.passenger_name || '';
    document.getElementById('flightNumber').value = booking.flight_no || '';
    document.getElementById('flightSeatNo').value = booking.seat_no || '';
    document.getElementById('flightClass').value = booking.class_type || '';
    document.getElementById('flightSource').value = booking.source || '';
    document.getElementById('flightDestination').value = booking.destination || '';
    document.getElementById('flightDate').value = booking.date || '';
    document.getElementById('flightDepartureTime').value = booking.departure_time || '';
    document.getElementById('flightArrivalTime').value = booking.arrival_time || '';
    document.getElementById('flightFare').value = booking.fare || '';
    document.getElementById('flightPaymentMode').value = booking.payment_mode || '';
    openModal('flightBookingModal');
}

async function handleFlightBookingSubmit(e) {
    e.preventDefault();
    const data = {
        passenger_name: document.getElementById('flightPassengerName').value,
        flight_no: document.getElementById('flightNumber').value,
        seat_no: document.getElementById('flightSeatNo').value,
        class_type: document.getElementById('flightClass').value,
        source: document.getElementById('flightSource').value,
        destination: document.getElementById('flightDestination').value,
        date: document.getElementById('flightDate').value,
        departure_time: document.getElementById('flightDepartureTime').value,
        arrival_time: document.getElementById('flightArrivalTime').value,
        fare: document.getElementById('flightFare').value,
        payment_mode: document.getElementById('flightPaymentMode').value
    };
    try {
        const response = await fetch(`${API_BASE}/api/admin/bookings/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            closeModal('flightBookingModal');
            loadFlightBookings();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteFlightBooking(id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/admin/bookings/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadFlightBookings();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Review CRUD
function openReviewModal(review) {
    currentEditId = review.review_id;
    document.getElementById('reviewRating').value = review.rating || '';
    document.getElementById('reviewText').value = review.review_text || '';
    openModal('reviewModal');
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    const data = {
        rating: document.getElementById('reviewRating').value,
        review_text: document.getElementById('reviewText').value
    };
    try {
        const response = await fetch(`${API_BASE}/api/admin/reviews/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            closeModal('reviewModal');
            loadReviews();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/admin/reviews/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadReviews();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Package CRUD
async function deletePackage(id) {
    if (!confirm('Are you sure you want to delete this package booking?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/admin/packages/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadPackages();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Deal CRUD
async function deleteDeal(id) {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/admin/deals/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadDeals();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Deal Booking CRUD
async function deleteDealBooking(id) {
    if (!confirm('Are you sure you want to delete this deal booking?')) return;
    try {
        const response = await fetch(`${API_BASE}/api/admin/deals/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadDealBookings();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ================== ADD DATA HANDLERS ==================

// Add Flight Handler
async function handleAddFlight(e) {
    e.preventDefault();
    const data = {
        flight_name: document.getElementById('flightName').value,
        flight_no: document.getElementById('flightNo').value,
        source: document.getElementById('flightSourceCity').value,
        destination: document.getElementById('flightDestCity').value,
        departure_time: document.getElementById('flightDepTime').value,
        arrival_time: document.getElementById('flightArrTime').value,
        economy_fare: document.getElementById('flightEconomyFare').value,
        business_fare: document.getElementById('flightBusinessFare').value,
        first_class_fare: document.getElementById('flightFirstFare').value,
        flight_date: document.getElementById('flightDate').value
    };
    try {
        const response = await fetch(`${API_BASE}/api/admin/flights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            document.getElementById('addFlightForm').reset();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Add Package Handler
async function handleAddPackage(e) {
    e.preventDefault();
    const data = {
        package_name: document.getElementById('packageName').value,
        origin: document.getElementById('packageOrigin').value,
        destination: document.getElementById('packageDestination').value,
        duration: document.getElementById('packageDuration').value,
        price: document.getElementById('packagePrice').value,
        description: document.getElementById('packageDescription').value,
        image_url: document.getElementById('packageImage').value,
        inclusions: document.getElementById('packageInclusions').value
    };
    try {
        const response = await fetch(`${API_BASE}/api/admin/packages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            document.getElementById('addPackageForm').reset();
            loadPackages();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Add Deal Handler
async function handleAddDeal(e) {
    e.preventDefault();
    const data = {
        discount_name: document.getElementById('dealTitle').value,
        package_name: document.getElementById('dealPackageName').value,
        origin: document.getElementById('dealOrigin').value,
        destination: document.getElementById('dealDestination').value,
        original_price: document.getElementById('dealOriginalPrice').value,
        discount_percent: document.getElementById('dealDiscount').value,
        travel_date: document.getElementById('dealTravelDate').value,
        duration: document.getElementById('dealDuration').value
    };
    try {
        const response = await fetch(`${API_BASE}/api/admin/deals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            document.getElementById('addDealForm').reset();
            loadDeals();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Inline Hotel Form Handler
async function handleInlineHotelSubmit(e) {
    e.preventDefault();
    const data = {
        hotel_name: document.getElementById('inlineHotelName').value,
        city: document.getElementById('inlineHotelCity').value,
        price_per_night: document.getElementById('inlineHotelPrice').value,
        rating: document.getElementById('inlineHotelRating').value,
        image_url: document.getElementById('inlineHotelImage').value,
        availability: document.getElementById('inlineHotelAvailability').value
    };
    try {
        const response = await fetch(`${API_BASE}/api/admin/hotels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            document.getElementById('addHotelFormInline').reset();
            loadHotelBookings();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Load dashboard statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.stats;
            document.getElementById('statTickets').textContent = stats.totalTickets || 0;
            document.getElementById('statHotels').textContent = stats.totalHotels || 0;
            document.getElementById('statPackages').textContent = stats.totalPackages || 0;
            document.getElementById('statAvgRating').textContent = stats.avgRating || '0.0';
            document.getElementById('statDeals').textContent = stats.totalDeals || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load users from travelsease_db
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/users`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('usersBody');
            tbody.innerHTML = '';
            
            result.data.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td><span style="padding:4px 8px;background:#e0f2fe;color:#0369a1;border-radius:6px;font-size:11px">Customer</span></td>
                    <td>${formatDate(user.created_at) || 'N/A'}</td>
                    <td><span style="padding:4px 8px;background:#dcfce7;color:#16a34a;border-radius:6px;font-size:11px">Active</span></td>
                    <td class="action-btns">
                        <button class="btn-sm btn-edit" onclick='openUserModal(${JSON.stringify(user)})'><i class="fa-solid fa-edit"></i> Edit</button>
                        <button class="btn-sm btn-delete" onclick="deleteUser(${user.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Store flight bookings data for sorting
let flightBookingsData = [];
let flightSortOrder = { source: 'asc', destination: 'asc' };

// Load flight bookings from flight_booking
async function loadFlightBookings() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/bookings`);
        const result = await response.json();
        
        if (result.success) {
            flightBookingsData = result.data;
            renderFlightBookings(flightBookingsData);
        }
    } catch (error) {
        console.error('Error loading flight bookings:', error);
    }
}

// Render flight bookings table
function renderFlightBookings(data) {
    const tbody = document.getElementById('ticketsBody');
    tbody.innerHTML = '';
    
    data.forEach(ticket => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ticket.ticket_id}</td>
            <td>${ticket.passenger_name || 'N/A'}</td>
            <td>${ticket.flight_no || 'N/A'}</td>
            <td>${ticket.seat_no || 'N/A'}</td>
            <td>${ticket.source || 'N/A'}</td>
            <td>${ticket.destination || 'N/A'}</td>
            <td>₹${formatCurrency(ticket.fare)}</td>
            <td>${formatDate(ticket.date)}</td>
            <td>${ticket.payment_mode || 'N/A'}</td>
            <td class="action-btns">
                <button class="btn-sm btn-edit" onclick='openFlightBookingModal(${JSON.stringify(ticket)})'><i class="fa-solid fa-edit"></i> Edit</button>
                <button class="btn-sm btn-delete" onclick="deleteFlightBooking(${ticket.ticket_id})"><i class="fa-solid fa-trash"></i> Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Sort flight bookings by column
function sortFlightBookings(column) {
    const order = flightSortOrder[column];
    
    flightBookingsData.sort((a, b) => {
        const valA = (a[column] || '').toLowerCase();
        const valB = (b[column] || '').toLowerCase();
        
        if (order === 'asc') {
            return valA.localeCompare(valB);
        } else {
            return valB.localeCompare(valA);
        }
    });
    
    // Toggle sort order for next click
    flightSortOrder[column] = order === 'asc' ? 'desc' : 'asc';
    
    renderFlightBookings(flightBookingsData);
}

// Filter flight bookings by route
function filterByRoute() {
    const sourceInput = document.getElementById('routeSource');
    const destInput = document.getElementById('routeDestination');
    const statusDiv = document.getElementById('routeFilterStatus');
    
    const source = sourceInput?.value.trim().toLowerCase();
    const destination = destInput?.value.trim().toLowerCase();
    
    if (!source && !destination) {
        statusDiv.textContent = '⚠️ Please enter at least Source or Destination';
        statusDiv.style.color = '#f59e0b';
        return;
    }
    
    let filtered = flightBookingsData;
    
    if (source) {
        filtered = filtered.filter(ticket => 
            (ticket.source || '').toLowerCase().includes(source)
        );
    }
    
    if (destination) {
        filtered = filtered.filter(ticket => 
            (ticket.destination || '').toLowerCase().includes(destination)
        );
    }
    
    renderFlightBookings(filtered);
    
    // Update status
    const routeText = source && destination 
        ? `${source.toUpperCase()} → ${destination.toUpperCase()}`
        : source 
            ? `from ${source.toUpperCase()}`
            : `to ${destination.toUpperCase()}`;
    
    statusDiv.textContent = `✓ Showing ${filtered.length} flight(s) ${routeText}`;
    statusDiv.style.color = '#10b981';
}

// Clear route filter
function clearRouteFilter() {
    const sourceInput = document.getElementById('routeSource');
    const destInput = document.getElementById('routeDestination');
    const statusDiv = document.getElementById('routeFilterStatus');
    
    if (sourceInput) sourceInput.value = '';
    if (destInput) destInput.value = '';
    if (statusDiv) {
        statusDiv.textContent = '';
    }
    
    renderFlightBookings(flightBookingsData);
}

// Store hotel bookings data for sorting
let hotelBookingsData = [];
let hotelSortOrder = { city: 'asc' };

// Load hotel bookings from hotels_dashboard (with customer info)
async function loadHotelBookings() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/hotel-bookings`);
        const result = await response.json();
        
        if (result.success) {
            hotelBookingsData = result.data;
            renderHotelBookings(hotelBookingsData);
        }
    } catch (error) {
        console.error('Error loading hotel bookings:', error);
    }
}

// Render hotel bookings table
function renderHotelBookings(data) {
    const tbody = document.getElementById('hotelsBody');
    tbody.innerHTML = '';
    
    data.forEach(booking => {
        const row = document.createElement('tr');
        const totalNights = calculateNights(booking.check_in, booking.check_out);
        const totalAmount = booking.price_per_night * totalNights * (booking.rooms || 1);
        
        row.innerHTML = `
            <td>${booking.customer_id}</td>
            <td>${booking.hotel_name || 'N/A'}</td>
            <td>${booking.customer_name || 'N/A'}</td>
            <td>${booking.city || 'N/A'}</td>
            <td>${formatDate(booking.check_in)}</td>
            <td>${formatDate(booking.check_out)}</td>
            <td>₹${formatCurrency(totalAmount)}</td>
            <td class="action-btns">
                <button class="btn-sm btn-edit" onclick='openHotelBookingModal(${JSON.stringify(booking)})'><i class="fa-solid fa-edit"></i> Edit</button>
                <button class="btn-sm btn-delete" onclick="deleteHotelBooking(${booking.customer_id})"><i class="fa-solid fa-trash"></i> Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Sort hotel bookings by city
function sortHotelBookings(column) {
    const order = hotelSortOrder[column];
    
    hotelBookingsData.sort((a, b) => {
        const valA = (a[column] || '').toLowerCase();
        const valB = (b[column] || '').toLowerCase();
        
        if (order === 'asc') {
            return valA.localeCompare(valB);
        } else {
            return valB.localeCompare(valA);
        }
    });
    
    // Toggle sort order for next click
    hotelSortOrder[column] = order === 'asc' ? 'desc' : 'asc';
    
    renderHotelBookings(hotelBookingsData);
}

// Calculate number of nights between two dates
function calculateNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 1;
    const date1 = new Date(checkIn);
    const date2 = new Date(checkOut);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
}

// Load package bookings from package database
async function loadPackages() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/packages`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('packagesBody');
            tbody.innerHTML = '';
            
            result.data.forEach(pkg => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pkg.booking_id}</td>
                    <td>${pkg.package_name || 'N/A'}</td>
                    <td>${pkg.customer_name || 'N/A'}</td>
                    <td>₹${formatCurrency(pkg.total_amount || pkg.price)}</td>
                    <td>${formatDate(pkg.booking_date || pkg.travel_date)}</td>
                    <td class="action-btns">
                        <button class="btn-sm btn-delete" onclick="deletePackage(${pkg.booking_id})"><i class="fa-solid fa-trash"></i> Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading packages:', error);
    }
}

// Load deals from deals database
async function loadDeals() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/deals`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('dealsBody');
            tbody.innerHTML = '';
            
            result.data.forEach(deal => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${deal.deal_id}</td>
                    <td>${deal.discount_name || deal.package_name || 'N/A'}</td>
                    <td>${deal.discount_percent || 0}%</td>
                    <td>${formatDate(deal.travel_date) || 'N/A'}</td>
                    <td class="action-btns">
                        <button class="btn-sm btn-delete" onclick="deleteDeal(${deal.deal_id})"><i class="fa-solid fa-trash"></i> Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading deals:', error);
    }
}

// Load deal bookings (customers who booked deals)
async function loadDealBookings() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/deal-bookings`);
        const result = await response.json();
        
        console.log('Deal Bookings Response:', result);
        
        if (result.success) {
            const tbody = document.getElementById('dealBookingsBody');
            if (!tbody) {
                console.error('dealBookingsBody element not found!');
                return;
            }
            tbody.innerHTML = '';
            
            console.log('Loading', result.data.length, 'deal bookings');
            
            result.data.forEach(booking => {
                const row = document.createElement('tr');
                const route = booking.origin && booking.destination 
                    ? `${booking.origin} → ${booking.destination}` 
                    : booking.destination || 'N/A';
                
                row.innerHTML = `
                    <td>${booking.deal_id}</td>
                    <td>${booking.customer_name || 'N/A'}</td>
                    <td>${booking.email || 'N/A'}</td>
                    <td>${booking.phone || 'N/A'}</td>
                    <td>${route}</td>
                    <td>${booking.discount_name || 'N/A'}</td>
                    <td>${booking.discount_percent || 0}%</td>
                    <td>₹${formatCurrency(booking.total_amount)}</td>
                    <td>${formatDate(booking.travel_date)}</td>
                    <td><span style="color:${booking.payment_status === 'Paid' ? 'green' : 'orange'}">${booking.payment_status || 'Pending'}</span></td>
                    <td class="action-btns">
                        <button class="btn-sm btn-delete" onclick="deleteDealBooking(${booking.deal_id})"><i class="fa-solid fa-trash"></i> Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading deal bookings:', error);
    }
}

// Load reviews from package database
async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/reviews`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('reviewsBody');
            tbody.innerHTML = '';
            
            result.data.forEach(review => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${review.review_id}</td>
                    <td>${review.customer_name || 'N/A'}</td>
                    <td>${'⭐'.repeat(review.rating || 0)}</td>
                    <td>${review.review_text || 'No comment'}</td>
                    <td>${formatDate(review.review_date)}</td>
                    <td class="action-btns">
                        <button class="btn-sm btn-edit" onclick='openReviewModal(${JSON.stringify(review)})'><i class="fa-solid fa-edit"></i> Edit</button>
                        <button class="btn-sm btn-delete" onclick="deleteReview(${review.review_id})"><i class="fa-solid fa-trash"></i> Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Setup navigation
function setupNavigation() {
    const menuLinks = document.querySelectorAll('.menu a');
    const sections = document.querySelectorAll('.container.section, .container#overview');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            menuLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show target section
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'flex';
            }
        });
    });
    
    // Show overview by default
    sections.forEach(section => {
        if (section.id !== 'overview') {
            section.style.display = 'none';
        }
    });
}

// Setup export buttons
function setupExportButtons() {
    // Flight bookings export
    document.getElementById('ticketsExport')?.addEventListener('click', () => {
        exportToCSV('ticketsBody', 'flight-bookings.csv');
    });
    
    // Hotels export
    document.getElementById('hotelsExport')?.addEventListener('click', () => {
        exportToCSV('hotelsBody', 'hotels.csv');
    });
    
    // Packages export
    document.getElementById('packagesExport')?.addEventListener('click', () => {
        exportToCSV('packagesBody', 'packages.csv');
    });
    
    // Deals export
    document.getElementById('dealsExport')?.addEventListener('click', () => {
        exportToCSV('dealsBody', 'deals.csv');
    });
    
    // Reviews export
    document.getElementById('reviewsExport')?.addEventListener('click', () => {
        exportToCSV('reviewsBody', 'reviews.csv');
    });
    
    // Users export
    document.getElementById('usersExport')?.addEventListener('click', () => {
        exportToCSV('usersBody', 'users.csv');
    });
    
    // Payments export
    document.getElementById('paymentsExport')?.addEventListener('click', () => {
        exportToCSV('paymentsBody', 'payments.csv');
    });
    
    // Support export
    document.getElementById('supportExport')?.addEventListener('click', () => {
        exportToCSV('supportBody', 'support-tickets.csv');
    });
    
    // Logs export
    document.getElementById('logsExport')?.addEventListener('click', () => {
        exportToCSV('logsBody', 'audit-logs.csv');
    });
}

// Export table to CSV
function exportToCSV(tableBodyId, filename) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    const table = tbody.closest('table');
    const rows = table.querySelectorAll('tr');
    
    let csv = [];
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = Array.from(cols).map(col => {
            return '"' + col.textContent.replace(/"/g, '""') + '"';
        });
        csv.push(rowData.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Setup search and filters
function setupSearchAndFilters() {
    // Flight bookings search
    document.getElementById('ticketsSearch')?.addEventListener('input', (e) => {
        filterTable('ticketsBody', e.target.value);
    });
    
    // Hotels search
    document.getElementById('hotelsSearch')?.addEventListener('input', (e) => {
        filterTable('hotelsBody', e.target.value);
    });
    
    // Packages search
    document.getElementById('packagesSearch')?.addEventListener('input', (e) => {
        filterTable('packagesBody', e.target.value);
    });
    
    // Deals search
    document.getElementById('dealsSearch')?.addEventListener('input', (e) => {
        filterTable('dealsBody', e.target.value);
    });
    
    // Reviews search
    document.getElementById('reviewsSearch')?.addEventListener('input', (e) => {
        filterTable('reviewsBody', e.target.value);
    });
    
    // Users search
    document.getElementById('usersSearch')?.addEventListener('input', (e) => {
        filterTable('usersBody', e.target.value);
    });
}

// Filter table rows
function filterTable(tableBodyId, searchTerm) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// Setup charts
async function setupCharts() {
    // Get stats data for charts
    let flightCount = 0, hotelCount = 0, packageCount = 0, dealCount = 0;
    
    try {
        const statsResponse = await fetch(`${API_BASE}/api/admin/stats`);
        const statsData = await statsResponse.json();
        
        console.log('Stats for chart:', statsData);
        
        if (statsData.success && statsData.stats) {
            flightCount = statsData.stats.totalTickets || 0;
            hotelCount = statsData.stats.totalHotels || 0;
            packageCount = statsData.stats.totalPackages || 0;
            dealCount = statsData.stats.totalDeals || 0;
        }
        
        console.log('Chart data:', { flightCount, hotelCount, packageCount, dealCount });
    } catch (error) {
        console.error('Error loading stats for charts:', error);
    }
    
    // Bookings Chart
    const bookingsCtx = document.getElementById('bookingsChart');
    if (bookingsCtx) {
        new Chart(bookingsCtx, {
            type: 'bar',
            data: {
                labels: ['Flights', 'Hotels', 'Packages', 'Deals'],
                datasets: [{
                    label: 'Bookings',
                    data: [flightCount, hotelCount, packageCount, dealCount],
                    backgroundColor: ['#2563eb', '#06b6d4', '#22c55e', '#f59e0b'],
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' bookings';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // Payments Chart
    const paymentsCtx = document.getElementById('paymentsChart');
    if (paymentsCtx) {
        new Chart(paymentsCtx, {
            type: 'doughnut',
            data: {
                labels: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'],
                datasets: [{
                    data: [40, 30, 20, 10],
                    backgroundColor: ['#2563eb', '#06b6d4', '#22c55e', '#f59e0b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 19000, 15000, 25000],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Conversion Chart
    const conversionCtx = document.getElementById('conversionChart');
    if (conversionCtx) {
        new Chart(conversionCtx, {
            type: 'bar',
            data: {
                labels: ['Visits', 'Searches', 'Bookings'],
                datasets: [{
                    label: 'Conversion Funnel',
                    data: [1000, 600, 150],
                    backgroundColor: ['#2563eb', '#06b6d4', '#22c55e']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Load Revenue & Profit/Loss
window.loadRevenue = async function loadRevenue() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/revenue`);
        const result = await response.json();
        
        if (result.success) {
            const rev = result.revenue;
            
            // Total Revenue
            const totalRevenueDiv = document.getElementById('totalRevenue');
            totalRevenueDiv.innerHTML = `
                <div style="font-size: 48px; font-weight: 700; margin-bottom: 5px;">
                    ₹${formatCurrency(rev.total)}
                </div>
                <div style="font-size: 14px; opacity: 0.9;">Total Revenue (All Categories)</div>
            `;
            
            // Individual revenues
            document.getElementById('flightRevenue').textContent = `₹${formatCurrency(rev.flights)}`;
            document.getElementById('hotelRevenue').textContent = `₹${formatCurrency(rev.hotels)}`;
            document.getElementById('packageRevenue').textContent = `₹${formatCurrency(rev.packages)}`;
            document.getElementById('dealRevenue').textContent = `₹${formatCurrency(rev.deals)}`;
            
            // Profit & Loss
            const profitLossDiv = document.getElementById('profitLoss');
            const profitColor = rev.profit > 0 ? '#4ade80' : '#ef4444';
            profitLossDiv.innerHTML = `
                <div style="font-size: 48px; font-weight: 700; margin-bottom: 5px; color: ${profitColor};">
                    ₹${formatCurrency(rev.profit)}
                </div>
                <div style="font-size: 14px; opacity: 0.9;">Net Profit</div>
            `;
            
            document.getElementById('plRevenue').textContent = `₹${formatCurrency(rev.total)}`;
            document.getElementById('plCosts').textContent = `₹${formatCurrency(rev.costs)}`;
            document.getElementById('plProfit').textContent = `₹${formatCurrency(rev.profit)}`;
            document.getElementById('plMargin').textContent = `${rev.profitMargin}%`;
        }
    } catch (error) {
        console.error('Error loading revenue:', error);
    }
}

// Load Analytics & Insights
window.loadAnalytics = async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/analytics`);
        const result = await response.json();
        
        if (result.success) {
            const analytics = result.analytics;
            
            // 1. Popular Routes
            const popularRoutesDiv = document.getElementById('popularRoutes');
            if (analytics.popularRoutes && analytics.popularRoutes.length > 0) {
                popularRoutesDiv.innerHTML = analytics.popularRoutes.map((route, index) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span style="font-weight: 500;">${index + 1}. ${route.source} → ${route.destination}</span>
                        <span style="color: var(--primary); font-weight: 600;">${route.booking_count} bookings</span>
                    </div>
                `).join('');
            } else {
                popularRoutesDiv.innerHTML = '<p style="color: var(--muted); text-align: center;">No data available</p>';
            }
            
            // 2. Least Popular Routes
            const leastPopularDiv = document.getElementById('leastPopularRoutes');
            if (analytics.leastPopularRoutes && analytics.leastPopularRoutes.length > 0) {
                leastPopularDiv.innerHTML = analytics.leastPopularRoutes.map((route, index) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span style="font-weight: 500;">${index + 1}. ${route.source} → ${route.destination}</span>
                        <span style="color: var(--warning); font-weight: 600;">${route.booking_count} bookings</span>
                    </div>
                `).join('');
            } else {
                leastPopularDiv.innerHTML = '<p style="color: var(--muted); text-align: center;">No data available</p>';
            }
            
            // 3. Top Packages
            const topPackagesDiv = document.getElementById('topPackages');
            if (analytics.topPackages && analytics.topPackages.length > 0) {
                topPackagesDiv.innerHTML = analytics.topPackages.map((pkg, index) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span style="font-weight: 500;">${index + 1}. ${pkg.package_name}</span>
                        <span style="color: var(--success); font-weight: 600;">${pkg.booking_count} bookings</span>
                    </div>
                `).join('');
            } else {
                topPackagesDiv.innerHTML = '<p style="color: var(--muted); text-align: center;">No bookings yet</p>';
            }
            
            // 4. Top Deals
            const topDealsDiv = document.getElementById('topDeals');
            if (analytics.topDeals && analytics.topDeals.length > 0) {
                topDealsDiv.innerHTML = analytics.topDeals.map((deal, index) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span style="font-weight: 500;">${index + 1}. ${deal.discount_name}</span>
                        <span style="color: var(--primary); font-weight: 600;">${deal.booking_count} bookings</span>
                    </div>
                `).join('');
            } else {
                topDealsDiv.innerHTML = '<p style="color: var(--muted); text-align: center;">No deal bookings yet</p>';
            }
            
            // 5. Max Tickets Sold
            const maxTicketsDiv = document.getElementById('maxTickets');
            if (analytics.maxTickets) {
                maxTicketsDiv.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: 700; color: var(--success); margin-bottom: 10px;">
                            ${analytics.maxTickets.total_tickets}
                        </div>
                        <div style="font-size: 16px; font-weight: 500;">
                            ${analytics.maxTickets.source} → ${analytics.maxTickets.destination}
                        </div>
                        <div style="color: var(--muted); margin-top: 5px;">Most booked route</div>
                    </div>
                `;
            } else {
                maxTicketsDiv.innerHTML = '<p style="color: var(--muted); text-align: center;">No data available</p>';
            }
            
            // 6. AI Predictions
            const aiPredictionsDiv = document.getElementById('aiPredictions');
            if (analytics.aiPredictions && analytics.aiPredictions.length > 0) {
                aiPredictionsDiv.innerHTML = analytics.aiPredictions.map(prediction => `
                    <div style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 5px;">
                            <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                ${prediction.confidence} Confidence
                            </span>
                        </div>
                        <div style="font-size: 13px; line-height: 1.5;">
                            ${prediction.message}
                        </div>
                    </div>
                `).join('');
            } else {
                aiPredictionsDiv.innerHTML = '<p style="text-align: center;">Insufficient data for predictions</p>';
            }
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Setup settings toggles
function setupSettings() {
    const toggles = document.querySelectorAll('.toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const currentState = toggle.getAttribute('data-on') === 'true';
            toggle.setAttribute('data-on', !currentState);
        });
    });
    
    // Save settings button
    document.getElementById('settingsSave')?.addEventListener('click', () => {
        alert('Settings saved successfully!');
    });
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatCurrency(amount) {
    if (!amount) return '0';
    return Number(amount).toLocaleString('en-IN');
}
