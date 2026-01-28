"""
Funções utilitárias para o Dashboard de Gestão de Extras.
"""
import pandas as pd


def clean_currency(x):
    """
    Converte string de moeda brasileira (R$ 1.234,56) para float.
    
    Args:
        x: Valor a ser convertido (string ou numérico)
    
    Returns:
        float: Valor numérico
    """
    if isinstance(x, str):
        x = x.replace("R$", "").strip().replace(".", "").replace(",", ".")
        try:
            return float(x)
        except ValueError:
            return 0.0
    return x


def normalize_boolean(val):
    """
    Normaliza valores booleanos para 'Sim' ou 'Não'.
    
    Args:
        val: Valor a ser normalizado
    
    Returns:
        str: 'Sim' ou 'Não'
    """
    if pd.isna(val):
        return "Não"
    val_str = str(val).lower().strip()
    return "Sim" if val_str in ["sim", "s", "yes", "true", "1"] else "Não"


def extract_hour(val):
    """
    Extrai a hora de uma string de horário.
    
    Suporta formatos:
    - HH:MM
    - HH:MM:SS
    - YYYY-MM-DD HH:MM:SS
    
    Args:
        val: String contendo horário
    
    Returns:
        int: Hora (0-23) ou -1 se inválido
    """
    val = str(val).strip()
    if not val or val.lower() in ["nan", "none", "", "nat"]:
        return -1
    try:
        # Caso 1: Formato com data e hora (ex: 2025-01-01 18:00:00)
        if " " in val:
            time_part = val.split(" ")[-1]  # Pega a parte da hora
        else:
            time_part = val
        
        # Caso 2: Formato HH:MM
        if ":" in time_part:
            return int(time_part.split(":")[0])
    except (ValueError, IndexError):
        pass
    return -1


def get_default_index(options, keywords):
    """
    Busca o índice de uma opção que contenha uma das keywords.
    
    Args:
        options: Lista de opções
        keywords: Lista de palavras-chave a buscar
    
    Returns:
        int or None: Índice encontrado ou None
    """
    for i, opt in enumerate(options):
        opt_lower = str(opt).lower()
        for kw in keywords:
            if kw in opt_lower:
                return i
    return None


def get_shift_color(hour):
    """
    Retorna a cor correspondente ao turno de trabalho.
    
    Args:
        hour: Hora (0-23)
    
    Returns:
        str: Código hexadecimal da cor
    """
    if 0 <= hour < 6:
        return "#EF4444"  # Madrugada (Vermelho)
    if 6 <= hour < 18:
        return "#3B82F6"  # Comercial (Azul)
    return "#F97316"  # Noturno (Laranja)


def format_currency(value):
    """
    Formata valor numérico como moeda brasileira.
    
    Args:
        value: Valor numérico
    
    Returns:
        str: Valor formatado (ex: R$ 1.234,56)
    """
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def format_currency_short(value):
    """
    Formata valor numérico como moeda brasileira (versão curta).
    
    Args:
        value: Valor numérico
    
    Returns:
        str: Valor formatado (ex: R$ 1.234)
    """
    return f"R$ {value:,.0f}"
