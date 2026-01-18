import os
import sys

def get_base_path():
    if getattr(sys, 'frozen', False):
        # Running as a bundled executable
        return os.path.dirname(sys.executable)
    # Running as a script
    return os.path.dirname(os.path.abspath(__file__))

BASE_PATH = get_base_path()

# Google Sheets Configuration
# IMPORTANT: Replace with your actual Google Spreadsheet ID
SPREADSHEET_ID = "1ACmdCigZ8uNGOOgqRfg52AzbhsCd2wbTGngxDyqh2EU"

# Service Account Credentials File (EXTERNAL to the exe)
SERVICE_ACCOUNT_FILE = os.path.join(BASE_PATH, "med-orange.json")
