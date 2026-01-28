"""
Testes para o módulo utils.py
"""
import os
import sys

# Adiciona o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import pytest
from utils import (
    clean_currency,
    normalize_boolean,
    extract_hour,
    get_default_index,
    get_shift_color,
    format_currency,
    format_currency_short,
)


class TestCleanCurrency:
    """Testes para a função clean_currency."""
    
    def test_string_with_symbol(self):
        assert clean_currency("R$ 1.234,56") == 1234.56
    
    def test_string_without_symbol(self):
        assert clean_currency("1.234,56") == 1234.56
    
    def test_numeric_value(self):
        assert clean_currency(100.50) == 100.50
    
    def test_invalid_string(self):
        assert clean_currency("abc") == 0.0
    
    def test_empty_string(self):
        assert clean_currency("") == 0.0


class TestNormalizeBoolean:
    """Testes para a função normalize_boolean."""
    
    def test_sim_variations(self):
        assert normalize_boolean("Sim") == "Sim"
        assert normalize_boolean("sim") == "Sim"
        assert normalize_boolean("S") == "Sim"
        assert normalize_boolean("s") == "Sim"
        assert normalize_boolean("yes") == "Sim"
        assert normalize_boolean("true") == "Sim"
        assert normalize_boolean("1") == "Sim"
    
    def test_nao_variations(self):
        assert normalize_boolean("Não") == "Não"
        assert normalize_boolean("nao") == "Não"
        assert normalize_boolean("N") == "Não"
        assert normalize_boolean("no") == "Não"
        assert normalize_boolean("false") == "Não"
        assert normalize_boolean("0") == "Não"
    
    def test_none_value(self):
        assert normalize_boolean(None) == "Não"
    
    def test_empty_string(self):
        assert normalize_boolean("") == "Não"


class TestExtractHour:
    """Testes para a função extract_hour."""
    
    def test_time_format_hhmm(self):
        assert extract_hour("14:30") == 14
        assert extract_hour("08:00") == 8
        assert extract_hour("23:59") == 23
    
    def test_time_format_hhmmss(self):
        assert extract_hour("14:30:00") == 14
        assert extract_hour("08:00:45") == 8
    
    def test_datetime_format(self):
        assert extract_hour("2025-01-01 18:00:00") == 18
        assert extract_hour("2025-12-31 06:30:00") == 6
    
    def test_invalid_values(self):
        assert extract_hour("") == -1
        assert extract_hour("nan") == -1
        assert extract_hour("None") == -1
        assert extract_hour("abc") == -1


class TestGetDefaultIndex:
    """Testes para a função get_default_index."""
    
    def test_finds_keyword(self):
        options = ["Nome", "Data", "Valor (R$)", "Status"]
        assert get_default_index(options, ["valor"]) == 2
        assert get_default_index(options, ["data"]) == 1
    
    def test_multiple_keywords(self):
        options = ["Colaborador", "Funcionário", "Nome"]
        assert get_default_index(options, ["colaborador", "funcionário"]) == 0
    
    def test_no_match(self):
        options = ["A", "B", "C"]
        assert get_default_index(options, ["xyz"]) is None


class TestGetShiftColor:
    """Testes para a função get_shift_color."""
    
    def test_madrugada(self):
        assert get_shift_color(0) == "#EF4444"
        assert get_shift_color(3) == "#EF4444"
        assert get_shift_color(5) == "#EF4444"
    
    def test_comercial(self):
        assert get_shift_color(6) == "#3B82F6"
        assert get_shift_color(12) == "#3B82F6"
        assert get_shift_color(17) == "#3B82F6"
    
    def test_noturno(self):
        assert get_shift_color(18) == "#F97316"
        assert get_shift_color(21) == "#F97316"
        assert get_shift_color(23) == "#F97316"


class TestFormatCurrency:
    """Testes para funções de formatação de moeda."""
    
    def test_format_currency(self):
        result = format_currency(1234.56)
        assert "1" in result
        assert "234" in result
    
    def test_format_currency_short(self):
        result = format_currency_short(1234.56)
        assert "R$" in result
        assert "1" in result
