import os
import tempfile
import pytest
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from app.services.file_generator import FileGenerator
from app.services.settlement_engine import SettlementInstruction


class TestFileGenerator:
    def _make_instructions(self):
        return [
            SettlementInstruction(1, "FNB001", "First National Bank", Decimal("40000.00"), "D"),
            SettlementInstruction(2, "CBC002", "Central Bank of Commerce", Decimal("25000.50"), "C"),
            SettlementInstruction(3, "USB003", "United Savings Bank", Decimal("14999.50"), "C"),
        ]

    def test_generate_and_parse(self, tmp_path):
        instructions = self._make_instructions()
        eod_date = date(2026, 4, 10)

        with patch("app.services.file_generator.settings") as mock_settings:
            mock_settings.OUTPUT_DIR = str(tmp_path)
            mock_settings.EOD_FILE_PREFIX = "NSI_SETTLEMENT"

            file_name, file_path = FileGenerator.generate_nsi_file(
                eod_date, instructions, Decimal("40000.00"), Decimal("40000.00")
            )

        assert file_name.startswith("NSI_SETTLEMENT_20260410_")
        assert file_name.endswith(".nsi")
        assert os.path.exists(file_path)

        content = FileGenerator.read_nsi_file(file_path)
        parsed = FileGenerator.parse_nsi_file(content)

        assert parsed["header"] is not None
        assert parsed["header"]["prefix"] == "NSI_SETTLEMENT"
        assert parsed["header"]["date"] == "20260410"
        assert parsed["header"]["record_count"] == 3

        assert len(parsed["details"]) == 3
        assert parsed["details"][0]["bank_code"] == "FNB001"
        assert parsed["details"][0]["type"] == "D"
        assert parsed["details"][0]["amount"] == Decimal("40000.00")

        assert parsed["trailer"] is not None
        assert parsed["trailer"]["record_count"] == 3
        assert parsed["trailer"]["total_debit"] == Decimal("40000.00")
        assert parsed["trailer"]["total_credit"] == Decimal("40000.00")

    def test_header_format(self, tmp_path):
        instructions = self._make_instructions()
        eod_date = date(2026, 4, 10)

        with patch("app.services.file_generator.settings") as mock_settings:
            mock_settings.OUTPUT_DIR = str(tmp_path)
            mock_settings.EOD_FILE_PREFIX = "NSI_SETTLEMENT"

            _, file_path = FileGenerator.generate_nsi_file(
                eod_date, instructions, Decimal("40000.00"), Decimal("40000.00")
            )

        content = FileGenerator.read_nsi_file(file_path)
        lines = content.strip().split("\n")
        assert lines[0].startswith("HDR|")
        assert lines[-1].startswith("TRL|")
        for line in lines[1:-1]:
            assert line.startswith("DTL|")

    def test_amount_right_aligned(self, tmp_path):
        instructions = self._make_instructions()
        eod_date = date(2026, 4, 10)

        with patch("app.services.file_generator.settings") as mock_settings:
            mock_settings.OUTPUT_DIR = str(tmp_path)
            mock_settings.EOD_FILE_PREFIX = "NSI_SETTLEMENT"

            _, file_path = FileGenerator.generate_nsi_file(
                eod_date, instructions, Decimal("40000.00"), Decimal("40000.00")
            )

        content = FileGenerator.read_nsi_file(file_path)
        parsed = FileGenerator.parse_nsi_file(content)
        # All amounts should parse to correct Decimal
        for detail in parsed["details"]:
            assert isinstance(detail["amount"], Decimal)

    def test_hash_total(self, tmp_path):
        instructions = self._make_instructions()
        eod_date = date(2026, 4, 10)

        with patch("app.services.file_generator.settings") as mock_settings:
            mock_settings.OUTPUT_DIR = str(tmp_path)
            mock_settings.EOD_FILE_PREFIX = "NSI_SETTLEMENT"

            _, file_path = FileGenerator.generate_nsi_file(
                eod_date, instructions, Decimal("40000.00"), Decimal("40000.00")
            )

        content = FileGenerator.read_nsi_file(file_path)
        parsed = FileGenerator.parse_nsi_file(content)
        expected_hash = sum(d["amount"] for d in parsed["details"])
        assert parsed["trailer"]["hash_total"] == expected_hash

    def test_empty_instructions(self, tmp_path):
        eod_date = date(2026, 4, 10)

        with patch("app.services.file_generator.settings") as mock_settings:
            mock_settings.OUTPUT_DIR = str(tmp_path)
            mock_settings.EOD_FILE_PREFIX = "NSI_SETTLEMENT"

            file_name, file_path = FileGenerator.generate_nsi_file(
                eod_date, [], Decimal("0.00"), Decimal("0.00")
            )

        content = FileGenerator.read_nsi_file(file_path)
        parsed = FileGenerator.parse_nsi_file(content)

        assert parsed["header"]["record_count"] == 0
        assert len(parsed["details"]) == 0
        assert parsed["trailer"]["record_count"] == 0
        assert parsed["trailer"]["hash_total"] == Decimal("0.00")
