"""
Dashboard de Gestão de Extras - Aplicação Principal

Este módulo contém a aplicação Streamlit principal, orquestrando
a interface do usuário e utilizando os módulos auxiliares.
"""
import pandas as pd
import streamlit as st

from data_loader import load_data
from utils import clean_currency, normalize_boolean, get_default_index
from filters import apply_multiselect_filter, apply_date_filter, get_last_week_range, filter_by_week
from charts import (
    create_evolution_chart_daily,
    create_evolution_chart_monthly,
    create_horizontal_bar_chart,
    create_vertical_bar_chart,
    create_donut_chart,
    create_pie_chart,
    create_pareto_chart,
    create_hourly_dual_axis_chart,
    create_daily_bar_chart,
    SHIFT_LEGEND_HTML,
)


# =============================================================================
# Configuração da Página
# =============================================================================
st.set_page_config(page_title="Gestão de Extras", layout="wide")

# CSS Customizado para Visual Moderno
st.markdown("""
<style>
    /* Fundo da página */
    .stApp {
        background-color: #F8FAFC;
    }
    
    /* Cards de métricas */
    div[data-testid="stMetric"] {
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }
    
    /* Títulos das métricas */
    div[data-testid="stMetricLabel"] > label {
        color: #64748B;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    /* Valores das métricas */
    div[data-testid="stMetricValue"] > div {
        color: #0F172A;
        font-size: 1.5rem;
        font-weight: 600;
    }

    /* Cabeçalhos H1, H2, H3 */
    h1, h2, h3 {
        color: #1E293B;
        font-family: 'Inter', sans-serif;
    }
    
    /* Expander */
    .streamlit-expanderHeader {
        background-color: #FFFFFF;
        border-radius: 4px;
    }
</style>
""", unsafe_allow_html=True)


# =============================================================================
# Carregamento de Dados
# =============================================================================
df, info = load_data()

st.title("Dashboard de Gestão de Extras")
if info:
    st.info(info)

if df.empty:
    st.warning("Nenhum dado carregado.")
    st.stop()


# =============================================================================
# Configuração de Mapeamento de Colunas
# =============================================================================
all_columns = df.columns.tolist()

col_data_idx = get_default_index(all_columns, ["data"])
col_val_idx = get_default_index(all_columns, ["valor (r$)", "valor", "preço"])
col_colab_idx = get_default_index(all_columns, ["colaborador", "funcionário", "nome"])
col_cond_idx = get_default_index(all_columns, ["condomínio", "cliente", "local"])
col_setor_idx = get_default_index(all_columns, ["setor", "área"])
col_motivo_idx = get_default_index(all_columns, ["motivo", "descrição"])
col_cobrar_idx = get_default_index(all_columns, ["cobrar do condomínio", "cobrar"])
col_entrada_idx = get_default_index(all_columns, ["horário entrada", "entrada"])
col_saida_idx = get_default_index(all_columns, ["horário saída", "saída"])
col_conducao_idx = get_default_index(all_columns, ["condução própria", "transporte"])

st.sidebar.header("Configuração das Colunas")
with st.sidebar.expander("Mapeamento de Colunas", expanded=False):
    date_col = st.selectbox("Data", [None] + all_columns, index=col_data_idx + 1 if col_data_idx is not None else 0)
    value_col = st.selectbox("Valor (R$)", [None] + all_columns, index=col_val_idx + 1 if col_val_idx is not None else 0)
    colab_col = st.selectbox("Colaborador", [None] + all_columns, index=col_colab_idx + 1 if col_colab_idx is not None else 0)
    cond_col = st.selectbox("Condomínio", [None] + all_columns, index=col_cond_idx + 1 if col_cond_idx is not None else 0)
    setor_col = st.selectbox("Setor", [None] + all_columns, index=col_setor_idx + 1 if col_setor_idx is not None else 0)
    motivo_col = st.selectbox("Motivo", [None] + all_columns, index=col_motivo_idx + 1 if col_motivo_idx is not None else 0)
    cobrar_col = st.selectbox("Cobrar?", [None] + all_columns, index=col_cobrar_idx + 1 if col_cobrar_idx is not None else 0)
    entrada_col = st.selectbox("Horário Entrada", [None] + all_columns, index=col_entrada_idx + 1 if col_entrada_idx is not None else 0)
    saida_col = st.selectbox("Horário Saída", [None] + all_columns, index=col_saida_idx + 1 if col_saida_idx is not None else 0)
    conducao_col = st.selectbox("Condução Própria", [None] + all_columns, index=col_conducao_idx + 1 if col_conducao_idx is not None else 0)


