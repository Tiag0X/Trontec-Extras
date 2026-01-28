"use client"

import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface DualAxisChartProps {
    data: any[]
    xAxisKey: string
    barKey: string
    lineKey1: string
    lineKey2?: string
    title: string
    description?: string
    barName?: string
    lineName1?: string
    lineName2?: string
}

export function DualAxisChart({
    data,
    xAxisKey,
    barKey,
    lineKey1,
    lineKey2,
    title,
    description,
    barName = "Valor",
    lineName1 = "Volume",
    lineName2
}: DualAxisChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <CartesianGrid stroke="#f5f5f5" />
                        <XAxis dataKey={xAxisKey} scale="band" />
                        <YAxis yAxisId="left" orientation="left" tickFormatter={(val: any) => `R$ ${val}`} />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                            formatter={(value: any, name: any) => {
                                if (name === barName) return formatCurrency(value)
                                return value
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey={barKey} barSize={20} fill="#413ea0" name={barName} radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey={lineKey1} stroke="#ff7300" name={lineName1} strokeWidth={2} />
                        {lineKey2 && (
                            <Line yAxisId="right" type="monotone" dataKey={lineKey2} stroke="#82ca9d" name={lineName2} strokeDasharray="5 5" strokeWidth={2} />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
