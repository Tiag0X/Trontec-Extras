"""
Funções de criação de gráficos Plotly para o Dashboard de Gestão de Extras.
"""
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from utils import get_shift_color


def create_evolution_chart_daily(df, date_col, value_col, show_ma=True):
    """
    Cria gráfico de evolução diária com média móvel opcional.
    
    Args:
        df: DataFrame com dados
        date_col: Nome da coluna de data
        value_col: Nome da coluna de valor
        show_ma: Se True, exibe média móvel de 7 dias
    
    Returns:
        plotly.graph_objects.Figure
    """
    daily = df.groupby(date_col)[value_col].sum().reset_index()
    
    fig = go.Figure()
    
    # Linha original
    line_color = 'rgba(31, 119, 180, 0.3)' if show_ma else '#1f77b4'
    
    fig.add_trace(go.Scatter(
        x=daily[date_col], 
        y=daily[value_col],
        mode='lines',
        name="Valor Diário",
        line=dict(color=line_color)
    ))
    
    if show_ma:
        daily['MA7'] = daily[value_col].rolling(window=7).mean()
        fig.add_trace(go.Scatter(
            x=daily[date_col], 
            y=daily['MA7'],
            mode='lines',
            name="Média Móvel (7d)",
            line=dict(color='#ff7f0e', width=3)
        ))
    
    fig.update_layout(
        title="Evolução Diária de Custos", 
        xaxis_title="Data", 
        yaxis_title="Valor (R$)",
        template="plotly_white",
        hovermode="x unified"
    )
    
    return fig


def create_evolution_chart_monthly(df, date_col, value_col):
    """
    Cria gráfico de evolução mensal em barras.
    
    Args:
        df: DataFrame com dados
        date_col: Nome da coluna de data
        value_col: Nome da coluna de valor
    
    Returns:
        plotly.express.Figure
    """
    monthly = df.groupby(df[date_col].dt.to_period("M"))[value_col].sum().reset_index()
    monthly[date_col] = monthly[date_col].dt.to_timestamp()
    
    fig = px.bar(
        monthly, 
        x=date_col, 
        y=value_col, 
        title="Custo Total por Mês",
        text_auto='.2s',
        template="plotly_white"
    )
    fig.update_xaxes(dtick="M1", tickformat="%b/%Y")
    
    return fig


def create_horizontal_bar_chart(df, category_col, value_col, title="", top_n=10):
    """
    Cria gráfico de barras horizontais (Top N).
    
    Args:
        df: DataFrame com dados
        category_col: Nome da coluna de categoria
        value_col: Nome da coluna de valor
        title: Título do gráfico
        top_n: Número de itens a exibir
    
    Returns:
        plotly.graph_objects.Figure
    """
    data = df.groupby(category_col)[value_col].sum().reset_index()
    data = data.sort_values(by=value_col, ascending=True).tail(top_n)
    
    fig = go.Figure()
    fig.add_trace(go.Bar(
        y=data[category_col],
        x=data[value_col],
        orientation='h',
        text=data[value_col].apply(lambda x: f"R$ {x:,.0f}"),
        textposition='auto',
        marker=dict(color='#1f77b4'),
    ))
    
    fig.update_layout(
        title=title,
        yaxis_title=None,
        xaxis_title="Valor (R$)",
        bargap=0.2,
        height=400,
        template="plotly_white"
    )
    
    return fig


def create_vertical_bar_chart(df, category_col, value_col, title="", top_n=10):
    """
    Cria gráfico de barras verticais (Top N).
    
    Args:
        df: DataFrame com dados
        category_col: Nome da coluna de categoria
        value_col: Nome da coluna de valor
        title: Título do gráfico
        top_n: Número de itens a exibir
    
    Returns:
        plotly.express.Figure
    """
    data = df.groupby(category_col)[value_col].sum().reset_index()
    data = data.sort_values(by=value_col, ascending=False).head(top_n)
    
    fig = px.bar(data, x=category_col, y=value_col, template="plotly_white")
    fig.update_layout(title=title)
    
    return fig


