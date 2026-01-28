"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface HorizontalBarChartProps {
    data: any[]
    xAxisKey: string // Valor numérico
    yAxisKey: string // Categoria
    title: string
    description?: string
    color?: string
    height?: number
    barSize?: number
}

export function HorizontalBarChart({
    data,
    xAxisKey,
    yAxisKey,
    title,
    description,
    color = "#3b82f6",
    height = 400,
    barSize = 20
}: HorizontalBarChartProps) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent style={{ height: height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey={yAxisKey}
                            type="category"
                            width={140}
                            tick={{ fontSize: 13 }}
                            interval={0}
                        />
                        <Tooltip
                            formatter={(value: any) => formatCurrency(value)}
                            contentStyle={{ borderRadius: "8px" }}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey={xAxisKey} fill={color} radius={[0, 4, 4, 0]} barSize={barSize}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                            ))}
                            {/* Label dentro ou fora da barra seria complexo aqui, melhor deixar tooltip */}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
