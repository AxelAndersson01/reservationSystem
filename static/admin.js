// Constants
const API_ENDPOINTS = {
    MENU_ITEMS: '/api/menu_items',
    ADD_MENU_ITEM: '/api/add_menu_item',
    RESERVATION_STATS: '/api/reservation_stats',
    ACCEPT_RESERVATION: '/api/accept_reservation',
    TABLE_UTILIZATION: '/api/table_utilization'
};

// Menu Management
function handleMenuItemFormSubmit(e) {
    e.preventDefault();
    
    const menuItemData = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        price: document.getElementById('itemPrice').value
    };

    fetch(API_ENDPOINTS.ADD_MENU_ITEM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItemData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        loadMenuItems();
    })
    .catch(error => console.error('Error adding menu item:', error));
}

function loadMenuItems() {
    fetch(API_ENDPOINTS.MENU_ITEMS)
        .then(response => response.json())
        .then(items => {
            const menuItemsList = document.getElementById('menuItemsList');
            menuItemsList.innerHTML = items.map(item => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${item.name}</h6>
                            <small class="text-muted">${item.category} - $${item.price}</small>
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => console.error('Error loading menu items:', error));
}

// Reservation Management
function loadStatistics() {
    fetch(API_ENDPOINTS.RESERVATION_STATS)
        .then(response => response.json())
        .then(data => {
            updateReservationsTable(data.reservations);
            updateMenuStats(data.menu_stats);
        })
        .catch(error => console.error('Error loading statistics:', error));
}

function updateReservationsTable(reservations) {
    const reservationsTable = document.getElementById('reservationsTable');
    reservationsTable.innerHTML = reservations.map(res => `
        <tr>
            <td>${new Date(res.reservation_time).toLocaleString()}</td>
            <td>${res.customer_name}</td>
            <td>${res.table_name} (${res.seats} seats)</td>
            <td>${res.party_size}</td>
            <td>${res.status}</td>
        </tr>
    `).join('');
}

function updateMenuStats(menuStats) {
    const menuStatsDiv = document.getElementById('menuStats');
    menuStatsDiv.innerHTML = menuStats.map(stat => `
        <div class="mb-2">
            <strong>${stat.category}</strong><br>
            Items: ${stat.number_of_items}<br>
            Avg Price: $${Number(stat.average_price).toFixed(2)}<br>
            Cheapest: $${Number(stat.cheapest_item).toFixed(2)}<br>
            Most Expensive: $${Number(stat.most_expensive_item).toFixed(2)}
        </div>
    `).join('');
}

function loadPendingReservations() {
    fetch(API_ENDPOINTS.RESERVATION_STATS)
        .then(response => response.json())
        .then(data => {
            const pendingList = document.getElementById('pendingReservationsList');
            const pendingReservations = data.reservations.filter(res => res.status === 'pending');
            
            pendingList.innerHTML = pendingReservations.map(res => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${res.customer_name}</strong> - ${new Date(res.reservation_time).toLocaleString()}<br>
                        Table: ${res.table_name} (${res.seats} seats), Party: ${res.party_size}
                    </div>
                    <button class="btn btn-success btn-sm accept-btn" data-id="${res.id}">Accept</button>
                </div>
            `).join('');

            attachAcceptButtonListeners();
        })
        .catch(error => console.error('Error loading pending reservations:', error));
}

function attachAcceptButtonListeners() {
    document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            fetch(`${API_ENDPOINTS.ACCEPT_RESERVATION}/${id}`, { method: 'POST' })
                .then(response => response.json())
                .then(result => {
                    if (result.error) throw new Error(result.error);
                    loadPendingReservations();
                    loadStatistics();
                })
                .catch(error => console.error('Error accepting reservation:', error));
        });
    });
}

// Table Utilization
function handleTableUtilization() {
    const date = document.getElementById('utilizationDate').value;
    if (!date) return;

    fetch(`${API_ENDPOINTS.TABLE_UTILIZATION}?date=${date}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('utilizationTable');
            if (data.error) {
                tbody.innerHTML = `<tr><td colspan="3">${data.error}</td></tr>`;
                return;
            }
            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3">No data available.</td></tr>`;
                return;
            }
            
            tbody.innerHTML = data.map(row => `
                <tr>
                    <td>${row.table_name}</td>
                    <td>${row.seats}</td>
                    <td>${row.utilization_percent ? Number(row.utilization_percent).toFixed(2) : '0.00'}%</td>
                </tr>
            `).join('');
        })
        .catch(error => {
            document.getElementById('utilizationTable').innerHTML = 
                `<tr><td colspan="3">Error loading data.</td></tr>`;
            console.error('Error loading utilization:', error);
        });
}

// Table Management
function handleTableFormSubmit(e) {
    e.preventDefault();

    const tableData = {
        table_number: document.getElementById('tableNumber').value,
        capacity: document.getElementById('capacity').value
    };

    fetch('/api/add_table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        loadTablesList();
    })
    .catch(error => console.error('Error adding table:', error));
}

function loadTablesList() {
    fetch('/api/tables')
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    loadMenuItems();
    loadStatistics();
    loadPendingReservations();

    // Attach event listeners
    document.getElementById('menuItemForm').addEventListener('submit', handleMenuItemFormSubmit);
    document.getElementById('loadUtilizationBtn').addEventListener('click', handleTableUtilization);
    document.getElementById('tableForm').addEventListener('submit', handleTableFormSubmit);
    loadTablesList();
}); 