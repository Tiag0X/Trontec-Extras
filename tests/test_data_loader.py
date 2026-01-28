"""
Testes para o módulo data_loader.py
"""
import os
import pytest
import pandas as pd


# Importa de forma relativa para testes
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))


class TestLoadSampleData:
    """Testes para carregamento de dados de exemplo."""
    
    def test_sample_csv_exists(self):
        """Verifica se o arquivo sample.csv existe."""
        sample_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 'data', 'sample.csv'
        )
        assert os.path.exists(sample_path), "Arquivo sample.csv não encontrado"
    
    def test_sample_csv_not_empty(self):
        """Verifica se o arquivo sample.csv não está vazio."""
        sample_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 'data', 'sample.csv'
        )
        df = pd.read_csv(sample_path)
        assert not df.empty, "Arquivo sample.csv está vazio"
    
    def test_sample_csv_has_expected_columns(self):
        """Verifica se o sample.csv tem as colunas esperadas."""
        sample_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 'data', 'sample.csv'
        )
        df = pd.read_csv(sample_path)
        expected_columns = ['date', 'category', 'value']
        for col in expected_columns:
            assert col in df.columns, f"Coluna '{col}' não encontrada"


class TestHeaderCleaning:
    """Testes para limpeza de cabeçalhos."""
    
    def test_empty_header_handling(self):
        """Testa tratamento de cabeçalhos vazios."""
        headers = ["Nome", "", "Valor", ""]
        seen = {}
        cleaned_headers = []
        
        for i, h in enumerate(headers):
            h = str(h).strip()
            if not h:
                h = f"Unnamed_{i}"
            if h in seen:
                seen[h] += 1
                h = f"{h}_{seen[h]}"
            else:
                seen[h] = 0
            cleaned_headers.append(h)
        
        assert cleaned_headers[1] == "Unnamed_1"
        assert cleaned_headers[3] == "Unnamed_3"
    
    def test_duplicate_header_handling(self):
        """Testa tratamento de cabeçalhos duplicados."""
        headers = ["Nome", "Valor", "Nome", "Nome"]
        seen = {}
        cleaned_headers = []
        
        for i, h in enumerate(headers):
            h = str(h).strip()
            if not h:
                h = f"Unnamed_{i}"
            if h in seen:
                seen[h] += 1
                h = f"{h}_{seen[h]}"
            else:
                seen[h] = 0
            cleaned_headers.append(h)
        
        assert cleaned_headers[0] == "Nome"
        assert cleaned_headers[2] == "Nome_1"
        assert cleaned_headers[3] == "Nome_2"
