"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    ComposedChart
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface EvolutionChartProps {
    data: any[]
    xAxisKey: string
    yAxisKey: string
    title: string
    description?: string
    type?: "line" | "bar" | "composed"
    color?: string
    maKey?: string // Moving Average key
}

export function EvolutionChart({
    data,
    xAxisKey,
    yAxisKey,
    title,
    description,
    type = "line",
    color = "#3b82f6",
    maKey
}: EvolutionChartProps) {

    const ChartComponent = type === "bar" ? BarChart : (type === "composed" || maKey ? ComposedChart : LineChart)

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey={xAxisKey}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value: any) => `R$ ${value}`}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            formatter={(value: any) => formatCurrency(value)}
                            labelStyle={{ color: "#333" }}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                        />

                        {type === "bar" && (
                            <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} />
                        )}

                        {(type === "line" || type === "composed") && !maKey && (
                            <Line
                                type="monotone"
                                dataKey={yAxisKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={false}
                            />
                        )}

                        {/* Configuração específica para Composed (Diário + MA) */}
                        {(type === "composed" || maKey) && (
                            <>
                                <Bar dataKey={yAxisKey} fill={`${color}50`} radius={[4, 4, 0, 0]} name="Valor" />
                                {maKey && (
                                    <Line
                                        type="monotone"
                                        dataKey={maKey}
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        dot={false}
                                        name="Média Móvel (7d)"
                                    />
                                )}
                            </>
                        )}

                    </ChartComponent>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