def create_donut_chart(df, names_col, value_col, title="", top_n=5, others_label="Outros"):
    """
    Cria gráfico de rosca (donut) com agrupamento de 'Outros'.
    
    Args:
        df: DataFrame com dados
        names_col: Nome da coluna de categorias
        value_col: Nome da coluna de valores
        title: Título do gráfico
        top_n: Número de categorias principais
        others_label: Rótulo para categoria 'Outros'
    
    Returns:
        plotly.express.Figure
    """
    # Limpeza e agregação
    data = df.groupby(names_col)[value_col].sum().reset_index()
    data = data[~data[names_col].astype(str).isin(["0", "0.0", "nan", "None", ""])]
    data = data[data[value_col] > 0]
    data = data.sort_values(by=value_col, ascending=False)
    
    total = data[value_col].sum()
    
    # Top N + Outros
    if len(data) > top_n:
        top_data = data.head(top_n).copy()
        others_val = data.iloc[top_n:][value_col].sum()
        others_row = pd.DataFrame({names_col: [others_label], value_col: [others_val]})
        chart_data = pd.concat([top_data, others_row])
    else:
        chart_data = data.copy()
    
    fig = px.pie(
        chart_data, 
        names=names_col, 
        values=value_col, 
        hole=0.4,
        title=f"{title} (Total: R$ {total:,.0f})",
        color_discrete_sequence=px.colors.sequential.Blues_r
    )
    
    fig.update_traces(
        textposition='inside', 
        textinfo='percent+label',
        hovertemplate='%{label}<br>R$ %{value:,.2f}<br>%{percent}'
    )
    
    return fig, data, total


def create_pie_chart(df, names_col, value_col, title="", color_map=None):
    """
    Cria gráfico de pizza simples.
    
    Args:
        df: DataFrame com dados
        names_col: Nome da coluna de categorias
        value_col: Nome da coluna de valores
        title: Título do gráfico
        color_map: Dicionário de cores por categoria
    
    Returns:
        plotly.express.Figure
    """
    data = df.groupby(names_col)[value_col].sum().reset_index()
    
    fig = px.pie(
        data, 
        names=names_col, 
        values=value_col, 
        color=names_col if color_map else None,
        color_discrete_map=color_map,
        title=title,
        template="plotly_white"
    )
    
    return fig


def create_pareto_chart(df, category_col, value_col, top_n=15):
    """
    Cria gráfico de Pareto (barras horizontais com insight 80/20).
    
    Args:
        df: DataFrame com dados
        category_col: Nome da coluna de categoria
        value_col: Nome da coluna de valor
        top_n: Número de itens no gráfico
    
    Returns:
        tuple: (Figure, pareto_info dict)
    """
    # Preparação dos dados
    pareto_raw = df.groupby(category_col)[value_col].sum().reset_index()
    pareto_raw = pareto_raw.sort_values(by=value_col, ascending=False)
    total_sum = pareto_raw[value_col].sum()
    
    # Separa Top N e Outros
    if len(pareto_raw) > top_n:
        top_data = pareto_raw.head(top_n).copy()
        others_val = pareto_raw.iloc[top_n:][value_col].sum()
        others_row = pd.DataFrame({category_col: ["Demais"], value_col: [others_val]})
        chart_data = pd.concat([top_data, others_row])
    else:
        chart_data = pareto_raw.copy()
    
    # Calcula acumulado para análise 80/20
    pareto_raw["Acumulado %"] = (pareto_raw[value_col].cumsum() / total_sum) * 100
    pareto_80_idx = pareto_raw[pareto_raw["Acumulado %"] <= 80].index.tolist()
    if len(pareto_80_idx) < len(pareto_raw):
        next_idx = len(pareto_80_idx)
        pareto_80_idx.append(pareto_raw.index[next_idx])
    
    cutoff_value = pareto_raw.loc[pareto_80_idx[-1], "Acumulado %"] if pareto_80_idx else 0
    
    # Gráfico
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=chart_data[value_col],
        y=chart_data[category_col],
        orientation='h',
        name="Custo Total",
        marker=dict(color='#636EFA'),
        text=chart_data[value_col].apply(lambda x: f"R$ {x:,.0f}"),
        textposition='auto'
    ))
    
    fig.update_layout(
        title=f"Top {top_n} + Outros",
        yaxis=dict(autorange="reversed"),
        xaxis_title="Valor Total (R$)",
        height=600,
        template="plotly_white"
    )
    
    pareto_info = {
        "count_80": len(pareto_80_idx),
        "cutoff_percent": cutoff_value,
        "raw_data": pareto_raw
    }
    
    return fig, pareto_info


