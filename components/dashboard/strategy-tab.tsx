import { useMemo, useState } from "react"
import { SheetRow } from "@/lib/google-sheets"
import { extractHour, formatCurrency, getShiftColor } from "@/lib/utils"
import { HorizontalBarChart } from "../charts/horizontal-bar-chart"
import { DonutChart } from "../charts/donut-chart"
import { DualAxisChart } from "../charts/dual-axis-chart"
import { VerticalBarChart } from "../charts/vertical-bar-chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StrategyTabProps {
    data: SheetRow[]
}

export function StrategyTab({ data }: StrategyTabProps) {
    const [paretoTopN, setParetoTopN] = useState(15)

    // 1. Pareto Completo (Condomínios - Regra 80/20)
    const paretoCalc = useMemo(() => {
        const grouped: Record<string, number> = {}
        let totalVal = 0
        data.forEach(r => {
            grouped[r.condominio] = (grouped[r.condominio] || 0) + r.valor
            totalVal += r.valor
        })

        if (totalVal === 0) return { chartData: [], insight: null, tableData: [] }

        // Sort desc
        const sorted = Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value)

        // Calcular acumulado
        let accum = 0
        const withAccum = sorted.map(item => {
            accum += item.value
            return {
                ...item,
                accumPct: (accum / totalVal) * 100
            }
        })

        // Identificar corte 80%
        const top80 = withAccum.filter(i => i.accumPct <= 80)
        // Se houver poucos, pegar pelo menos um
        const count80 = top80.length || 1
        const cutoffPct = top80.length > 0 ? top80[top80.length - 1].accumPct : 0

        // Preparar dados do gráfico (Top N + Outros)
        const topChart = withAccum.slice(0, paretoTopN)
        const othersVal = withAccum.slice(paretoTopN).reduce((acc, i) => acc + i.value, 0)

        const chartData = [...topChart]
        if (othersVal > 0) {
            chartData.push({ name: "Outros", value: othersVal, accumPct: 100 })
        }

        return {
            chartData,
            insight: { count80, cutoffPct, totalVal },
            tableData: withAccum.slice(0, count80 + 5) // Mostra top 80% + 5
        }
    }, [data, paretoTopN])

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
    const recoverablePct = leakageTotal > 0 ? (leakageData[0].value / leakageTotal) * 100 : 0

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

    // 4. Análise de Horários (Entrada vs Saída) com Cores de Turno
    const hoursData = useMemo(() => {
        const grouped: Record<number, { valor: number, countIn: number, countOut: number }> = {}
        // Init 0-23
        for (let i = 0; i < 24; i++) grouped[i] = { valor: 0, countIn: 0, countOut: 0 }

        data.forEach(r => {
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
                // Cor por turno
                color: getShiftColor(h)
            }
        })
    }, [data])

    // 5. Logística (Condução)
    const conducaoData = useMemo(() => {
        // Agrupar e tirar média? O original faz média de custo.
        // Aqui o vertical chart espera totais, mas vamos ver.
        // Charts original: create_pie/bar -> value_col.mean()
        // O original faz média em "Logística" (create_pie_chart não faz média, mas log_data no app.py faz mean!)
        // Vamos manter soma ou média? O gráfico original era MEAN.
        // O VerticalBarChart meu espera valor para plotar. Vou calcular média aqui.

        const grouped = {
            "Sim": { sum: 0, count: 0 },
            "Não": { sum: 0, count: 0 }
        }

        data.forEach(r => {
            const k = r.conducao === "Sim" ? "Sim" : "Não"
            grouped[k].sum += r.valor
            grouped[k].count += 1
        })

        return [
            { name: "Condução Própria", value: grouped["Sim"].count > 0 ? grouped["Sim"].sum / grouped["Sim"].count : 0 },
            { name: "Outros", value: grouped["Não"].count > 0 ? grouped["Não"].sum / grouped["Não"].count : 0 }
        ]
    }, [data])


    return (
        <div className="space-y-8">
            {/* Seção 1: Revenue Leakage */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-800">1. Índice de Recuperação (Revenue Leakage)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <DonutChart
                        data={leakageData}
                        nameKey="name"
                        dataKey="value"
                        title="Faturável vs Não Faturável"
                        description="Valores que podem ser repassados ao cliente"
                        total={leakageTotal}
                        colors={["#22c55e", "#ef4444"]}
                    />
                    <div className="flex flex-col justify-center items-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Percentual Recuperável</span>
                        <span className={`text-5xl font-bold mt-2 ${recoverablePct > 80 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {recoverablePct.toFixed(1)}%
                        </span>
                        <p className="text-center text-sm text-muted-foreground mt-4 max-w-xs">
                            Indica quanto do custo total de extras pode ser recuperado cobrando do condomínio.
                        </p>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-200" />

            {/* Seção 2: Pareto (80/20) */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-800">2. Pareto de Clientes (Regra 80/20)</h2>

                <div className="flex items-center space-x-4 mb-6 bg-white p-4 rounded-md border">
                    <span className="text-sm font-medium">Quantidade de Condomínios no Gráfico: {paretoTopN}</span>
                    <Slider
                        defaultValue={[15]}
                        max={50}
                        min={5}
                        step={1}
                        className="w-[200px]"
                        onValueChange={(v) => setParetoTopN(v[0])}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <HorizontalBarChart
                        data={paretoCalc.chartData.slice(0, paretoTopN)}
                        xAxisKey="value"
                        yAxisKey="name"
                        title="Top Condomínios (Custo Total)"
                        description="Maiores ofensores de custo"
                        color="#6366f1"
                    />

                    {paretoCalc.insight && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <InfoIcon className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800 font-semibold">Insight 80/20</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                Os <strong>{paretoCalc.insight.count80}</strong> primeiros condomínios representam <strong>{paretoCalc.insight.cutoffPct.toFixed(1)}%</strong> do custo total acumulado.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Tabela de Destaques (Top 80% do Custo)</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-auto max-h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Condomínio</TableHead>
                                        <TableHead className="text-right">Valor Total</TableHead>
                                        <TableHead className="text-right">% do Total</TableHead>
                                        <TableHead className="text-right">Acumulado %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paretoCalc.tableData.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{i + 1}</TableCell>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.value)}</TableCell>
                                            <TableCell className="text-right">{((row.value / paretoCalc.insight!.totalVal) * 100).toFixed(1)}%</TableCell>
                                            <TableCell className="text-right">{row.accumPct.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="border-t border-slate-200" />

            {/* Seção 3: Motivos */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-800">3. Análise de Motivos</h2>
                <HorizontalBarChart
                    data={motivoData}
                    xAxisKey="value"
                    yAxisKey="name"
                    title="Custo Total por Motivo"
                    description="Principais categorias de ocorrência"
                    color="#8b5cf6"
                />
            </div>

            <div className="border-t border-slate-200" />

            {/* Seção 4: Horários e Condução */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-800">4. Dinâmica de Horários e Logística</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <DualAxisChart
                            data={hoursData}
                            xAxisKey="hour"
                            barKey="valor"
                            lineKey1="count"
                            lineKey2="saida"
                            title="Análise Horária (Turnos)"
                            description="Custo (Barra) | Entradas (Verde) | Saídas (Roxo)"
                            barName="Custo Total"
                            lineName1="Entradas"
                            lineName2="Saídas"
                        />
                        {/* Legenda de Turnos */}
                        <div className="flex justify-center gap-4 text-xs text-slate-500 mt-2">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Madrugada (00h-06h)</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Comercial (06h-18h)</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> Noturno (18h-00h)</div>
                        </div>
                    </div>

                    <VerticalBarChart
                        data={conducaoData}
                        xAxisKey="name"
                        yAxisKey="value"
                        title="Eficiência Logística (Custo Médio)"
                        description="Comparativo: Condução Própria vs Outros"
                        color="#06b6d4"
                    />
                </div>
            </div>
        </div>
    )
}
