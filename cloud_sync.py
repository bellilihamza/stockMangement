"""
Cloud Synchronization Module
Handles syncing local Excel files with Google Sheets
"""

import socket
import gspread
from google.oauth2.service_account import Credentials
import pandas as pd
import os
from datetime import datetime

# Global variable to track sync status
_sync_status = {
    'status': 'offline',  # offline, online, syncing, restored
    'last_sync': None,
    'message': 'Not connected'
}


def check_internet_connection():
    """
    Check if internet connection is available
    Returns True if connected, False otherwise
    """
    try:
        # Try to connect to Google DNS (8.8.8.8) on port 53
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        return True
    except OSError:
        return False


def get_google_sheets_client(service_account_file):
    """
    Authenticate and return Google Sheets client
    
    Args:
        service_account_file: Path to the service account JSON file
        
    Returns:
        gspread.Client object or None if authentication fails
    """
    try:
        # Define the scope for Google Sheets API
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        
        # Authenticate using service account
        credentials = Credentials.from_service_account_file(
            service_account_file,
            scopes=scopes
        )
        
        # Create and return the client
        client = gspread.authorize(credentials)
        return client
        
    except Exception as e:
        print(f"❌ Error authenticating with Google Sheets: {e}")
        return None


def sync_to_cloud(spreadsheet_id, service_account_file, stock_file, historique_file):
    """
    Sync local Excel files to Google Sheets
    
    Args:
        spreadsheet_id: Google Spreadsheet ID
        service_account_file: Path to service account JSON
        stock_file: Path to stock.xlsx
        historique_file: Path to historique.xlsx
        
    Returns:
        dict with 'success', 'message' keys
    """
    global _sync_status
    
    # Update status to syncing
    _sync_status['status'] = 'syncing'
    _sync_status['message'] = 'Synchronisation en cours...'
    
    try:
        # Check internet connection
        if not check_internet_connection():
            _sync_status['status'] = 'offline'
            _sync_status['message'] = 'Pas de connexion Internet'
            return {
                'success': False,
                'message': 'Pas de connexion Internet'
            }
        
        # Check if local files exist
        if not os.path.exists(stock_file):
            _sync_status['status'] = 'online'
            _sync_status['message'] = 'Fichier stock.xlsx introuvable'
            return {
                'success': False,
                'message': 'Fichier stock.xlsx introuvable'
            }
        
        if not os.path.exists(historique_file):
            _sync_status['status'] = 'online'
            _sync_status['message'] = 'Fichier historique.xlsx introuvable'
            return {
                'success': False,
                'message': 'Fichier historique.xlsx introuvable'
            }
        
        # Read local Excel files
        df_stock = pd.read_excel(stock_file)
        df_historique = pd.read_excel(historique_file)
        
        # Safety check: Don't sync empty data
        if len(df_stock) == 0:
            _sync_status['status'] = 'online'
            _sync_status['message'] = 'Stock vide - synchronisation annulée'
            return {
                'success': False,
                'message': 'Stock vide - synchronisation annulée pour sécurité'
            }
        
        # Get Google Sheets client
        client = get_google_sheets_client(service_account_file)
        if not client:
            _sync_status['status'] = 'online'
            _sync_status['message'] = 'Erreur d\'authentification Google'
            return {
                'success': False,
                'message': 'Erreur d\'authentification Google Sheets'
            }
        
        # Open the spreadsheet with better error handling
        try:
            print(f"🔍 Tentative d'ouverture du spreadsheet: {spreadsheet_id}")
            spreadsheet = client.open_by_key(spreadsheet_id)
            print(f"✅ Spreadsheet ouvert: {spreadsheet.title}")
        except gspread.exceptions.APIError as e:
            error_msg = str(e)
            print(f"❌ Erreur API: {error_msg}")
            if "404" in error_msg or "NOT_FOUND" in error_msg:
                detailed_msg = "❌ Spreadsheet introuvable!\n\nVérifiez que:\n1. L'ID est correct dans config.py\n2. Le spreadsheet est partagé avec:\n   med-orange@med-orange.iam.gserviceaccount.com\n3. Les droits 'Éditeur' sont donnés"
                _sync_status['status'] = 'online'
                _sync_status['message'] = detailed_msg
                return {
                    'success': False,
                    'message': detailed_msg
                }
            _sync_status['status'] = 'online'
            _sync_status['message'] = f'Erreur API: {error_msg}'
            return {
                'success': False,
                'message': f'Erreur API Google Sheets: {error_msg}'
            }
        except Exception as e:
            error_msg = f"Erreur lors de l'ouverture du spreadsheet: {str(e)}"
            print(f"❌ {error_msg}")
            _sync_status['status'] = 'online'
            _sync_status['message'] = error_msg
            return {
                'success': False,
                'message': error_msg
            }
        
        # Sync stock data
        try:
            # Try to get existing "stock" worksheet
            stock_worksheet = spreadsheet.worksheet("stock")
        except gspread.exceptions.WorksheetNotFound:
            # Create new worksheet if it doesn't exist
            stock_worksheet = spreadsheet.add_worksheet(title="stock", rows=1000, cols=10)
        
        # Clear existing data and update
        stock_worksheet.clear()
        stock_worksheet.update([df_stock.columns.values.tolist()] + df_stock.values.tolist())
        
        # Sync historique data
        try:
            # Try to get existing "historique" worksheet
            historique_worksheet = spreadsheet.worksheet("historique")
        except gspread.exceptions.WorksheetNotFound:
            # Create new worksheet if it doesn't exist
            historique_worksheet = spreadsheet.add_worksheet(title="historique", rows=1000, cols=10)
        
        # Clear existing data and update
        historique_worksheet.clear()
        historique_worksheet.update([df_historique.columns.values.tolist()] + df_historique.values.tolist())
        
        # Update sync status
        _sync_status['status'] = 'online'
        _sync_status['last_sync'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        _sync_status['message'] = f'Synchronisé à {_sync_status["last_sync"]}'
        
        return {
            'success': True,
            'message': f'✅ Synchronisation réussie! ({len(df_stock)} articles, {len(df_historique)} ventes)'
        }
        
    except Exception as e:
        print(f"❌ Error syncing to cloud: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        _sync_status['status'] = 'online'
        _sync_status['message'] = f'Erreur: {str(e)}'
        return {
            'success': False,
            'message': f'Erreur lors de la synchronisation: {str(e)}'
        }


def restore_from_cloud(spreadsheet_id, service_account_file, stock_file, historique_file):
    """
    Restore local Excel files from Google Sheets
    
    Args:
        spreadsheet_id: Google Spreadsheet ID
        service_account_file: Path to service account JSON
        stock_file: Path to stock.xlsx
        historique_file: Path to historique.xlsx
        
    Returns:
        dict with 'success', 'message' keys
    """
    global _sync_status
    
    try:
        # Check internet connection
        if not check_internet_connection():
            _sync_status['status'] = 'offline'
            _sync_status['message'] = 'Pas de connexion Internet'
            return {
                'success': False,
                'message': 'Pas de connexion Internet pour restaurer'
            }
        
        # Get Google Sheets client
        client = get_google_sheets_client(service_account_file)
        if not client:
            return {
                'success': False,
                'message': 'Erreur d\'authentification Google Sheets'
            }
        
        # Open the spreadsheet
        spreadsheet = client.open_by_key(spreadsheet_id)
        
        # Restore stock data
        try:
            stock_worksheet = spreadsheet.worksheet("stock")
            stock_data = stock_worksheet.get_all_values()
            
            if len(stock_data) > 1:  # Has data beyond header
                df_stock = pd.DataFrame(stock_data[1:], columns=stock_data[0])
                
                # Convert numeric columns
                if 'id' in df_stock.columns:
                    df_stock['id'] = pd.to_numeric(df_stock['id'], errors='coerce')
                if 'stock' in df_stock.columns:
                    df_stock['stock'] = pd.to_numeric(df_stock['stock'], errors='coerce')
                if 'prix' in df_stock.columns:
                    df_stock['prix'] = pd.to_numeric(df_stock['prix'], errors='coerce')
                if 'min_stock' in df_stock.columns:
                    df_stock['min_stock'] = pd.to_numeric(df_stock['min_stock'], errors='coerce')
                
                # Ensure data directory exists
                os.makedirs(os.path.dirname(stock_file), exist_ok=True)
                
                # Save to Excel
                df_stock.to_excel(stock_file, index=False)
            else:
                return {
                    'success': False,
                    'message': 'Aucune donnée de stock dans le cloud'
                }
        except gspread.exceptions.WorksheetNotFound:
            return {
                'success': False,
                'message': 'Feuille "stock" introuvable dans le cloud'
            }
        
        # Restore historique data
        try:
            historique_worksheet = spreadsheet.worksheet("historique")
            historique_data = historique_worksheet.get_all_values()
            
            if len(historique_data) > 1:  # Has data beyond header
                df_historique = pd.DataFrame(historique_data[1:], columns=historique_data[0])
                
                # Convert numeric columns
                if 'quantite' in df_historique.columns:
                    df_historique['quantite'] = pd.to_numeric(df_historique['quantite'], errors='coerce')
                if 'prix_total' in df_historique.columns:
                    df_historique['prix_total'] = pd.to_numeric(df_historique['prix_total'], errors='coerce')
                
                # Save to Excel
                df_historique.to_excel(historique_file, index=False)
            else:
                # Create empty historique if none exists
                df_historique = pd.DataFrame(columns=['date', 'nom_article', 'quantite', 'prix_total'])
                df_historique.to_excel(historique_file, index=False)
        except gspread.exceptions.WorksheetNotFound:
            # Create empty historique if worksheet doesn't exist
            df_historique = pd.DataFrame(columns=['date', 'nom_article', 'quantite', 'prix_total'])
            df_historique.to_excel(historique_file, index=False)
        
        # Update sync status
        _sync_status['status'] = 'restored'
        _sync_status['last_sync'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        _sync_status['message'] = 'Restauré depuis le cloud'
        
        return {
            'success': True,
            'message': '✅ Données restaurées depuis le cloud avec succès!'
        }
        
    except Exception as e:
        print(f"❌ Error restoring from cloud: {e}")
        return {
            'success': False,
            'message': f'Erreur lors de la restauration: {str(e)}'
        }


def get_sync_status():
    """
    Get current sync status
    
    Returns:
        dict with status information
    """
    global _sync_status
    
    # Update online/offline status
    if _sync_status['status'] not in ['syncing', 'restored']:
        if check_internet_connection():
            if _sync_status['status'] == 'offline':
                _sync_status['status'] = 'online'
                _sync_status['message'] = 'Connecté'
        else:
            _sync_status['status'] = 'offline'
            _sync_status['message'] = 'Hors ligne'
    
    return _sync_status.copy()


def update_sync_status(status, message):
    """
    Manually update sync status
    
    Args:
        status: New status (offline, online, syncing, restored)
        message: Status message
    """
    global _sync_status
    _sync_status['status'] = status
    _sync_status['message'] = message
