# SettlementEOD

Automated End-of-Day (EOD) clearing and settlement system for a national payment switch (BNETS). Replaces manual transaction aggregation, bank position calculation, NSI file generation, validation, and audit logging.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Dashboard                        │
│  (EOD trigger, validation checklist, positions, logs)     │
└─────────────────────────┬────────────────────────────────┘
                          │ REST API
┌─────────────────────────▼────────────────────────────────┐
│                   FastAPI Backend                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Routers  │→ │  Services    │→ │  Repositories      │  │
│  │          │  │  • Clearing  │  │  (async SQLAlchemy) │  │
│  │ POST /eod│  │  • Settlement│  │                     │  │
│  │ GET /eod │  │  • FileGen   │  └─────────┬───────────┘  │
│  │ GET /txn │  │  • Validation│            │              │
│  └──────────┘  │  • Orchestr. │            │              │
│                └──────────────┘            │              │
└────────────────────────────────────────────┼──────────────┘
                                             │
                              ┌──────────────▼──────────────┐
                              │   PostgreSQL (Supabase)      │
                              │   banks, transactions,       │
                              │   clearing_results,          │
                              │   settlement_files,          │
                              │   process_logs,              │
                              │   validation_results         │
                              └──────────────────────────────┘
```

## Tech Stack

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy (async)
- **Database**: PostgreSQL (Supabase compatible)
- **Frontend**: React + TypeScript + Vite + TanStack Query
- **Testing**: pytest + pytest-asyncio + aiosqlite (in-memory)

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL for your Supabase/PG instance
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Database Setup

Run the SQL files against your PostgreSQL instance:

```bash
psql -U postgres -d eod_settlement -f backend/migrations/001_init.sql
psql -U postgres -d eod_settlement -f backend/migrations/seed.sql
```

### 4. Docker (all-in-one)

```bash
docker compose up --build
```
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/eod/run` | Trigger EOD run `{ eod_date, force_rerun? }` |
| `GET`  | `/eod/status/{date}` | Full status with positions, validations, logs |
| `GET`  | `/eod/files/{date}` | Download NSI settlement file |
| `GET`  | `/transactions/{date}` | List transactions for a date |

## Core Modules

1. **Transaction Module** — Fetch SUCCESS-only transactions, exclude FAILED/REVERSED
2. **Clearing Engine** — Calculate net positions per bank: `incoming - outgoing`
3. **Settlement Engine** — Generate debit/credit instructions from net positions
4. **File Generator** — Produce pipe-delimited NSI file with HDR/DTL/TRL structure
5. **Validation Engine** — 6 checks: balance, file structure, bank completeness, nulls, decimal precision, hash total
6. **EOD Orchestrator** — Full pipeline with idempotency, logging, and error handling

## NSI File Format

```
HDR|NSI_SETTLEMENT|20260410|3|2026-04-10T18:00:00
DTL|0001|FNB001|      40000.00|D|First National Bank
DTL|0002|CBC002|      25000.50|C|Central Bank of Commerce
DTL|0003|USB003|      14999.50|C|United Savings Bank
TRL|40000.00|40000.00|3|79999.50
```

## Tests

```bash
cd backend
python -m pytest tests/ -v
```

35 tests covering:
- Clearing engine position calculation (6 tests)
- Settlement engine instructions & balance (6 tests)
- File generator format & parsing (5 tests)
- Validation engine checks (14 tests)
- Integration: full EOD pipeline, idempotency, re-run, empty date (4 tests)