# =============================================================================
# Pré-processamento de Dados
# =============================================================================
if date_col:
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce", dayfirst=True)

if value_col:
    if not pd.api.types.is_numeric_dtype(df[value_col]):
        df[value_col] = df[value_col].apply(clean_currency)
        df[value_col] = pd.to_numeric(df[value_col], errors="coerce").fillna(0)

if cobrar_col:
    df[cobrar_col] = df[cobrar_col].apply(normalize_boolean)

if conducao_col:
    df[conducao_col] = df[conducao_col].apply(normalize_boolean)


# =============================================================================
# Filtros
# =============================================================================
st.sidebar.divider()
st.sidebar.header("Filtros")

filtered = df.copy()

if date_col:
    filtered = apply_date_filter(filtered, date_col)

filtered = apply_multiselect_filter(filtered, colab_col, "Colaborador")
filtered = apply_multiselect_filter(filtered, cond_col, "Condomínio")
filtered = apply_multiselect_filter(filtered, setor_col, "Setor")
filtered = apply_multiselect_filter(filtered, cobrar_col, "Cobrar do Condomínio?")


# =============================================================================
# Abas do Dashboard
# =============================================================================
tab_overview, tab_strategy, tab_last_week, tab_data = st.tabs([
    "Visão Geral", "Análise Estratégica", "Semana Anterior", "Dados Detalhados"
])


# =============================================================================
# Aba: Visão Geral
# =============================================================================
with tab_overview:
    st.subheader("Indicadores Gerais")
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)

    with kpi1:
        st.metric("Total de Registros", len(filtered))

    with kpi2:
        if value_col:
            total_val = filtered[value_col].sum()
            st.metric("Valor Total", f"R$ {total_val:,.2f}")
        else:
            st.metric("Valor Total", "-")

    with kpi3:
        if value_col and cobrar_col:
            val_charge = filtered[filtered[cobrar_col] == "Sim"][value_col].sum()
            st.metric("Total a Cobrar", f"R$ {val_charge:,.2f}")
        else:
            st.metric("Total a Cobrar", "-")

    with kpi4:
        if colab_col:
            st.metric("Colaboradores", filtered[colab_col].nunique())
        else:
            st.metric("Colaboradores", "-")

    st.divider()

    # Linha 1: Temporal e Condomínio
    c1, c2 = st.columns(2)
    
    with c1:
        if date_col and value_col:
            st.subheader("Evolução Temporal")
            granularity = st.radio("Agrupamento:", ["Diário", "Mensal"], horizontal=True)
            
            if granularity == "Diário":
                show_ma = st.checkbox("Suavizar (Média Móvel 7 dias)", value=True)
                fig_evo = create_evolution_chart_daily(filtered, date_col, value_col, show_ma)
                st.plotly_chart(fig_evo, use_container_width=True)
            else:
                fig_monthly = create_evolution_chart_monthly(filtered, date_col, value_col)
                st.plotly_chart(fig_monthly, use_container_width=True)

    with c2:
        if cond_col and value_col:
            st.subheader("Top 10 Condomínios (Valor)")
            fig = create_vertical_bar_chart(filtered, cond_col, value_col, top_n=10)
            st.plotly_chart(fig, use_container_width=True)

    # Linha 2: Colaborador e Setor
    c3, c4 = st.columns(2)
    
    with c3:
        if colab_col and value_col:
            st.subheader("Top 10 Colaboradores (Valor)")
            fig_colab = create_horizontal_bar_chart(filtered, colab_col, value_col, top_n=10)
            st.plotly_chart(fig_colab, use_container_width=True)

    with c4:
        if setor_col and value_col:
            st.subheader("Valor por Setor")
            fig_setor, setor_raw, total_setor = create_donut_chart(
                filtered, setor_col, value_col, top_n=5, others_label="Outros Setores"
            )
            st.plotly_chart(fig_setor, use_container_width=True)
            
            with st.expander("🔍 Ver detalhes de todos os setores"):
                setor_display = setor_raw.copy()
                setor_display["% Total"] = (setor_display[value_col] / total_setor * 100).map("{:.2f}%".format)
                setor_display[value_col] = setor_display[value_col].map("R$ {:,.2f}".format)
                st.dataframe(setor_display, use_container_width=True, hide_index=True)


