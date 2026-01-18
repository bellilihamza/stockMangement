"""
Inventory Management System - Flask Backend
Manages stock using Excel files with pandas
"""

from flask import Flask, render_template, request, jsonify
import pandas as pd
import os
from datetime import datetime
import cloud_sync
import config

app = Flask(__name__)

# File paths
STOCK_FILE = 'data/stock.xlsx'
HISTORIQUE_FILE = 'data/historique.xlsx'

# Cloud sync configuration
SPREADSHEET_ID = config.SPREADSHEET_ID
SERVICE_ACCOUNT_FILE = config.SERVICE_ACCOUNT_FILE

# Initialize Excel files if they don't exist
def init_excel_files():
    """Create Excel files with proper structure if they don't exist"""
    os.makedirs('data', exist_ok=True)
    
    # Try to restore from cloud if files are missing
    files_missing = not os.path.exists(STOCK_FILE) or not os.path.exists(HISTORIQUE_FILE)
    
    if files_missing and cloud_sync.check_internet_connection():
        print("📥 Fichiers manquants - Tentative de restauration depuis le cloud...")
        result = cloud_sync.restore_from_cloud(
            SPREADSHEET_ID,
            SERVICE_ACCOUNT_FILE,
            STOCK_FILE,
            HISTORIQUE_FILE
        )
        if result['success']:
            print(f"✅ {result['message']}")
            return
        else:
            print(f"⚠️ {result['message']}")
    
    # Initialize stock.xlsx
    if not os.path.exists(STOCK_FILE):
        df_stock = pd.DataFrame(columns=['id', 'nom_article', 'stock', 'prix', 'min_stock'])
        # Add sample data
        sample_data = [
            {'id': 1, 'nom_article': 'Laptop Dell', 'stock': 15, 'prix': 45000, 'min_stock': 5},
            {'id': 2, 'nom_article': 'Souris Logitech', 'stock': 3, 'prix': 1500, 'min_stock': 10},
            {'id': 3, 'nom_article': 'Clavier Mécanique', 'stock': 25, 'prix': 3500, 'min_stock': 8},
        ]
        df_stock = pd.DataFrame(sample_data)
        df_stock.to_excel(STOCK_FILE, index=False)
    
    # Initialize historique.xlsx
    if not os.path.exists(HISTORIQUE_FILE):
        df_hist = pd.DataFrame(columns=['date', 'nom_article', 'quantite', 'prix_total'])
        df_hist.to_excel(HISTORIQUE_FILE, index=False)

# Helper function to read stock
def read_stock():
    """Read stock data from Excel file"""
    try:
        df = pd.read_excel(STOCK_FILE)
        return df
    except Exception as e:
        print(f"Error reading stock: {e}")
        return pd.DataFrame(columns=['id', 'nom_article', 'stock', 'prix', 'min_stock'])

# Helper function to write stock
def write_stock(df):
    """Write stock data to Excel file"""
    try:
        df.to_excel(STOCK_FILE, index=False)
        return True
    except PermissionError as e:
        print(f"Error writing stock - File is locked: {e}")
        print("⚠️ ATTENTION: Fermez le fichier Excel 'stock.xlsx' s'il est ouvert!")
        return False
    except Exception as e:
        print(f"Error writing stock: {e}")
        return False

# Helper function to add to history
def add_to_history(nom_article, quantite, prix_total):
    """Add a sale to the history file"""
    try:
        # Read existing history
        if os.path.exists(HISTORIQUE_FILE):
            df_hist = pd.read_excel(HISTORIQUE_FILE)
        else:
            df_hist = pd.DataFrame(columns=['date', 'nom_article', 'quantite', 'prix_total'])
        
        # Add new sale
        new_sale = pd.DataFrame([{
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'nom_article': nom_article,
            'quantite': quantite,
            'prix_total': prix_total
        }])
        
        df_hist = pd.concat([df_hist, new_sale], ignore_index=True)
        df_hist.to_excel(HISTORIQUE_FILE, index=False)
        return True
    except Exception as e:
        print(f"Error adding to history: {e}")
        return False

# Routes
@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/stock', methods=['GET'])
def get_stock():
    """Get all stock items"""
    df = read_stock()
    stock_list = df.to_dict('records')
    return jsonify(stock_list)