def create_hourly_dual_axis_chart(df, entrada_col, saida_col, value_col):
    """
    Cria gráfico de eixo duplo para análise de horários.
    
    Args:
        df: DataFrame com dados
        entrada_col: Nome da coluna de horário de entrada
        saida_col: Nome da coluna de horário de saída (pode ser None)
        value_col: Nome da coluna de valor
    
    Returns:
        plotly.graph_objects.Figure
    """
    from utils import extract_hour, get_shift_color
    
    df_time = df.copy()
    df_time["Hora Entrada"] = df_time[entrada_col].apply(extract_hour)
    df_time = df_time[df_time["Hora Entrada"] >= 0]
    
    # Agrupamento por hora
    hourly_stats = df_time.groupby("Hora Entrada").agg(
        Custo_Medio=(value_col, 'mean'),
        Volume_Entrada=(value_col, 'count')
    ).reset_index()
    
    # Preencher horas vazias (0 a 23)
    all_hours = pd.DataFrame({"Hora Entrada": range(24)})
    hourly_stats = pd.merge(all_hours, hourly_stats, on="Hora Entrada", how="left").fillna(0)
    
    # Processar Saídas
    if saida_col:
        df_exit = df.copy()
        df_exit["Hora Saida"] = df_exit[saida_col].apply(extract_hour)
        df_exit = df_exit[df_exit["Hora Saida"] >= 0]
        exit_stats = df_exit.groupby("Hora Saida").size().reset_index(name="Volume_Saida")
        hourly_stats = pd.merge(hourly_stats, exit_stats, left_on="Hora Entrada", right_on="Hora Saida", how="left")
        hourly_stats["Volume_Saida"] = hourly_stats["Volume_Saida"].fillna(0)
    else:
        hourly_stats["Volume_Saida"] = 0
    
    # Cores por turno
    hourly_stats["Cor"] = hourly_stats["Hora Entrada"].apply(get_shift_color)
    hourly_stats["Hora Formatada"] = hourly_stats["Hora Entrada"].apply(lambda x: f"{int(x):02d}:00")
    
    # Gráfico Dual Axis
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    
    # Barras de Custo Médio
    fig.add_trace(
        go.Bar(
            x=hourly_stats["Hora Formatada"],
            y=hourly_stats["Custo_Medio"],
            name="Custo Médio (R$)",
            marker_color=hourly_stats["Cor"],
            opacity=0.6,
            text=hourly_stats["Custo_Medio"].apply(lambda x: f"R$ {x:.0f}" if x > 0 else ""),
            textposition='auto'
        ),
        secondary_y=False
    )
    
    # Linha de Volume Entrada
    fig.add_trace(
        go.Scatter(
            x=hourly_stats["Hora Formatada"],
            y=hourly_stats["Volume_Entrada"],
            name="Entradas",
            mode='lines+markers',
            marker=dict(color='#10B981', size=6),
            line=dict(width=3)
        ),
        secondary_y=True
    )
    
    # Linha de Volume Saída
    if saida_col:
        fig.add_trace(
            go.Scatter(
                x=hourly_stats["Hora Formatada"],
                y=hourly_stats["Volume_Saida"],
                name="Saídas",
                mode='lines+markers',
                marker=dict(color='#8B5CF6', size=6),
                line=dict(width=3, dash='dot')
            ),
            secondary_y=True
        )
    
    fig.update_layout(
        title="Dinâmica de Horários: Custos, Entradas e Saídas",
        template="plotly_white",
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(tickangle=-45)
    )
    
    fig.update_yaxes(title_text="Custo Médio (R$)", secondary_y=False)
    fig.update_yaxes(title_text="Volume (Qtd)", secondary_y=True)
    
    return fig


def create_daily_bar_chart(df, date_col, value_col, title=""):
    """
    Cria gráfico de barras por dia da semana.
    
    Args:
        df: DataFrame com dados
        date_col: Nome da coluna de data
        value_col: Nome da coluna de valor
        title: Título do gráfico
    
    Returns:
        plotly.express.Figure
    """
    daily = df.groupby(date_col)[value_col].sum().reset_index()
    daily["Order"] = daily[date_col].dt.dayofweek
    
    days_map = {0: "Seg", 1: "Ter", 2: "Qua", 3: "Qui", 4: "Sex", 5: "Sáb", 6: "Dom"}
    daily["Dia Nome"] = daily["Order"].map(days_map)
    daily = daily.sort_values("Order")
    
    fig = px.bar(
        daily, 
        x="Dia Nome", 
        y=value_col, 
        text_auto='.2s',
        title=title,
        template="plotly_white"
    )
    fig.update_traces(marker_color='#0EA5E9')
    
    return fig


# HTML para legenda de turnos
SHIFT_LEGEND_HTML = """
<div style="display: flex; gap: 20px; justify-content: center; font-size: 0.8rem; color: #64748B;">
    <div><span style="color: #EF4444;">■</span> Madrugada (00h-06h)</div>
    <div><span style="color: #3B82F6;">■</span> Comercial (06h-18h)</div>
    <div><span style="color: #F97316;">■</span> Noturno (18h-00h)</div>
</div>
"""
