"use client"

import { useMemo } from "react"
import { SheetRow } from "@/lib/google-sheets"
import { extractHour, formatCurrency } from "@/lib/utils"
import { HorizontalBarChart } from "../charts/horizontal-bar-chart"
import { DonutChart } from "../charts/donut-chart"
import { DualAxisChart } from "../charts/dual-axis-chart"
import { VerticalBarChart } from "../charts/vertical-bar-chart"

interface StrategyTabProps {
    data: SheetRow[]
}

export function StrategyTab({ data }: StrategyTabProps) {

    // 1. Pareto (Colaboradores vs Valor Acumulado) - Simplificado para Top Colaboradores por enquanto
    // Pareto real precisa da linha de % acumulado. O HorizontalBarChart atual não suporta Composed (Bar+Line).
    // Vou usar o HorizontalBarChart para os maiores gastos ("Curva A").
    const paretoData = useMemo(() => {
        const grouped: Record<string, number> = {}
        let total = 0
        data.forEach(r => {
            grouped[r.colaborador] = (grouped[r.colaborador] || 0) + r.valor
            total += r.valor
        })

        // Sort desc
        const sorted = Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value)

        // Calcular acumulado
        let accum = 0
        return sorted.map(item => {
            accum += item.value
            return {
                ...item,
                accumPct: (accum / total) * 100
            }
        }).slice(0, 15) // Top 15
    }, [data])

    // 2. Revenue Leakage (Cobrar Sim vs Não)
    const leakageData = useMemo(() => {
        const grouped = { "Sim": 0, "Não": 0 }
        data.forEach(r => {
            if (r.cobrar === "Sim") grouped["Sim"] += r.valor
            else grouped["Não"] += r.valor
        })
        return [
            { name: "Faturável", value: grouped["Sim"] },
            { name: "Não Faturável (Leakage)", value: grouped["Não"] }
        ]
    }, [data])

    const leakageTotal = leakageData.reduce((acc, c) => acc + c.value, 0)

    // 3. Análise de Motivos
    const motivoData = useMemo(() => {
        const grouped: Record<string, number> = {}
        data.forEach(r => {
            const k = r.motivo || "N/A"
            grouped[k] = (grouped[k] || 0) + r.valor
        })
        return Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value) // Descrs
            .slice(0, 10)
    }, [data])

    // 4. Análise de Horários (Entrada) - Valor vs Volume (Contagem)
    const hoursData = useMemo(() => {
        const grouped: Record<number, { valor: number, count: number }> = {}
        // Init 0-23
        for (let i = 0; i < 24; i++) grouped[i] = { valor: 0, count: 0 }

        data.forEach(r => {
            const h = extractHour(r.entrada)
            if (h >= 0 && h < 24) {
                grouped[h].valor += r.valor
                grouped[h].count += 1
            }
        })

        return Object.entries(grouped).map(([h, v]) => ({
            hour: `${h}h`,
            valor: v.valor,
            count: v.count
        }))
    }, [data])

    // 5. Logística (Condução)
    const conducaoData = useMemo(() => {
        const grouped = { "Sim": 0, "Não": 0 }
        data.forEach(r => {
            if (r.conducao === "Sim") grouped["Sim"] += r.valor
            else grouped["Não"] += r.valor
        })
        return [
            { name: "Usa Condução", value: grouped["Sim"] },
            { name: "Sem Condução", value: grouped["Não"] }
        ]
    }, [data])


    return (
        <div className="space-y-6">
            {/* Linha 1: Pareto e Leakage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HorizontalBarChart
                    data={paretoData}
                    xAxisKey="value"
                    yAxisKey="name"
                    title="Pareto: Top Gastos por Colaborador"
                    description="Maiores ofensores de custo"
                    color="#f59e0b"
                />
                <DonutChart
                    data={leakageData}
                    nameKey="name"
                    dataKey="value"
                    title="Revenue Leakage (Cobrar?)"
                    description="Proporção de horas faturáveis vs não faturáveis"
                    total={leakageTotal}
                    colors={["#22c55e", "#ef4444"]}
                />
            </div>

            {/* Linha 2: Motivos */}
            <HorizontalBarChart
                data={motivoData}
                xAxisKey="value"
                yAxisKey="name"
                title="Análise de Motivos"
                description="Principais motivos de extras"
                color="#8b5cf6"
            />

            {/* Linha 3: Horários e Condução */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DualAxisChart
                    data={hoursData}
                    xAxisKey="hour"
                    barKey="valor"
                    lineKey1="count"
                    title="Análise Horária (Entrada)"
                    description="Custo Total (Barras) vs Nº de Registros (Linha)"
                    barName="Custo Total"
                    lineName1="Qtd. Registros"
                />
                <VerticalBarChart
                    data={conducaoData}
                    xAxisKey="name"
                    yAxisKey="value"
                    title="Custo com Condução"
                    description="Gastos separados por uso de transporte/táxi"
                    color="#06b6d4"
                />
            </div>
        </div>
    )
}
