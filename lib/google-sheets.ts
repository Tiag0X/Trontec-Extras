import { google } from 'googleapis';
import { cleanCurrency, normalizeBoolean } from './utils';

export type SheetRow = {
    data: string;
    valor: number;
    colaborador: string;
    condominio: string;
    setor: string;
    motivo: string;
    cobrar: "Sim" | "Não";
    entrada: string;
    saida: string;
    conducao: "Sim" | "Não";
    [key: string]: any;
};

export async function getSheetData(): Promise<SheetRow[]> {
    try {
        const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const range = process.env.GOOGLE_SHEETS_WORKSHEET_NAME || 'Página1';

        if (!credentialsJson || !spreadsheetId) {
            console.warn("Missing Google Sheets credentials");
            return [];
        }

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(credentialsJson),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        // Header header normalization logic similar to Python
        const headers = rows[0].map(h => h.toString().toLowerCase().trim());
        const dataRows = rows.slice(1);

        // Helpers to find indexes
        const getIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

        const idxDate = getIdx(['data']);
        const idxVal = getIdx(['valor', 'preço']);
        const idxColab = getIdx(['colaborador', 'func', 'nome']);
        const idxCond = getIdx(['condomínio', 'cliente', 'local']);
        const idxSetor = getIdx(['setor', 'área']);
        const idxMotivo = getIdx(['motivo', 'descrição']);
        const idxCobrar = getIdx(['cobrar']);
        const idxEntrada = getIdx(['entrada']);
        const idxSaida = getIdx(['saída']);
        const idxConducao = getIdx(['condução', 'transporte']);

        return dataRows.map(row => ({
            data: idxDate >= 0 ? row[idxDate] : '',
            valor: idxVal >= 0 ? cleanCurrency(row[idxVal]) : 0,
            colaborador: idxColab >= 0 ? row[idxColab] : 'N/A',
            condominio: idxCond >= 0 ? row[idxCond] : 'N/A',
            setor: idxSetor >= 0 ? row[idxSetor] : 'N/A',
            motivo: idxMotivo >= 0 ? row[idxMotivo] : 'N/A',
            cobrar: idxCobrar >= 0 ? normalizeBoolean(row[idxCobrar]) : 'Não',
            entrada: idxEntrada >= 0 ? row[idxEntrada] : '',
            saida: idxSaida >= 0 ? row[idxSaida] : '',
            conducao: idxConducao >= 0 ? normalizeBoolean(row[idxConducao]) : 'Não',
        }));

    } catch (error) {
        console.error("Error fetching sheet data:", error);
        return [];
    }
}
