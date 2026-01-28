# Dashboard de Planilha (Google Sheets) com Streamlit

## Visão geral
Este projeto lê dados de uma planilha no Google Sheets e exibe um dashboard interativo em Streamlit com filtros e gráficos.

## Pré-requisitos
- Python 3.10+
- Uma planilha no Google Sheets
- Credenciais de uma Service Account com acesso de leitura ao Google Sheets

## Configuração das credenciais Google

### Opção A: Arquivo Local (Desenvolvimento)
1. Crie um projeto no Google Cloud e ative a API "Google Sheets API".
2. Crie uma Service Account e faça download do arquivo `credentials.json`.
3. Compartilhe a sua planilha com o e-mail da Service Account (campo `client_email` do JSON) com permissão de Leitor.
4. Defina as variáveis no arquivo `.env` com base em `.env.example`:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: caminho completo do arquivo `credentials.json`.
   - `GOOGLE_SHEETS_SPREADSHEET_ID`: ID da planilha (parte do link após `/d/`).
   - `GOOGLE_SHEETS_WORKSHEET_NAME`: nome da guia (ex.: `Página1`).

### Opção B: Variável de Ambiente (Vercel / Produção)
Para deploy (ex: Vercel, Streamlit Cloud), onde não é seguro subir arquivos de credenciais:
1. Copie todo o conteúdo do seu arquivo `credentials.json`.
2. Crie uma variável de ambiente chamada `GOOGLE_CREDENTIALS_JSON`.
3. Cole o conteúdo JSON minificado (tudo em uma linha) como valor desta variável.
4. Defina também `GOOGLE_SHEETS_SPREADSHEET_ID` e `GOOGLE_SHEETS_WORKSHEET_NAME` no painel de variáveis do seu provedor de hospedagem.

Enquanto as credenciais não estiverem configuradas, o app usa `data/sample.csv` como dados de exemplo.

## Instalação
```bash
pip install -r requirements.txt
```

## Execução
```bash
streamlit run src/app.py
```

## Estrutura
- `src/app.py`: aplicação Streamlit.
- `src/data_loader.py`: carregador de dados (Google Sheets ou amostra local).
- `data/sample.csv`: dados de exemplo.

## Observações
- Identificadores de código estão em inglês.
- Não comite o arquivo real de credenciais.