# =============================================================================
# Aba: Análise Estratégica
# =============================================================================
with tab_strategy:
    st.header("Análises Estratégicas")
    
    # 1. Revenue Leakage
    if value_col and cobrar_col:
        st.subheader("1. Índice de Recuperação de Custos (Revenue Leakage)")
        st.caption("Comparativo entre custos absorvidos pela empresa vs. repassados ao cliente.")
        
        fig_leak = create_pie_chart(
            filtered, cobrar_col, value_col, 
            title="Cobrável (Sim) vs Não Cobrável (Não)",
            color_map={"Sim": "green", "Não": "red"}
        )
        st.plotly_chart(fig_leak, use_container_width=True)
        
        leakage_data = filtered.groupby(cobrar_col)[value_col].sum().reset_index()
        total = leakage_data[value_col].sum()
        recoverable = leakage_data[leakage_data[cobrar_col] == "Sim"][value_col].sum()
        ratio = (recoverable / total * 100) if total > 0 else 0
        st.metric("Percentual Recuperável", f"{ratio:.1f}%")
    
    st.divider()

    # 2. Pareto Condomínios
    if cond_col and value_col:
        st.subheader("2. Pareto de Clientes (Regra 80/20)")
        st.caption("Identifique os condomínios que representam a maior parte dos custos.")
        
        top_n = st.slider("Quantidade de Condomínios no Gráfico", min_value=5, max_value=50, value=15)
        
        fig_pareto, pareto_info = create_pareto_chart(filtered, cond_col, value_col, top_n=top_n)
        st.plotly_chart(fig_pareto, use_container_width=True)
        
        st.info(f"💡 **Insight 80/20**: Os **{pareto_info['count_80']}** primeiros condomínios representam **{pareto_info['cutoff_percent']:.1f}%** do custo total.")

        # Tabela Detalhada
        st.markdown("### 📋 Tabela de Destaques (Top 80% do Custo)")
        
        table_data = pareto_info["raw_data"].head(pareto_info["count_80"] + 5).copy()
        total_sum = pareto_info["raw_data"][value_col].sum()
        table_data["% do Total"] = (table_data[value_col] / total_sum).apply(lambda x: f"{x:.1%}")
        table_data["Acumulado %"] = (table_data["Acumulado %"] / 100).apply(lambda x: f"{x:.1%}")
        table_data[value_col] = table_data[value_col].apply(lambda x: f"R$ {x:,.2f}")
        
        table_data = table_data.reset_index(drop=True)
        table_data.index += 1
        table_data.index.name = "Rank"
        
        st.dataframe(table_data, use_container_width=True)

    st.divider()

    # 3. Motivo vs Impacto
    if motivo_col and value_col:
        st.subheader("3. Custo por Motivo")
        st.caption("Quais tipos de ocorrência estão gerando mais despesas?")
        
        import plotly.express as px
        motivo_data = filtered.groupby(motivo_col)[value_col].sum().reset_index().sort_values(by=value_col, ascending=False)
        fig_motivo = px.bar(motivo_data, x=motivo_col, y=value_col, color=value_col)
        st.plotly_chart(fig_motivo, use_container_width=True)

    st.divider()

    # 4. Análise de Horários
    if entrada_col and value_col:
        st.subheader("4. Análise de Horários (Entrada vs Saída)")
        st.caption("Barras: Custo Médio (Início) | Linhas: Volume de Entradas e Saídas")
        
        fig_dual = create_hourly_dual_axis_chart(filtered, entrada_col, saida_col, value_col)
        st.plotly_chart(fig_dual, use_container_width=True)
        
        st.markdown(SHIFT_LEGEND_HTML, unsafe_allow_html=True)

    st.divider()
    
    # 5. Logística
    if conducao_col and value_col:
        st.subheader("5. Eficiência Logística")
        st.caption("Comparativo de custo médio: Condução Própria vs Outros.")
        
        import plotly.express as px
        log_data = filtered.groupby(conducao_col)[value_col].mean().reset_index()
        fig_log = px.bar(log_data, x=conducao_col, y=value_col, title="Custo Médio por Tipo de Condução")
        st.plotly_chart(fig_log, use_container_width=True)


