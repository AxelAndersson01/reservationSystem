// Constants
const API_ENDPOINTS = {
    TABLES: '/api/tables',
    AVAILABLE_TABLES: '/api/tables/available',
    BOOKINGS: '/api/bookings'
};

// Table Management
function checkAvailability() {
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const partySize = document.getElementById('party_size').value;
    
    if (!date || !time || !partySize) return;

    const checkTime = `${date} ${time}`;
    fetch(`${API_ENDPOINTS.AVAILABLE_TABLES}?time=${checkTime}&party_size=${partySize}`)
        .then(response => response.json())
        .then(tables => {
            const tablesList = document.getElementById('tablesList');
            tablesList.innerHTML = '';
            
            if (tables.length === 0) return;

            tablesList.innerHTML = tables.map(table => `
                <div class="list-group-item clickable-table" data-table-id="${table.id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${table.name}</h6>
                            <small class="text-muted">${table.seats} seats</small>
                        </div>
                    </div>
                </div>
            `).join('');

            attachTableSelectionListeners();
        })
        .catch(error => console.error('Error checking table availability:', error));
}

function attachTableSelectionListeners() {
    document.querySelectorAll('.clickable-table').forEach(table => {
        table.addEventListener('click', function() {
            document.querySelectorAll('.clickable-table').forEach(el => 
                el.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('table').value = this.dataset.tableId;
        });
    });
}

function loadTables() {
    fetch(API_ENDPOINTS.TABLES)
        .then(response => response.json())
        .then(tables => {
            const tablesList = document.getElementById('tablesList');
            tablesList.innerHTML = tables.map(table => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${table.name}</h6>
                            <small class="text-muted">${table.seats} seats</small>
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => console.error('Error loading tables:', error));
}

// Booking Management
function handleBookingFormSubmit(e) {
    e.preventDefault();
    
    const bookingData = {
        name: document.getElementById('name').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        table_id: document.getElementById('table').value,
        party_size: document.getElementById('party_size').value,
        special_requests: document.getElementById('special_requests').value
    };

    if (!bookingData.name || !bookingData.date || !bookingData.time || 
        !bookingData.table_id || !bookingData.party_size) return;

    fetch(API_ENDPOINTS.BOOKINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        document.getElementById('bookingForm').reset();
        document.querySelectorAll('.clickable-table').forEach(el => 
            el.classList.remove('selected'));
    })
    .catch(error => console.error('Error creating reservation:', error));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    loadTables();

    // Attach event listeners
    document.getElementById('checkAvailability').addEventListener('click', checkAvailability);
    document.getElementById('bookingForm').addEventListener('submit', handleBookingFormSubmit);
});

// Some css
const style = document.createElement('style');
style.textContent = '.clickable-table.selected { background: #d1e7dd; border-color: #0f5132; }';
document.head.appendChild(style); 