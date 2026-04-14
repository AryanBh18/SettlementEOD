import pytest
from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.transaction_simulator import TransactionSimulator


class TestTransactionSimulator:
    @pytest.fixture
    def mock_db(self):
        db = AsyncMock()
        db.add = MagicMock()
        db.flush = AsyncMock()
        return db

    @pytest.fixture
    def mock_banks(self):
        banks = []
        for bid, code, name in [
            (1, "FNB001", "First National"),
            (2, "CBC002", "Central Bank"),
            (3, "USB003", "United Savings"),
        ]:
            bank = MagicMock()
            bank.id = bid
            bank.bank_code = code
            bank.name = name
            banks.append(bank)
        return banks

    @pytest.mark.asyncio
    async def test_simulate_creates_transactions(self, mock_db, mock_banks):
        simulator = TransactionSimulator(mock_db)

        with patch.object(simulator, "_get_all_banks", return_value=mock_banks):
            result = await simulator.simulate(10, date(2026, 4, 14))

        assert result["inserted"] == 10
        assert result["total_requested"] == 10
        assert result["date"] == "2026-04-14"
        assert mock_db.add.call_count == 10
        mock_db.flush.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_simulate_guest_transactions_only(self, mock_db, mock_banks):
        """All generated transactions must have source != destination."""
        simulator = TransactionSimulator(mock_db)

        with patch.object(simulator, "_get_all_banks", return_value=mock_banks):
            await simulator.simulate(100, date(2026, 4, 14))

        for call in mock_db.add.call_args_list:
            txn = call[0][0]
            assert txn.source_bank_id != txn.destination_bank_id

    @pytest.mark.asyncio
    async def test_simulate_correct_types(self, mock_db, mock_banks):
        """Transaction type should be ATM or POS."""
        simulator = TransactionSimulator(mock_db)

        with patch.object(simulator, "_get_all_banks", return_value=mock_banks):
            await simulator.simulate(100, date(2026, 4, 14))

        for call in mock_db.add.call_args_list:
            txn = call[0][0]
            assert txn.transaction_type in ("ATM", "POS")

    @pytest.mark.asyncio
    async def test_simulate_success_status(self, mock_db, mock_banks):
        """All simulated transactions should have SUCCESS status."""
        simulator = TransactionSimulator(mock_db)

        with patch.object(simulator, "_get_all_banks", return_value=mock_banks):
            await simulator.simulate(50, date(2026, 4, 14))

        for call in mock_db.add.call_args_list:
            txn = call[0][0]
            assert txn.status == "SUCCESS"

    @pytest.mark.asyncio
    async def test_simulate_unique_references(self, mock_db, mock_banks):
        """All references should be unique."""
        simulator = TransactionSimulator(mock_db)

        with patch.object(simulator, "_get_all_banks", return_value=mock_banks):
            await simulator.simulate(100, date(2026, 4, 14))

        refs = set()
        for call in mock_db.add.call_args_list:
            txn = call[0][0]
            assert txn.reference not in refs
            refs.add(txn.reference)

    @pytest.mark.asyncio
    async def test_simulate_requires_multiple_banks(self, mock_db):
        """Should raise ValueError if fewer than 2 banks."""
        one_bank = [MagicMock(id=1, bank_code="FNB001", name="FNB")]
        simulator = TransactionSimulator(mock_db)

        with patch.object(simulator, "_get_all_banks", return_value=one_bank):
            with pytest.raises(ValueError, match="At least 2 banks"):
                await simulator.simulate(10, date(2026, 4, 14))

    @pytest.mark.asyncio
    async def test_simulate_amount_range(self, mock_db, mock_banks):
        """Amounts should be within configured range."""
        simulator = TransactionSimulator(mock_db)

        with patch.object(simulator, "_get_all_banks", return_value=mock_banks):
            await simulator.simulate(200, date(2026, 4, 14))

        from app.services.transaction_simulator import AMOUNT_MIN, AMOUNT_MAX
        for call in mock_db.add.call_args_list:
            txn = call[0][0]
            assert txn.amount >= AMOUNT_MIN
            assert txn.amount <= AMOUNT_MAX
