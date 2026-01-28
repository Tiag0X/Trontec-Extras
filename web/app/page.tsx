import { getSheetData } from "@/lib/google-sheets";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const revalidate = 300; // 5 minutos de cache

export default async function Page() {
  const data = await getSheetData();

  return (
    <main className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Extras</h1>
          <p className="text-muted-foreground">
            Dashboard de acompanhamento de custos e acionamentos extras.
          </p>
        </div>

        <DashboardView initialData={data} />
      </div>
    </main>
  )
}
