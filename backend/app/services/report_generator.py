import csv
import io
from datetime import date
from decimal import Decimal

from app.services.clearing_engine import BankPosition
from app.services.settlement_engine import SettlementInstruction
from app.services.validation_engine import ValidationCheck


class ReportGenerator:
    @staticmethod
    def generate_positions_csv(
        eod_date: date,
        positions: dict[int, BankPosition],
        instructions: list[SettlementInstruction],
        total_debit: Decimal,
        total_credit: Decimal,
        checks: list[ValidationCheck],
    ) -> str:
        """Generate a CSV report of the EOD run."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header section
        writer.writerow(["EOD Settlement Report"])
        writer.writerow(["Date", str(eod_date)])
        writer.writerow(["Generated", str(date.today())])
        writer.writerow([])

        # Bank Positions
        writer.writerow(["Bank Positions"])
        writer.writerow(["Bank ID", "Bank Code", "Bank Name", "Total Incoming", "Total Outgoing", "Net Position"])
        for pos in positions.values():
            writer.writerow([
                pos.bank_id, pos.bank_code, pos.bank_name,
                f"{pos.total_incoming:.2f}", f"{pos.total_outgoing:.2f}", f"{pos.net_position:.2f}",
            ])
        writer.writerow([])

        # Settlement Instructions
        writer.writerow(["Settlement Instructions"])
        writer.writerow(["Bank Code", "Bank Name", "Amount", "Type"])
        for instr in instructions:
            writer.writerow([
                instr.bank_code, instr.bank_name,
                f"{instr.amount:.2f}", instr.instruction_type,
            ])
        writer.writerow([])

        # Totals
        writer.writerow(["Totals"])
        writer.writerow(["Total Debit", f"{total_debit:.2f}"])
        writer.writerow(["Total Credit", f"{total_credit:.2f}"])
        writer.writerow(["Balance", "OK" if total_debit == total_credit else "MISMATCH"])
        writer.writerow([])

        # Validation Results
        writer.writerow(["Validation Results"])
        writer.writerow(["Check Name", "Status", "Message"])
        for check in checks:
            writer.writerow([check.check_name, check.status, check.message])

        return output.getvalue()

    @staticmethod
    def generate_logs_csv(logs: list) -> str:
        """Generate a CSV export of process logs."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Process Name", "Status", "Message", "EOD Date", "Created At"])
        for log in logs:
            writer.writerow([
                log.id, log.process_name, log.status,
                log.message, str(log.eod_date), str(log.created_at),
            ])
        return output.getvalue()
