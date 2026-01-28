"use client"

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface DonutChartProps {
    data: any[]
    nameKey: string
    dataKey: string
    title: string
    description?: string
    total?: number
    colors?: string[]
}

const DEFAULT_COLORS = [
    "#3b82f6", "#0ea5e9", "#60a5fa", "#93c5fd", "#bfdbfe", "#e2e8f0"
]

export function DonutChart({
    data,
    nameKey,
    dataKey,
    title,
    description,
    total,
    colors = DEFAULT_COLORS
}: DonutChartProps) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="h-[350px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey={dataKey}
                            nameKey={nameKey}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => formatCurrency(value)}
                            contentStyle={{ borderRadius: "8px" }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>

                {total !== undefined && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-12 pl-2">
                        <div className="text-center bg-white/80 p-2 rounded-full backdrop-blur-sm">
                            <span className="text-xs text-muted-foreground block">Total</span>
                            <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
