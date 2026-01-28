"use client"

import { useMemo } from "react"
import { SheetRow } from "@/lib/google-sheets"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EvolutionChart } from "../charts/evolution-chart"
import { HorizontalBarChart } from "../charts/horizontal-bar-chart"
import { DonutChart } from "../charts/donut-chart"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface OverviewTabProps {
    data: SheetRow[]
}

export function OverviewTab({ data }: OverviewTabProps) {

    // KPIs
    const totalRegistros = data.length
    const totalValor = useMemo(() => data.reduce((acc, row) => acc + row.valor, 0), [data])
    const totalCobrar = useMemo(() =>
        data.filter(r => r.cobrar === "Sim").reduce((acc, row) => acc + row.valor, 0),
        [data])
    const totalColaboradores = useMemo(() => new Set(data.map(r => r.colaborador).filter(Boolean)).size, [data])

    // Chart Data: Evolução Diária
    const dailyData = useMemo(() => {
        const grouped: Record<string, number> = {}
        data.forEach(row => {
            if (!row.data) return
            // row.data vem formato dd/mm/yyyy do sheets ou yyyy-mm-dd? 
            // O google-sheets.ts retorna string raw. Normalmente sheets é dd/mm/yyyy.
            // Vamos tentar normalizar no utils ou assumir um formato. 
            // Para o gráfico precisamos de algo ordenável.
            // Vou assumir que venha como string e usar date strings.
            // Se vier BR (dd/mm/yyyy), inverter.
            let dateKey = row.data
            if (row.data.includes('/')) {
                const parts = row.data.split('/')
                if (parts.length === 3) dateKey = `${parts[2]}-${parts[1]}-${parts[0]}` // yyyy-mm-dd
            }
            grouped[dateKey] = (grouped[dateKey] || 0) + row.valor
        })

        return Object.entries(grouped)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, val]) => {
                // Calcular média móvel seria aqui
                return { date, valor: val }
            })
    }, [data])

    // Adicionar Média Móvel (MA7)
    const dailyDataWithMA = useMemo(() => {
        return dailyData.map((item, idx, arr) => {
            const start = Math.max(0, idx - 6)
            const subset = arr.slice(start, idx + 1)
            const sum = subset.reduce((acc, cur) => acc + cur.valor, 0)
            return { ...item, ma7: sum / subset.length }
        })
    }, [dailyData])

    // Chart Data: Top Condomínios e Colaboradores
    const topCondominios = useMemo(() => {
        const grouped: Record<string, number> = {}
        data.forEach(r => {
            const key = r.condominio || "N/A"
            grouped[key] = (grouped[key] || 0) + r.valor
        })
        return Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)
    }, [data])

    const topColaboradores = useMemo(() => {
        const grouped: Record<string, number> = {}
        data.forEach(r => {
            const key = r.colaborador || "N/A"
            grouped[key] = (grouped[key] || 0) + r.valor
        })
        return Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => a.value - b.value) // Ascendente para bar chart horizontal ficar certo (maior no topo se o eixo inverte)
            .slice(-10) // Pega os ultimos 10 (maiores)
    }, [data])

    // Chart Data: Setores
    const setorData = useMemo(() => {
        const grouped: Record<string, number> = {}
        data.forEach(r => {
            const key = r.setor || "N/A"
            if (key === "0" || key === "0.0") return
            if (r.valor <= 0) return
            grouped[key] = (grouped[key] || 0) + r.valor
        })
        return Object.entries(grouped)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value)
    }, [data])

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Registros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRegistros}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalValor)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total a Cobrar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCobrar)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Colaboradores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalColaboradores}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Linha 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EvolutionChart
                    data={dailyDataWithMA}
                    xAxisKey="date"
                    yAxisKey="valor"
                    maKey="ma7"
                    title="Evolução Diária"
                    description="Valor diário e média móvel de 7 dias"
                    type="composed"
                />
                <HorizontalBarChart
                    data={topCondominios}
                    xAxisKey="value"
                    yAxisKey="name"
                    title="Top 10 Condomínios"
                    description="Por valor total"
                    height={350}
                />
            </div>

            {/* Linha 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HorizontalBarChart
                    data={topColaboradores}
                    xAxisKey="value"
                    yAxisKey="name"
                    title="Top 10 Colaboradores"
                    description="Por valor recebido"
                    height={350}
                />
                <div className="space-y-4">
                    <DonutChart
                        data={setorData.slice(0, 5)}
                        nameKey="name"
                        dataKey="value"
                        title="Valor por Setor"
                        total={totalValor}
                    />
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>🔍 Ver detalhes de todos os setores</AccordionTrigger>
                            <AccordionContent>
                                <div className="max-h-[300px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Setor</TableHead>
                                                <TableHead className="text-right">Valor</TableHead>
                                                <TableHead className="text-right">% Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {setorData.map((s, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{s.name}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(s.value)}</TableCell>
                                                    <TableCell className="text-right">{((s.value / totalValor) * 100).toFixed(2)}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    )
}