# =============================================================================
# Aba: Semana Anterior
# =============================================================================
with tab_last_week:
    st.header("Análise: Semana Passada (Seg-Dom)")
    
    if date_col and value_col:
        week_start, week_end, week_end_filter = get_last_week_range()
        
        st.caption(f"📅 **Período Analisado:** {week_start.strftime('%d/%m')} a {week_end.strftime('%d/%m')}")
        
        df_current = filter_by_week(filtered, date_col, week_start, week_end_filter)
        
        if df_current.empty:
            st.warning("⚠️ Não há dados para a última semana completa. Verifique se a planilha está atualizada.")
        else:
            # Métricas
            val_curr = df_current[value_col].sum()
            count_curr = len(df_current)
            avg_curr = val_curr / count_curr if count_curr > 0 else 0
            
            col_w1, col_w2, col_w3 = st.columns(3)
            with col_w1:
                st.metric(label="Custo Total", value=f"R$ {val_curr:,.2f}")
            with col_w2:
                st.metric(label="Acionamentos", value=count_curr)
            with col_w3:
                st.metric(label="Ticket Médio", value=f"R$ {avg_curr:,.2f}")
            
            st.divider()
            
            # Gráficos
            c_chart1, c_chart2 = st.columns(2)
            
            with c_chart1:
                st.subheader("Custo Diário (Semana Selecionada)")
                fig_daily = create_daily_bar_chart(
                    df_current, date_col, value_col,
                    title=f"Custo por Dia ({week_start.strftime('%d/%m')} - {week_end.strftime('%d/%m')})"
                )
                st.plotly_chart(fig_daily, use_container_width=True)

            with c_chart2:
                if cond_col:
                    st.subheader("Maiores Ofensores (Semana Selecionada)")
                    fig_off = create_vertical_bar_chart(
                        df_current, cond_col, value_col, 
                        title="Top 5 Condomínios (Últimos 7 dias)", 
                        top_n=5
                    )
                    st.plotly_chart(fig_off, use_container_width=True)
            
            st.divider()
            
            # Linha 2: Colaborador e Setor
            c3, c4 = st.columns(2)
            with c3:
                if colab_col:
                    st.subheader("Top Colaboradores (Semana)")
                    fig_colab_wk = create_horizontal_bar_chart(df_current, colab_col, value_col, top_n=10)
                    st.plotly_chart(fig_colab_wk, use_container_width=True)
            
            with c4:
                if setor_col:
                    st.subheader("Valor por Setor (Semana)")
                    fig_setor_wk, _, total_setor_wk = create_donut_chart(
                        df_current, setor_col, value_col, top_n=5, others_label="Outros Setores"
                    )
                    st.plotly_chart(fig_setor_wk, use_container_width=True)

            st.divider()

            # Linha 3: Revenue Leakage e Motivo
            c5, c6 = st.columns(2)
            
            with c5:
                if cobrar_col:
                    st.subheader("Índice de Recuperação (Revenue Leakage)")
                    fig_leak_wk = create_pie_chart(
                        df_current, cobrar_col, value_col,
                        title="Cobrável (Sim) vs Não Cobrável (Não)",
                        color_map={"Sim": "green", "Não": "red"}
                    )
                    st.plotly_chart(fig_leak_wk, use_container_width=True)
                    
                    leakage_data_wk = df_current.groupby(cobrar_col)[value_col].sum().reset_index()
                    total_wk = leakage_data_wk[value_col].sum()
                    recoverable_wk = leakage_data_wk[leakage_data_wk[cobrar_col] == "Sim"][value_col].sum()
                    ratio_wk = (recoverable_wk / total_wk * 100) if total_wk > 0 else 0
                    st.metric("Percentual Recuperável (Semana)", f"{ratio_wk:.1f}%")

            with c6:
                if motivo_col:
                    st.subheader("Custo por Motivo (Semana)")
                    import plotly.express as px
                    motivo_data_wk = df_current.groupby(motivo_col)[value_col].sum().reset_index().sort_values(by=value_col, ascending=False).head(10)
                    fig_motivo_wk = px.bar(
                        motivo_data_wk, 
                        x=motivo_col, 
                        y=value_col, 
                        color=value_col,
                        template="plotly_white"
                    )
                    st.plotly_chart(fig_motivo_wk, use_container_width=True)

            st.divider()

            # Linha 4: Análise de Horários
            if entrada_col:
                st.subheader("Análise de Horários (Entrada vs Saída)")
                st.caption("Barras: Custo Médio (Início) | Linhas: Volume de Entradas e Saídas")
                
                fig_dual_wk = create_hourly_dual_axis_chart(df_current, entrada_col, saida_col, value_col)
                st.plotly_chart(fig_dual_wk, use_container_width=True)
                
                st.markdown(SHIFT_LEGEND_HTML, unsafe_allow_html=True)

    else:
        st.info("Configure as colunas de Data e Valor para ver a análise.")


# =============================================================================
# Aba: Dados Detalhados
# =============================================================================
with tab_data:
    st.subheader("Dados Detalhados")
    st.dataframe(filtered, use_container_width=True)
