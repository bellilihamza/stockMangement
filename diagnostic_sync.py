
import gspread
from google.oauth2.service_account import Credentials
import config
import os

import traceback

def test_connection():
    print("--- Diagnostic Connection Google Sheets ---")
    print(f"Spreadsheet ID: {config.SPREADSHEET_ID}")
    print(f"Service Account File: {config.SERVICE_ACCOUNT_FILE}")
    
    if not os.path.exists(config.SERVICE_ACCOUNT_FILE):
        print(f"[ERROR] Le fichier {config.SERVICE_ACCOUNT_FILE} n'existe pas!")
        return

    try:
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        credentials = Credentials.from_service_account_file(
            config.SERVICE_ACCOUNT_FILE,
            scopes=scopes
        )
        client = gspread.authorize(credentials)
        print("[SUCCESS] Authentification reussie.")
        
        print("[INFO] Tentative d'ouverture du spreadsheet...")
        spreadsheet = client.open_by_key(config.SPREADSHEET_ID)
        print(f"[SUCCESS] Spreadsheet trouve: {spreadsheet.title}")
        
        print("[INFO] Verification des feuilles...")
        worksheets = spreadsheet.worksheets()
        print(f"[SUCCESS] Feuilles presentes: {[ws.title for ws in worksheets]}")
        
    except gspread.exceptions.APIError as e:
        print(f"[ERROR] Erreur API Google: {e}")
    except gspread.exceptions.SpreadsheetNotFound:
        print("[ERROR] Spreadsheet introuvable (ID incorrect).")
    except Exception as e:
        print(f"[ERROR] Erreur inattendue ({type(e).__name__}): {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_connection()
