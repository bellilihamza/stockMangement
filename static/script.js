/**
 * Inventory Management System - Frontend JavaScript
 * Handles all client-side interactions and API calls
 */

// Global variables
let stockData = [];
let editingId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Request notification permission
    requestNotificationPermission();

    // Load initial stock data
    refreshStock();

    // Check for alerts every 5 seconds
    setInterval(checkAlerts, 5000);

    // Update sync status immediately and every 10 seconds
    updateSyncStatus();
    setInterval(updateSyncStatus, 10000);
});

/**
 * Request browser notification permission
 */
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

/**
 * Refresh stock data from server
 */
async function refreshStock() {
    try {
        const response = await fetch('/api/stock');
        stockData = await response.json();
        renderStockTable();
        updateSaleArticleSelect();
    } catch (error) {
        showAlert('Erreur lors du chargement des données', 'error');
        console.error('Error:', error);
    }
}

/**
 * Render the stock table
 */
function renderStockTable() {
    const tbody = document.getElementById('stockTableBody');
    tbody.innerHTML = '';

    if (stockData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Aucun article en stock</td></tr>';
        return;
    }

    stockData.forEach(item => {
        const row = document.createElement('tr');

        // Check if stock is low
        const isLowStock = item.stock <= item.min_stock;
        if (isLowStock) {
            row.classList.add('low-stock');
        }

        row.innerHTML = `
            <td>${item.nom_article}</td>
            <td>${item.stock} ${isLowStock ? '⚠️' : ''}</td>
            <td>${formatPrice(item.prix)}</td>
            <td>${item.min_stock}</td>
            <td class="action-buttons">
                <button class="btn btn-warning btn-sm" onclick="editProduct(${item.id})">Modifier</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${item.id})">Supprimer</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Format price with currency
 */
function formatPrice(price) {
    return new Intl.NumberFormat('fr-DZ', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price) + ' TND';
}

/**
 * Open add product modal
 */
function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un Article';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').style.display = 'flex';
}

/**
 * Edit product
 */
function editProduct(id) {
    const product = stockData.find(item => item.id === id);
    if (!product) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Modifier l\'Article';
    document.getElementById('productId').value = id;
    document.getElementById('nom_article').value = product.nom_article;
    document.getElementById('stock').value = product.stock;
    document.getElementById('prix').value = product.prix;
    document.getElementById('min_stock').value = product.min_stock;
    document.getElementById('productModal').style.display = 'flex';
}

/**
 * Close product modal
 */
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('productForm').reset();
    editingId = null;
}

/**
 * Save product (add or update)
 */
async function saveProduct(event) {
    event.preventDefault();

    const formData = {
        nom_article: document.getElementById('nom_article').value,
        stock: parseInt(document.getElementById('stock').value),
        prix: parseFloat(document.getElementById('prix').value),
        min_stock: parseInt(document.getElementById('min_stock').value)
    };

    try {
        let response;
        if (editingId) {
            // Update existing product
            response = await fetch(`/api/stock/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            // Add new product
            response = await fetch('/api/stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }

        const result = await response.json();

        if (result.success) {
            showAlert(result.message, 'success');
            closeProductModal();
            refreshStock();
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Erreur lors de l\'enregistrement', 'error');
        console.error('Error:', error);
    }
}

/**
 * Delete product
 */
async function deleteProduct(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
        return;
    }

    try {
        const response = await fetch(`/api/stock/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message, 'success');
            refreshStock();
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Erreur lors de la suppression', 'error');
        console.error('Error:', error);
    }
}

/**
 * Open sale modal
 */
function openSaleModal() {
    document.getElementById('saleForm').reset();
    document.getElementById('saleSearch').value = ''; // Clear search
    document.getElementById('salePreview').innerHTML = '';
    updateSaleArticleSelect();
    document.getElementById('saleModal').style.display = 'flex';
}

/**
 * Close sale modal
 */
function closeSaleModal() {
    document.getElementById('saleModal').style.display = 'none';
    document.getElementById('saleForm').reset();
}

/**
 * Update sale article select dropdown
 */
function updateSaleArticleSelect(filteredData = null) {
    const select = document.getElementById('sale_article');
    select.innerHTML = '<option value="">-- Sélectionner un article --</option>';

    const displayData = filteredData || stockData;

    displayData.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.nom_article} (Stock: ${item.stock})`;
        select.appendChild(option);
    });

    // Add change event to show preview
    select.onchange = updateSalePreview;
    document.getElementById('sale_quantite').oninput = updateSalePreview;
}

/**
 * Filter sale articles based on search input
 */
function filterSaleArticles() {
    const searchTerm = document.getElementById('saleSearch').value.toLowerCase();
    const filteredStock = stockData.filter(item =>
        item.nom_article.toLowerCase().includes(searchTerm)
    );
    updateSaleArticleSelect(filteredStock);
}

/**
 * Update sale preview
 */
function updateSalePreview() {
    const articleId = parseInt(document.getElementById('sale_article').value);
    const quantite = parseInt(document.getElementById('sale_quantite').value) || 0;
    const preview = document.getElementById('salePreview');

    if (!articleId || quantite <= 0) {
        preview.innerHTML = '';
        return;
    }

    const article = stockData.find(item => item.id === articleId);
    if (!article) return;

    const total = article.prix * quantite;
    const stockAfter = article.stock - quantite;

    let warningMsg = '';
    if (quantite > article.stock) {
        warningMsg = '<div style="color: #dc3545; font-weight: bold;">⚠️ Stock insuffisant!</div>';
    } else if (stockAfter <= article.min_stock) {
        warningMsg = '<div style="color: #ffc107; font-weight: bold;">⚠️ Attention: Stock sera faible après cette vente</div>';
    }

    preview.innerHTML = `
        <strong>Aperçu de la vente:</strong><br>
        Article: ${article.nom_article}<br>
        Prix unitaire: ${formatPrice(article.prix)}<br>
        Quantité: ${quantite}<br>
        <strong>Total: ${formatPrice(total)}</strong><br>
        Stock actuel: ${article.stock} → ${stockAfter}
        ${warningMsg}
    `;
}

/**
 * Process sale
 */
async function processSale(event) {
    event.preventDefault();

    const saleData = {
        article_id: parseInt(document.getElementById('sale_article').value),
        quantite: parseInt(document.getElementById('sale_quantite').value)
    };

    try {
        const response = await fetch('/api/vente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message, 'success');
            closeSaleModal();
            refreshStock();
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Erreur lors de la vente', 'error');
        console.error('Error:', error);
    }
}

/**
 * Check for low stock alerts
 */
async function checkAlerts() {
    try {
        const response = await fetch('/api/alerts');
        const alerts = await response.json();

        if (alerts.length > 0) {
            alerts.forEach(item => {
                // Show browser notification
                showBrowserNotification(
                    'Alerte Stock Faible!',
                    `${item.nom_article}: Stock = ${item.stock} (Min: ${item.min_stock})`
                );
            });
        }
    } catch (error) {
        console.error('Error checking alerts:', error);
    }
}

/**
 * Show browser notification
 */
function showBrowserNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '📦',
            badge: '⚠️'
        });
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';

    alert.innerHTML = `
        <h4>${icon} ${type === 'success' ? 'Succès' : type === 'error' ? 'Erreur' : 'Attention'}</h4>
        <p>${message}</p>
    `;

    container.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/**
 * Filter table by search input
 */
