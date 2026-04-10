import os
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

from app.config import settings
from app.services.settlement_engine import SettlementInstruction


class FileGenerator:
    @staticmethod
    def generate_nsi_file(
        eod_date: date,
        instructions: list[SettlementInstruction],
        total_debit: Decimal,
        total_credit: Decimal,
    ) -> tuple[str, str]:
        """
        Generate an NSI settlement file.

        Returns:
            (file_name, file_path)
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        date_str = eod_date.strftime("%Y%m%d")
        file_name = f"{settings.EOD_FILE_PREFIX}_{date_str}_{timestamp}.nsi"

        output_dir = Path(settings.OUTPUT_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)
        file_path = output_dir / file_name

        record_count = len(instructions)
        generation_ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")

        lines: list[str] = []

        # Header
        lines.append(f"HDR|{settings.EOD_FILE_PREFIX}|{date_str}|{record_count}|{generation_ts}")

        # Detail lines
        hash_total = Decimal("0.00")
        for seq, instr in enumerate(instructions, start=1):
            amount_str = f"{instr.amount:.2f}".rjust(15)
            lines.append(
                f"DTL|{seq:04d}|{instr.bank_code}|{amount_str}|{instr.instruction_type}|{instr.bank_name}"
            )
            hash_total += abs(instr.amount)

        # Trailer
        lines.append(
            f"TRL|{total_debit:.2f}|{total_credit:.2f}|{record_count}|{hash_total:.2f}"
        )

        file_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

        return file_name, str(file_path)

    @staticmethod
    def read_nsi_file(file_path: str) -> str:
        return Path(file_path).read_text(encoding="utf-8")

    @staticmethod
    def parse_nsi_file(content: str) -> dict:
        """Parse an NSI file and return structured data for validation."""
        lines = [line for line in content.strip().split("\n") if line]
        result: dict = {"header": None, "details": [], "trailer": None, "raw_lines": lines}

        for line in lines:
            parts = line.split("|")
            if parts[0] == "HDR":
                result["header"] = {
                    "prefix": parts[1],
                    "date": parts[2],
                    "record_count": int(parts[3]),
                    "timestamp": parts[4],
                }
            elif parts[0] == "DTL":
                result["details"].append({
                    "seq": int(parts[1]),
                    "bank_code": parts[2],
                    "amount": Decimal(parts[3].strip()),
                    "type": parts[4],
                    "bank_name": parts[5],
                })
            elif parts[0] == "TRL":
                result["trailer"] = {
                    "total_debit": Decimal(parts[1]),
                    "total_credit": Decimal(parts[2]),
                    "record_count": int(parts[3]),
                    "hash_total": Decimal(parts[4]),
                }

        return result