@app.route('/api/stock', methods=['POST'])
def add_stock():
    """Add a new stock item"""
    try:
        data = request.json
        df = read_stock()
        
        # Generate new ID
        new_id = int(df['id'].max() + 1) if len(df) > 0 else 1
        
        # Create new item
        new_item = pd.DataFrame([{
            'id': new_id,
            'nom_article': data['nom_article'],
            'stock': int(data['stock']),
            'prix': float(data['prix']),
            'min_stock': int(data['min_stock'])
        }])
        
        # Add to dataframe
        df = pd.concat([df, new_item], ignore_index=True)
        
        if write_stock(df):
            return jsonify({'success': True, 'message': 'Article ajouté avec succès'})
        else:
            return jsonify({'success': False, 'message': 'Erreur lors de l\'ajout'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/stock/<int:item_id>', methods=['PUT'])
def update_stock(item_id):
    """Update an existing stock item"""
    try:
        data = request.json
        df = read_stock()
        
        # Find the item
        idx = df[df['id'] == item_id].index
        if len(idx) == 0:
            return jsonify({'success': False, 'message': 'Article non trouvé'}), 404
        
        # Update the item
        df.loc[idx, 'nom_article'] = data['nom_article']
        df.loc[idx, 'stock'] = int(data['stock'])
        df.loc[idx, 'prix'] = float(data['prix'])
        df.loc[idx, 'min_stock'] = int(data['min_stock'])
        
        if write_stock(df):
            return jsonify({'success': True, 'message': 'Article modifié avec succès'})
        else:
            return jsonify({'success': False, 'message': 'Erreur lors de la modification'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/stock/<int:item_id>', methods=['DELETE'])
def delete_stock(item_id):
    """Delete a stock item"""
    try:
        df = read_stock()
        
        # Check if item exists
        initial_count = len(df)
        
        # Find and remove the item
        df = df[df['id'] != item_id]
        
        # Verify item was found
        if len(df) == initial_count:
            return jsonify({'success': False, 'message': 'Article non trouvé'}), 404
        
        if write_stock(df):
            return jsonify({'success': True, 'message': 'Article supprimé avec succès'})
        else:
            return jsonify({'success': False, 'message': 'Impossible de sauvegarder. Fermez le fichier Excel s\'il est ouvert!'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/vente', methods=['POST'])
def process_sale():
    """Process a sale transaction"""
    try:
        data = request.json
        article_id = int(data['article_id'])
        quantite = int(data['quantite'])
        
        df = read_stock()
        
        # Find the article
        idx = df[df['id'] == article_id].index
        if len(idx) == 0:
            return jsonify({'success': False, 'message': 'Article non trouvé'}), 404
        
        # Get current stock and price
        current_stock = int(df.loc[idx[0], 'stock'])
        prix = float(df.loc[idx[0], 'prix'])
        nom_article = df.loc[idx[0], 'nom_article']
        
        # Validate stock availability
        if current_stock < quantite:
            return jsonify({
                'success': False, 
                'message': f'Stock insuffisant! Disponible: {current_stock}, Demandé: {quantite}'
            }), 400
        
        # Update stock
        df.loc[idx, 'stock'] = current_stock - quantite
        
        # Calculate total price
        prix_total = prix * quantite
        
        # Save stock and history
        if write_stock(df) and add_to_history(nom_article, quantite, prix_total):
            return jsonify({
                'success': True, 
                'message': f'Vente effectuée avec succès! Total: {prix_total} DA',
                'prix_total': prix_total
            })
        else:
            return jsonify({'success': False, 'message': 'Erreur lors de la vente'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get low stock alerts"""
    df = read_stock()
    # Find items where stock <= min_stock
    alerts = df[df['stock'] <= df['min_stock']]
    alert_list = alerts.to_dict('records')
    return jsonify(alert_list)

@app.route('/api/historique', methods=['GET'])
def get_history():
    """Get sales history with optional filtering"""
    try:
        if os.path.exists(HISTORIQUE_FILE):
            df_hist = pd.read_excel(HISTORIQUE_FILE)
            
            # Convert date column to datetime for filtering
            df_hist['date'] = pd.to_datetime(df_hist['date'])
            
            # Get filter parameters
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            # Apply date filters if provided
            if start_date:
                df_hist = df_hist[df_hist['date'] >= pd.to_datetime(start_date)]
            if end_date:
                # Add 1 day to end_date to include the entire day
                df_hist = df_hist[df_hist['date'] <= pd.to_datetime(end_date) + pd.Timedelta(days=1)]
            
            # Calculate totals before converting to dict
            total_amount = float(df_hist['prix_total'].sum()) if not df_hist.empty else 0
            total_quantity = int(df_hist['quantite'].sum()) if not df_hist.empty else 0
            
            # Sort by date descending
            df_hist = df_hist.sort_values('date', ascending=False)
            
            # Convert dates back to string for JSON serialization
            df_hist['date'] = df_hist['date'].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            history_list = df_hist.to_dict('records')
            
            return jsonify({
                'sales': history_list,
                'total_amount': total_amount,
                'total_quantity': total_quantity
            })
        else:
            return jsonify({
                'sales': [],
                'total_amount': 0,
                'total_quantity': 0
            })
    except Exception as e:
        print(f"Error reading history: {e}")
        return jsonify({
            'sales': [],
            'total_amount': 0,
            'total_quantity': 0
        }), 500

@app.route('/api/sync/status', methods=['GET'])
def get_sync_status():
    """Get current sync status"""
    try:
        status = cloud_sync.get_sync_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({
            'status': 'offline',
            'message': f'Erreur: {str(e)}',
            'last_sync': None
        })

@app.route('/api/sync/now', methods=['POST'])
def trigger_sync():
    """Manually trigger cloud sync"""
    try:
        result = cloud_sync.sync_to_cloud(
            SPREADSHEET_ID,
            SERVICE_ACCOUNT_FILE,
            STOCK_FILE,
            HISTORIQUE_FILE
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

@app.route('/api/sync/restore', methods=['POST'])
def trigger_restore():
    """Manually trigger restore from cloud"""
    try:
        result = cloud_sync.restore_from_cloud(
            SPREADSHEET_ID,
            SERVICE_ACCOUNT_FILE,
            STOCK_FILE,
            HISTORIQUE_FILE
        )
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

if __name__ == '__main__':
    # Initialize Excel files
    init_excel_files()
    
    # Run the Flask app
    print("=" * 50)
    print("🚀 Système de Gestion de Stock")
    print("=" * 50)
    print("📊 Serveur démarré sur: http://127.0.0.1:5000")
    print("💾 Base de données: Excel (stock.xlsx, historique.xlsx)")
    print("=" * 50)
    
    app.run(debug=True, host='127.0.0.1', port=5000)