function filterTable() {
    const searchInput = document.getElementById('searchInput');
    const filter = searchInput.value.toLowerCase();
    const table = document.getElementById('stockTable');
    const rows = table.getElementsByTagName('tr');

    // Loop through all table rows (skip header)
    for (let i = 1; i < rows.length; i++) {
        const articleCell = rows[i].getElementsByTagName('td')[0];
        if (articleCell) {
            const articleName = articleCell.textContent || articleCell.innerText;
            if (articleName.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }
}

/**
 * Switch between Stock and History views
 */
function showView(viewName) {
    const stockView = document.getElementById('stockView');
    const historyView = document.getElementById('historyView');
    const navHistory = document.getElementById('navHistory');
    const navStock = document.getElementById('navStock');
    const searchInput = document.getElementById('searchInput');

    if (viewName === 'history') {
        stockView.classList.remove('active');
        historyView.classList.add('active');
        navHistory.style.display = 'none';
        navStock.style.display = 'block';
        searchInput.style.display = 'none'; // Hide main search for history
        clearHistoryFilters();
    } else {
        stockView.classList.add('active');
        historyView.classList.remove('active');
        navHistory.style.display = 'block';
        navStock.style.display = 'none';
        searchInput.style.display = 'block';
        refreshStock();
    }
}

/**
 * Load sales history with filters
 */
async function loadHistory() {
    try {
        const start = document.getElementById('historyStart').value;
        const end = document.getElementById('historyEnd').value;

        let url = '/api/historique';
        const params = new URLSearchParams();
        if (start) params.append('start_date', start);
        if (end) params.append('end_date', end);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        renderHistoryTable(data.sales);
        updateHistorySummary(data.total_amount, data.total_quantity);
    } catch (error) {
        showAlert('Erreur lors du chargement de l\'historique', 'error');
        console.error('History Load Error:', error);
    }
}

/**
 * Render history table with local search filter
 */
function renderHistoryTable(history) {
    const tbody = document.getElementById('historyTableBody');
    const searchFilter = document.getElementById('historySearch').value.toLowerCase().trim();
    tbody.innerHTML = '';

    // Local search filter for instant responsiveness
    const filteredHistory = history.filter(item =>
        item.nom_article.toLowerCase().includes(searchFilter)
    );

    if (filteredHistory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 60px; color: #8c98a4;">
            <div style="font-size: 24px; margin-bottom: 10px;">🔍</div>
            Aucune vente ne correspond à vos critères
        </td></tr>`;
        return;
    }

    filteredHistory.forEach(item => {
        const row = document.createElement('tr');

        const date = new Date(item.date);
        const formattedDate = date.toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        // Safe price calculation
        const unitPrice = item.quantite > 0 ? item.prix_total / item.quantite : 0;

        row.innerHTML = `
            <td style="font-family: monospace; color: #6c757d;">${formattedDate}</td>
            <td style="font-weight: 600; color: #2c3e50;">${item.nom_article}</td>
            <td style="font-weight: 500;">${item.quantite}</td>
            <td style="color: #495057;">${formatPrice(unitPrice)}</td>
            <td style="font-weight: 700; color: #27ae60;">${formatPrice(item.prix_total)}</td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Update summary dashboard
 */
function updateHistorySummary(totalAmount, totalQty) {
    const amountEl = document.getElementById('totalHistoryAmount');
    const qtyEl = document.getElementById('totalHistoryQty');

    if (amountEl) amountEl.textContent = formatPrice(totalAmount);
    if (qtyEl) qtyEl.textContent = totalQty.toLocaleString('fr-FR');
}

/**
 * Handle preset period filters
 */
function setHistoryFilter(period) {
    const startInput = document.getElementById('historyStart');
    const endInput = document.getElementById('historyEnd');

    // Update button states
    const btnIds = { 'today': 'btnToday', 'week': 'btnWeek', 'month': 'btnMonth', 'all': 'btnAll' };
    Object.values(btnIds).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(btnIds[period]);
    if (activeBtn) activeBtn.classList.add('active');

    const now = new Date();
    let startDate = "";
    let endDate = now.toISOString().split('T')[0];

    if (period === 'today') {
        startDate = now.toISOString().split('T')[0];
    } else if (period === 'week') {
        const date = new Date();
        date.setDate(now.getDate() - 7);
        startDate = date.toISOString().split('T')[0];
    } else if (period === 'month') {
        const date = new Date();
        date.setMonth(now.getMonth() - 1);
        startDate = date.toISOString().split('T')[0];
    } else if (period === 'all') {
        startDate = "";
        endDate = "";
    }

    startInput.value = startDate;
    endInput.value = endDate;

    loadHistory();
}

/**
 * Common filter application
 */
function applyHistoryFilters() {
    loadHistory();
}

/**
 * Reset all history filters to defaults
 */
function clearHistoryFilters() {
    document.getElementById('historyStart').value = "";
    document.getElementById('historyEnd').value = "";
    document.getElementById('historySearch').value = "";

    // Reset to 'All'
    setHistoryFilter('all');
}

// Close modals when clicking outside
window.onclick = function (event) {
    const productModal = document.getElementById('productModal');
    const saleModal = document.getElementById('saleModal');

    if (event.target === productModal) {
        closeProductModal();
    }
    if (event.target === saleModal) {
        closeSaleModal();
    }
}

// ===== CLOUD SYNC FUNCTIONS =====

/**
 * Update sync status from server
 */
async function updateSyncStatus() {
    try {
        const response = await fetch('/api/sync/status');
        const status = await response.json();
        renderSyncBadge(status);
    } catch (error) {
        console.error('Error updating sync status:', error);
        // Show offline status if can't reach server
        renderSyncBadge({
            status: 'offline',
            message: 'Hors ligne',
            last_sync: null
        });
    }
}

/**
 * Render sync status badge
 */
function renderSyncBadge(status) {
    const badge = document.getElementById('syncStatusBadge');
    const icon = badge.querySelector('.sync-icon');
    const text = badge.querySelector('.sync-text');

    // Remove all status classes
    badge.classList.remove('sync-online', 'sync-offline', 'sync-syncing', 'sync-restored');

    // Update based on status
    switch (status.status) {
        case 'online':
            badge.classList.add('sync-online');
            icon.textContent = '🟢';
            text.textContent = 'En ligne';
            break;
        case 'offline':
            badge.classList.add('sync-offline');
            icon.textContent = '🔴';
            text.textContent = 'Hors ligne';
            break;
        case 'syncing':
            badge.classList.add('sync-syncing');
            icon.textContent = '🟡';
            text.textContent = 'Synchronisation...';
            break;
        case 'restored':
            badge.classList.add('sync-restored');
            icon.textContent = '🔵';
            text.textContent = 'Restauré';
            // Show notification
            showAlert('Données restaurées depuis le cloud', 'success');
            // Reset to online after 5 seconds
            setTimeout(() => {
                updateSyncStatus();
            }, 5000);
            break;
        default:
            badge.classList.add('sync-offline');
            icon.textContent = '🔴';
            text.textContent = 'Inconnu';
    }

    // Update title with last sync time
    if (status.last_sync) {
        badge.title = `Dernière sync: ${status.last_sync}`;
    } else {
        badge.title = status.message || 'Statut de synchronisation';
    }
}

/**
 * Manually trigger cloud sync
 */
async function triggerSync() {
    try {
        // Show syncing status immediately
        renderSyncBadge({
            status: 'syncing',
            message: 'Synchronisation en cours...',
            last_sync: null
        });

        // Trigger sync
        const response = await fetch('/api/sync/now', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showAlert(result.message, 'success');
        } else {
            showAlert(result.message, 'error');
        }

        // Update status after sync
        setTimeout(() => {
            updateSyncStatus();
        }, 1000);

    } catch (error) {
        showAlert('Erreur lors de la synchronisation', 'error');
        console.error('Error triggering sync:', error);

        // Update status
        setTimeout(() => {
            updateSyncStatus();
        }, 1000);
    }
}
