"""
Funções de filtros para o Dashboard de Gestão de Extras.
"""
import pandas as pd
import streamlit as st


def apply_multiselect_filter(df, column, label):
    """
    Aplica filtro multiselect na sidebar do Streamlit.
    
    Args:
        df: DataFrame a filtrar
        column: Nome da coluna para filtrar
        label: Rótulo do filtro na UI
    
    Returns:
        pd.DataFrame: DataFrame filtrado
    """
    if column:
        options = sorted(df[column].astype(str).unique().tolist())
        selected = st.sidebar.multiselect(label, options)
        if selected:
            return df[df[column].astype(str).isin(selected)]
    return df


def apply_date_filter(df, date_col):
    """
    Aplica filtro de período na sidebar do Streamlit.
    
    Args:
        df: DataFrame a filtrar
        date_col: Nome da coluna de data
    
    Returns:
        pd.DataFrame: DataFrame filtrado
    """
    if not date_col:
        return df
    
    min_date = df[date_col].min()
    max_date = df[date_col].max()
    
    if pd.isnull(min_date) or pd.isnull(max_date):
        return df
    
    date_range = st.sidebar.date_input("Período", [min_date, max_date])
    
    if isinstance(date_range, (list, tuple)) and len(date_range) == 2:
        start_date, end_date = date_range
        return df[
            (df[date_col] >= pd.to_datetime(start_date)) & 
            (df[date_col] <= pd.to_datetime(end_date))
        ]
    
    return df


def get_last_week_range():
    """
    Calcula o período da última semana completa (Segunda a Domingo).
    
    Returns:
        tuple: (start_date, end_date) da última semana
    """
    today = pd.Timestamp.now().normalize()
    weekday_idx = today.dayofweek + 1
    
    # Último Domingo (Fim da Semana Passada)
    week_end = today - pd.Timedelta(days=weekday_idx)
    # Segunda-feira anterior (Início da Semana Passada)
    week_start = week_end - pd.Timedelta(days=6)
    # Ajuste para incluir o dia todo
    week_end_filter = week_end + pd.Timedelta(days=1) - pd.Timedelta(microseconds=1)
    
    return week_start, week_end, week_end_filter


def filter_by_week(df, date_col, week_start, week_end_filter):
    """
    Filtra DataFrame por período de semana.
    
    Args:
        df: DataFrame a filtrar
        date_col: Nome da coluna de data
        week_start: Data inicial
        week_end_filter: Data final (incluindo horário)
    
    Returns:
        pd.DataFrame: DataFrame filtrado
    """
    return df[(df[date_col] >= week_start) & (df[date_col] <= week_end_filter)]
