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
    }).format(price) + ' DA';
}

/**
 * Open add product modal
 */
function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un Article';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').style.display = 'block';
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
    document.getElementById('productModal').style.display = 'block';
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
    document.getElementById('salePreview').innerHTML = '';
    updateSaleArticleSelect();
    document.getElementById('saleModal').style.display = 'block';
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
function updateSaleArticleSelect() {
    const select = document.getElementById('sale_article');
    select.innerHTML = '<option value="">-- Sélectionner un article --</option>';

    stockData.forEach(item => {
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
 * Open history modal
 */
async function openHistoryModal() {
    document.getElementById('historyModal').style.display = 'block';
    await loadHistory();
}

/**
 * Close history modal
 */
function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

/**
 * Load sales history
 */
async function loadHistory() {
    try {
        const response = await fetch('/api/historique');
        const history = await response.json();
        renderHistoryTable(history);
    } catch (error) {
        showAlert('Erreur lors du chargement de l\'historique', 'error');
        console.error('Error:', error);
    }
}

/**
 * Render history table
 */
function renderHistoryTable(history) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Aucune vente enregistrée</td></tr>';
        return;
    }

    history.forEach(item => {
        const row = document.createElement('tr');

        // Format date
        const date = new Date(item.date);
        const formattedDate = date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${item.nom_article}</td>
            <td>${item.quantite}</td>
            <td>${formatPrice(item.prix_total)}</td>
        `;

        tbody.appendChild(row);
    });
}

// Close modals when clicking outside
window.onclick = function (event) {
    const productModal = document.getElementById('productModal');
    const saleModal = document.getElementById('saleModal');
    const historyModal = document.getElementById('historyModal');

    if (event.target === productModal) {
        closeProductModal();
    }
    if (event.target === saleModal) {
        closeSaleModal();
    }
    if (event.target === historyModal) {
        closeHistoryModal();
    }
}
