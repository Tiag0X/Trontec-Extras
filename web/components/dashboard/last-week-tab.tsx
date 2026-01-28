"use client"

import { useMemo } from "react"
import { SheetRow } from "@/lib/google-sheets"
import { parseSheetDate, formatCurrency, extractHour, getShiftColor } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { subWeeks, startOfWeek, endOfWeek, isWithinInterval, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"
import { EvolutionChart } from "../charts/evolution-chart"
import { HorizontalBarChart } from "../charts/horizontal-bar-chart"
import { DonutChart } from "../charts/donut-chart"
import { DualAxisChart } from "../charts/dual-axis-chart"
import { VerticalBarChart } from "../charts/vertical-bar-chart"

interface LastWeekTabProps {
    data: SheetRow[]
}

export function LastWeekTab({ data }: LastWeekTabProps) {

    // Calcular Intervalos
    const today = new Date()
    const lastWeekDate = subWeeks(today, 1)
    const twoWeeksAgoDate = subWeeks(today, 2)

    // Semana Passada (Segunda a Domingo) - Assumindo semana corporativa
    const lastWeekStart = startOfWeek(lastWeekDate, { weekStartsOn: 1 })
    const lastWeekEnd = endOfWeek(lastWeekDate, { weekStartsOn: 1 })

    // Semana Retrasada
    const previousWeekStart = startOfWeek(twoWeeksAgoDate, { weekStartsOn: 1 })
    const previousWeekEnd = endOfWeek(twoWeeksAgoDate, { weekStartsOn: 1 })

    // Filtrar Dados
    const { currentData, previousData } = useMemo(() => {
        const current: SheetRow[] = []
        const previous: SheetRow[] = []

        data.forEach(row => {
            const date = parseSheetDate(row.data)
            if (!date) return

            if (isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd })) {
                current.push(row)
            } else if (isWithinInterval(date, { start: previousWeekStart, end: previousWeekEnd })) {
                previous.push(row)
            }
        })
        return { currentData: current, previousData: previous }
    }, [data, lastWeekStart, lastWeekEnd, previousWeekStart, previousWeekEnd])

    // KPIs
    const kpis = useMemo(() => {
        const calcInfo = (dataset: SheetRow[]) => {
            const totalVal = dataset.reduce((a, b) => a + b.valor, 0)
            const count = dataset.length
            const colaboradores = new Set(dataset.map(r => r.colaborador).filter(Boolean)).size
            const media = count > 0 ? totalVal / count : 0
            return { totalVal, count, colaboradores, media }
        }

        const curr = calcInfo(currentData)
        const prev = calcInfo(previousData)

        return { curr, prev }
    }, [currentData, previousData])

    // Helper para Delta
    function renderDelta(curr: number, prev: number, invertColor = false) {
        if (prev === 0) return <span className="text-muted-foreground text-xs">Sem dados anteriores</span>
        const pct = ((curr - prev) / prev) * 100
        const Icon = pct > 0 ? ArrowUpIcon : (pct < 0 ? ArrowDownIcon : MinusIcon)

        // Cores: Para custo, subir é ruim (vermelho), descer é bom (verde).
        // Se invertColor = true (ex: custo), pct > 0 => vermelho.
        // Se invertColor = false (ex: lucro/vendas - não é o caso aqui), pct > 0 => verde.
        // Aqui tratamos CUSTO. Subir = ruim.
        let colorClass = "text-slate-500"
        if (pct > 0) colorClass = invertColor ? "text-red-600" : "text-emerald-600"
        if (pct < 0) colorClass = invertColor ? "text-emerald-600" : "text-red-600"

        return (
            <div className={`flex items-center text-xs font-medium ${colorClass}`}>
                <Icon className="mr-1 h-3 w-3" />
                {Math.abs(pct).toFixed(1)}%
            </div>
        )
    }

    // Gráfico Diário da Semana
    const dailyChart = useMemo(() => {
        const grouped: Record<string, number> = {}
        currentData.forEach(r => {
            const d = parseSheetDate(r.data)
            if (!d) return
            const key = format(d, "EEE", { locale: ptBR }) // Seg, Ter...
            // Mapa simples para ordenar?
            // Ou usar data ISO para ordenar e formatar no chart
            const iso = format(d, "yyyy-MM-dd")
            grouped[iso] = (grouped[iso] || 0) + r.valor
        })

        // Preencher dias vazios da semana?
        // MVP: mostrar só o que tem
        return Object.entries(grouped)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => ({
                date: format(new Date(k + 'T12:00:00'), "EEEE", { locale: ptBR }), // Força meio-dia para evitar problema de fuso
                valor: v
            }))
    }, [currentData])

    // Top Ofensores da Semana
    const topOfensores = useMemo(() => {
        const grouped: Record<string, number> = {}
        currentData.forEach(r => grouped[r.colaborador] = (grouped[r.colaborador] || 0) + r.valor)
        return Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10) // Ajustado para Top 10 para consistencia
    }, [currentData])

    // Revenue Leakage da Semana
    const leakageData = useMemo(() => {
        const grouped = { "Sim": 0, "Não": 0 }
        currentData.forEach(r => {
            if (r.cobrar === "Sim") grouped["Sim"] += r.valor
            else grouped["Não"] += r.valor
        })
        return [
            { name: "Faturável", value: grouped["Sim"] },
            { name: "Não Faturável", value: grouped["Não"] }
        ]
    }, [currentData])

    const leakageTotal = leakageData.reduce((acc, c) => acc + c.value, 0)
    const recoverablePct = leakageTotal > 0 ? (leakageData[0].value / leakageTotal) * 100 : 0

    // Setor da Semana
    const sectoresData = useMemo(() => {
        const grouped: Record<string, number> = {}
        currentData.forEach(r => {
            const k = r.setor || "N/A"
            if (k === "0" || k === "0.0") return
            grouped[k] = (grouped[k] || 0) + r.valor
        })
        return Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
    }, [currentData])

    // Motivos da Semana
    const motivoData = useMemo(() => {
        const grouped: Record<string, number> = {}
        currentData.forEach(r => {
            const k = r.motivo || "N/A"
            grouped[k] = (grouped[k] || 0) + r.valor
        })
        return Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)
    }, [currentData])

    // Horários da Semana
    const hoursData = useMemo(() => {
        const grouped: Record<number, { valor: number, countIn: number, countOut: number }> = {}
        for (let i = 0; i < 24; i++) grouped[i] = { valor: 0, countIn: 0, countOut: 0 }

        currentData.forEach(r => {
            const hIn = extractHour(r.entrada)
            if (hIn >= 0 && hIn < 24) {
                grouped[hIn].valor += r.valor
                grouped[hIn].countIn += 1
            }
            const hOut = extractHour(r.saida)
            if (hOut >= 0 && hOut < 24) {
                grouped[hOut].countOut += 1
            }
        })

        return Object.entries(grouped).map(([hStr, v]) => {
            const h = parseInt(hStr)
            return {
                hour: `${h.toString().padStart(2, '0')}:00`,
                valor: v.valor,
                count: v.countIn,
                saida: v.countOut,
                color: getShiftColor(h)
            }
        })
    }, [currentData])

    const periodoStr = `${format(lastWeekStart, "dd/MM")} a ${format(lastWeekEnd, "dd/MM")}`

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight text-slate-800 border-l-4 border-blue-600 pl-3">
                Análise Semanal: {periodoStr}
            </h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpis.curr.totalVal)}</div>
                        {renderDelta(kpis.curr.totalVal, kpis.prev.totalVal, true)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Registros</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.curr.count}</div>
                        {renderDelta(kpis.curr.count, kpis.prev.count, true)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Colaboradores</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.curr.colaboradores}</div>
                        {renderDelta(kpis.curr.colaboradores, kpis.prev.colaboradores, true)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpis.curr.media)}</div>
                        {renderDelta(kpis.curr.media, kpis.prev.media, true)}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Linha 1: Evolução e Top Colaboradores (ex-Ofensores) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EvolutionChart
                    data={dailyChart}
                    xAxisKey="date"
                    yAxisKey="valor"
                    title="Evolução Diária (Semana)"
                    description="Gastos dia a dia na semana selecionada"
                    type="bar"
                />
                <HorizontalBarChart
                    data={topOfensores}
                    xAxisKey="value"
                    yAxisKey="name"
                    title="Top 10 Colaboradores (Semana)"
                    description="Quem mais gastou na semana"
                    color="#f43f5e"
                />
            </div>

            {/* Linha 2: Setor e Leakage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DonutChart
                    data={sectoresData}
                    nameKey="name"
                    dataKey="value"
                    title="Valor por Setor (Semana)"
                    total={kpis.curr.totalVal}
                    colors={["#0ea5e9", "#22d3ee", "#bae6fd", "#7dd3fc", "#38bdf8"]}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <DonutChart
                        data={leakageData}
                        nameKey="name"
                        dataKey="value"
                        title="Revenue Leakage"
                        total={kpis.curr.totalVal} // leakagetotal pode ser ligeiramente dif se tiver nulos, mas usa total geral pra contexto
                        colors={["#22c55e", "#ef4444"]}
                        height={250}
                    />
                    <div className="flex flex-col justify-center items-center p-4 bg-slate-50 rounded-lg border border-slate-200 h-full">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Recuperável</span>
                        <span className={`text-3xl font-bold mt-2 ${recoverablePct > 80 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {recoverablePct.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Linha 3: Motivos (Vertical para 1:1 com original Python 'px.bar') */}
            <div>
                <VerticalBarChart
                    data={motivoData}
                    xAxisKey="name"
                    yAxisKey="value"
                    title="Custo por Motivo (Semana)"
                    description="Top 10 motivos de extra na semana"
                    color="#8b5cf6"
                    height={350}
                />
            </div>

            {/* Linha 4: Horários Dual Axis */}
            <div>
                <DualAxisChart
                    data={hoursData}
                    xAxisKey="hour"
                    barKey="valor"
                    lineKey1="count"
                    lineKey2="saida"
                    title="Análise Horária da Semana"
                    description="Custo (Barra) | Entradas (Verde) | Saídas (Roxo)"
                    barName="Custo Total"
                    lineName1="Entradas"
                    lineName2="Saídas"
                />
                <div className="flex justify-center gap-4 text-xs text-slate-500 mt-2">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Madrugada (00h-06h)</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Comercial (06h-18h)</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> Noturno (18h-00h)</div>
                </div>
            </div>
        </div>
    )
}
