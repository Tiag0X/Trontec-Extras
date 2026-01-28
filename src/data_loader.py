import os
import json
import pandas as pd
import streamlit as st
from dotenv import load_dotenv


@st.cache_data(ttl=300)  # Cache de 5 minutos
def load_data():
    load_dotenv()
    spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
    worksheet_name = os.getenv("GOOGLE_SHEETS_WORKSHEET_NAME")
    
    # Opção 1: JSON completo na variável de ambiente (Ideal para Vercel/Cloud)
    sa_json_content = os.getenv("GOOGLE_CREDENTIALS_JSON")
    
    # Opção 2: Caminho do arquivo (Ideal para Local)
    sa_json_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")

    if spreadsheet_id and worksheet_name:
        try:
            import gspread
            from google.oauth2.service_account import Credentials
            
            scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
            creds = None
            
            # Tenta carregar do conteúdo JSON (Variável de Ambiente)
            if sa_json_content:
                try:
                    info = json.loads(sa_json_content)
                    creds = Credentials.from_service_account_info(info, scopes=scopes)
                    print("INFO: Usando credenciais via variável de ambiente (JSON Content).")
                except json.JSONDecodeError as e:
                    print(f"ERRO: Falha ao decodificar JSON da variável de ambiente: {e}")

            # Se não conseguiu, tenta carregar do arquivo
            if not creds and sa_json_path and os.path.isfile(sa_json_path):
                creds = Credentials.from_service_account_file(sa_json_path, scopes=scopes)
                print("INFO: Usando credenciais via arquivo local.")
            
            if creds:
                gc = gspread.authorize(creds)
                sh = gc.open_by_key(spreadsheet_id)
                ws = sh.worksheet(worksheet_name)
                
                # Use get_all_values instead of get_all_records to handle duplicate/empty headers manually
                data = ws.get_all_values()
                
                if not data:
                    return pd.DataFrame(), "A planilha está vazia."
                    
                headers = data[0]
                rows = data[1:]
                
                # Handle duplicate or empty headers
                cleaned_headers = []
                seen = {}
                for i, h in enumerate(headers):
                    h = str(h).strip()
                    if not h:
                        h = f"Unnamed_{i}"
                    if h in seen:
                        seen[h] += 1
                        h = f"{h}_{seen[h]}"
                    else:
                        seen[h] = 0
                    cleaned_headers.append(h)
                
                df = pd.DataFrame(rows, columns=cleaned_headers)
                
                print("SUCESSO: Conectado ao Google Sheets e dados carregados.")
                return df, None
            else:
                 print("AVISO: Nenhuma credencial válida encontrada (Arquivo ou Variável de Ambiente).")

        except Exception as e:
            print(f"ERRO: Falha ao conectar ao Google Sheets: {e}")
            fallback_reason = str(e)
            sample_path = os.path.join(os.path.dirname(__file__), "..", "data", "sample.csv")
            df = pd.read_csv(sample_path)
            return df, "Falha ao ler do Google Sheets: " + fallback_reason

    sample_path = os.path.join(os.path.dirname(__file__), "..", "data", "sample.csv")
    df = pd.read_csv(sample_path)
    return df, "Usando dados de exemplo locais"
