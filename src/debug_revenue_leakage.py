import pandas as pd
from data_loader import load_data

def debug_leakage():
    print("--- DIAGNOSTICO REVENUE LEAKAGE ---")
    
    # 1. Carregar Dados
    try:
        df, info = load_data()
        print(f"[OK] Dados carregados. Total linhas: {len(df)}")
    except Exception as e:
        print(f"[ERRO] Falha ao carregar dados: {e}")
        return

    if df.empty:
        print("[AVISO] DataFrame vazio.")
        return

    # 2. Identificar coluna de Cobrança
    # Tenta achar automaticamente como no app.py
    cols = df.columns.tolist()
    cobrar_col = None
    
    keywords = ["cobrar do condomínio", "cobrar", "reembolso"]
    
    for c in cols:
        if any(k in str(c).lower() for k in keywords):
            cobrar_col = c
            break
            
    if not cobrar_col:
        print("[ERRO] Não foi possível identificar automaticamente a coluna de 'Cobrar'.")
        print("Colunas disponíveis:", cols)
        return
        
    print(f"[OK] Coluna identificada: '{cobrar_col}'")
    
    # 3. Analisar Valores Únicos Brutos
    unique_vals = df[cobrar_col].unique()
    print("\n--- VALORES ÚNICOS ENCONTRADOS (BRUTO) ---")
    for val in unique_vals:
        print(f"'{val}' (Tipo: {type(val)})")
        
    # 4. Simular Normalização
    print("\n--- TESTE DE NORMALIZAÇÃO ---")
    def normalize_boolean(val):
        if pd.isna(val): return "Não"
        val_str = str(val).lower().strip()
        return "Sim" if val_str in ["sim", "s", "yes", "true", "1"] else "Não"
        
    counts = df[cobrar_col].apply(normalize_boolean).value_counts()
    print(counts)
    
    # 5. Analisar "Não" (Potenciais Falsos Negativos)
    nao_cobravel = df[df[cobrar_col].apply(normalize_boolean) == "Não"]
    if not nao_cobravel.empty:
        print(f"\n[INFO] {len(nao_cobravel)} registros classificados como 'Não'.")
        print("Amostra de valores originais classificados como 'Não':")
        print(nao_cobravel[cobrar_col].unique())

if __name__ == "__main__":
    debug_leakage()
