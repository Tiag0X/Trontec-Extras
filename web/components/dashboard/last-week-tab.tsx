"use client"

import { useMemo } from "react"
import { SheetRow } from "@/lib/google-sheets"
import { parseSheetDate, formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { subWeeks, startOfWeek, endOfWeek, isWithinInterval, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"
import { EvolutionChart } from "../charts/evolution-chart"
import { HorizontalBarChart } from "../charts/horizontal-bar-chart"

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
            const iso = format(d, "yyyy-mm-dd")
            grouped[iso] = (grouped[iso] || 0) + r.valor
        })

        // Preencher dias vazios da semana?
        // MVP: mostrar só o que tem
        return Object.entries(grouped)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => ({
                date: format(new Date(k), "EEEE", { locale: ptBR }),
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
            .slice(0, 5)
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EvolutionChart
                    data={dailyChart}
                    xAxisKey="date"
                    yAxisKey="valor"
                    title="Evolução Diária (Semana)"
                    description="Gastos dia a dia na semana selecionada"
                    type="bar" // Barra vertical para dias
                />
                <HorizontalBarChart
                    data={topOfensores}
                    xAxisKey="value"
                    yAxisKey="name"
                    title="Top 5 Ofensores"
                    description="Quem mais gastou na semana"
                    color="#f43f5e"
                />
            </div>
        </div>
    )
}
