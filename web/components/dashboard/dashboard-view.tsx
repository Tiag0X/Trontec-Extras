"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
import { StrategyTab } from "./strategy-tab"
import { LastWeekTab } from "./last-week-tab"
import { DataTableTab } from "./data-table-tab"
import { SheetRow } from "@/lib/google-sheets"

interface DashboardViewProps {
    initialData: SheetRow[]
}

export function DashboardView({ initialData }: DashboardViewProps) {
    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="strategy">Análise Estratégica</TabsTrigger>
                <TabsTrigger value="last-week">Semana Passada</TabsTrigger>
                <TabsTrigger value="data">Dados Detalhados</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
                <OverviewTab data={initialData} />
            </TabsContent>

            <TabsContent value="strategy" className="space-y-4">
                <StrategyTab data={initialData} />
            </TabsContent>

            <TabsContent value="last-week" className="space-y-4">
                <LastWeekTab data={initialData} />
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
                <DataTableTab data={initialData} />
            </TabsContent>
        </Tabs>
    )
}
