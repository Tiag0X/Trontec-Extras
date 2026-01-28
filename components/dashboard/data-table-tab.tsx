"use client"

import { useState } from "react"
import { SheetRow } from "@/lib/google-sheets"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

interface DataTableTabProps {
    data: SheetRow[]
}

export function DataTableTab({ data }: DataTableTabProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // Search Logic
    const filteredData = data.filter(row => {
        if (!searchTerm) return true
        const lower = searchTerm.toLowerCase()
        return (
            row.colaborador.toLowerCase().includes(lower) ||
            row.condominio.toLowerCase().includes(lower) ||
            row.setor.toLowerCase().includes(lower) ||
            (row.motivo && row.motivo.toLowerCase().includes(lower))
        )
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const visibleData = filteredData.slice(startIndex, startIndex + itemsPerPage)

    const handlePageChange = (p: number) => {
        if (p >= 1 && p <= totalPages) setCurrentPage(p)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por colaborador, condomínio..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1) // Reset page on search
                        }}
                        className="pl-8"
                    />
                </div>
                <div className="text-sm text-muted-foreground ml-auto">
                    Total: <strong>{filteredData.length}</strong> registros
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Condomínio</TableHead>
                            <TableHead>Setor</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Entrada</TableHead>
                            <TableHead>Saída</TableHead>
                            <TableHead>Cobrar?</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                    Nenhum resultado encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleData.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="whitespace-nowrap">{row.data}</TableCell>
                                    <TableCell className="font-medium">{row.colaborador}</TableCell>
                                    <TableCell>{row.condominio}</TableCell>
                                    <TableCell>{row.setor}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={row.motivo}>{row.motivo}</TableCell>
                                    <TableCell>{row.entrada}</TableCell>
                                    <TableCell>{row.saida}</TableCell>
                                    <TableCell>{row.cobrar}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.valor)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-sm text-muted-foreground mr-4">
                    Página {currentPage} de {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
