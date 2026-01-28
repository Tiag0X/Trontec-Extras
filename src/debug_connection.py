import os
import sys
from dotenv import load_dotenv
import traceback

def debug():
    print("--- INICIANDO DIAGNOSTICO ---")
    
    # 1. Check .env file
    env_path = os.path.join(os.getcwd(), ".env")
    if os.path.exists(env_path):
        print(f"[OK] Arquivo .env encontrado em: {env_path}")
    else:
        print(f"[ERRO] Arquivo .env NAO encontrado em: {env_path}")
    
    # 2. Load env
    load_dotenv()
    
    sa_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    sheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
    worksheet = os.getenv("GOOGLE_SHEETS_WORKSHEET_NAME")
    
    print(f"GOOGLE_SERVICE_ACCOUNT_JSON: {sa_json}")
    print(f"GOOGLE_SHEETS_SPREADSHEET_ID: {sheet_id}")
    print(f"GOOGLE_SHEETS_WORKSHEET_NAME: {worksheet}")
    
    if not sa_json:
        print("[ERRO] JSON path is missing")
        return
        
    if not os.path.isfile(sa_json):
        print(f"[ERRO] Arquivo JSON nao existe no caminho especificado: {sa_json}")
        # Try to help user if they put quotes
        if '"' in sa_json or "'" in sa_json:
             print("[DICA] O caminho parece conter aspas. Remova as aspas do arquivo .env")
        return
    else:
        print(f"[OK] Arquivo JSON existe.")

    # 3. Try connection
    try:
        print("Tentando conectar com gspread...")
        import gspread
        from google.oauth2.service_account import Credentials

        scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        creds = Credentials.from_service_account_file(sa_json, scopes=scopes)
        gc = gspread.authorize(creds)
        print("[OK] Autenticado com sucesso.")
        
        sh = gc.open_by_key(sheet_id)
        print(f"[OK] Planilha aberta: {sh.title}")
        
        ws = sh.worksheet(worksheet)
        print(f"[OK] Aba encontrada: {ws.title}")
        
        rows = ws.get_all_records()
        print(f"[OK] Dados lidos. Linhas: {len(rows)}")
        if len(rows) > 0:
            print("Exemplo de linha:", rows[0])
            
    except Exception:
        print("\n[ERRO FATAL NA CONEXAO]")
        traceback.print_exc()

if __name__ == "__main__":
    debug()
