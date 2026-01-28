"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
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

            <TabsContent value="strategy">
                <div className="flex h-[450px] items-center justify-center rounded-md border border-dashed text-muted-foreground bg-white">
                    Aba de Estratégia em migração...
                </div>
            </TabsContent>

            <TabsContent value="last-week">
                <div className="flex h-[450px] items-center justify-center rounded-md border border-dashed text-muted-foreground bg-white">
                    Aba de Semana Passada em migração...
                </div>
            </TabsContent>

            <TabsContent value="data">
                <div className="flex h-[450px] items-center justify-center rounded-md border border-dashed text-muted-foreground bg-white">
                    Tabela de Dados em migração...
                </div>
            </TabsContent>
        </Tabs>
    )
}
