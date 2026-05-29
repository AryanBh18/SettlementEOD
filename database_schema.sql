-- =============================================================================
-- EOD Settlement System — Complete Database Schema (PostgreSQL)
-- VERBETERDE VERSIE MET FEEDBACK-CORRECTIES
-- Gegenereerd op: 2026-05-20
-- 
-- CHANGELOG:
-- • Tekstuele documentatie toegevoegd
-- • settlement_files.bank_code → bank_id (met FK)
-- • Alle datumnamen genormaliseerd → eod_date
-- =============================================================================
 
-- =============================================================================
-- SYSTEEM OVERVIEW
-- =============================================================================
/*
Het EOD (End of Day) Settlement System verwerkt interbank-transacties via
volgende workflow:
 
1. INNAME (Input Phase)
   - Banken uploaden dagelijkse transactiefiles
   - Elke transactie bevat: bron-bank, doel-bank, bedrag, type
 
2. CLEARING (Processing Phase)
   - System aggregeert transacties per bank per EOD-datum
   - Berekent incoming/outgoing flows per bank
   - Voert validatie uit (bedragen, tegenpartijen, etc.)
 
3. NETTING (Bilateral Settlement Phase)
   - Per bankpaar: bereken netto-posities
   - Reduceer aantal settlements door netting
   - Zet resultaten in bilateral_settlements tabel
 
4. SETTLEMENT (Output Phase)
   - Genereer NSI-settlementfiles (COMBINED of INDIVIDUAL per bank)
   - Registreer settlement-resultaten
   - Verzend notificaties (succes/failure)
 
5. VALIDATIE & AUDIT
   - Voer navalidatie uit (balans-checks, reconciliation)
   - Log alle acties voor audit-trail
   - Registreer process-logs en validation-results
 
6. CUT-OFF
   - Daily cut-off op vaste tijd (standaard 16:00)
   - Sluit EOD-datum af, geen verdere transacties toestaan
*/
 
-- =============================================================================
-- TABEL: banks
-- Bevat alle deelnemende banken in het settlement-systeem.
-- Elke bank heeft unieke bank_code voor externe referentie.
-- =============================================================================
CREATE TABLE IF NOT EXISTS banks (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    bank_code   VARCHAR(20)  NOT NULL UNIQUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
COMMENT ON TABLE banks IS
'Registratie van alle deelnemende banken. 
Dient als master-reference voor alle FK-relaties.
Voorbeeld: id=1 | name="ABN AMRO" | bank_code="ABNANL2A"';
 
 
-- =============================================================================
-- TABEL: users
-- Gebruikers van de applicatie met rolgebaseerde toegangscontrole.
-- Rollen: ADMIN | OPERATOR | VIEWER
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL       PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    role            VARCHAR(20)  NOT NULL DEFAULT 'VIEWER',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER'))
);
 
COMMENT ON TABLE users IS
'Gebruikersbeheer met rollen: ADMIN (volledige toegang), 
OPERATOR (mag EOD-processen triggeren), VIEWER (read-only)';
 
 
-- =============================================================================
-- TABEL: transactions
-- Interbank-transacties die worden verwerkt in het EOD-clearing-proces.
-- Status-waarden : SUCCESS | FAILED | REVERSED
-- Type-waarden   : TRANSFER | WIRE | ATM | POS
-- 
-- OPMERKING: Deze tabel bevat de dagelijkse transactie-inbreng.
-- Transacties kunnen afkomstig zijn van:
--   - Directe upload via UI (uploaded_by = user_id)
--   - Import vanuit extern BNETS-systeem (uploaded_by = NULL / system user)
--   - Batch-processing van clearing-files
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id                      BIGSERIAL    PRIMARY KEY,
    reference               VARCHAR(100) UNIQUE,
    source_bank_id          INT          NOT NULL,
    destination_bank_id     INT          NOT NULL,
    amount                  NUMERIC(15, 2) NOT NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'SUCCESS',
    transaction_type        VARCHAR(20)  NOT NULL DEFAULT 'TRANSFER',
    eod_date                DATE         NOT NULL,
    uploaded_by             INT,
    created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT fk_txn_source_bank      FOREIGN KEY (source_bank_id)      REFERENCES banks(id),
    CONSTRAINT fk_txn_destination_bank FOREIGN KEY (destination_bank_id) REFERENCES banks(id),
    CONSTRAINT fk_txn_uploaded_by      FOREIGN KEY (uploaded_by)         REFERENCES users(id),
    CONSTRAINT chk_txn_status          CHECK (status IN ('SUCCESS', 'FAILED', 'REVERSED')),
    CONSTRAINT chk_txn_positive_amount CHECK (amount >= 0)
);
 
CREATE INDEX IF NOT EXISTS idx_transactions_eod_date        ON transactions(eod_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status          ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_eod_date_status ON transactions(eod_date, status);
 
COMMENT ON TABLE transactions IS
'Kerngegevens: alle interbank-transacties per EOD-datum.
Bron: directe upload, BNETS-import, of batch-processing.';
 
COMMENT ON COLUMN transactions.eod_date IS
'End-of-Day datum waarop deze transactie geldig is / wordt verwerkt.';
 
 
-- =============================================================================
-- TABEL: clearing_results
-- Gecalculeerde clearing-posities per bank per EOD-datum.
-- Elke bank mag slechts één record per datum hebben (unieke combinatie).
--
-- Berekening:
--   total_incoming = SUM(amount) WHERE destination_bank_id = bank_id AND status = SUCCESS
--   total_outgoing = SUM(amount) WHERE source_bank_id = bank_id AND status = SUCCESS
--   net_position = total_incoming - total_outgoing
-- =============================================================================
CREATE TABLE IF NOT EXISTS clearing_results (
    id              BIGSERIAL     PRIMARY KEY,
    bank_id         INT           NOT NULL,
    total_incoming  NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_outgoing  NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_position    NUMERIC(15, 2) NOT NULL DEFAULT 0,
    eod_date        DATE          NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT fk_clearing_bank        FOREIGN KEY (bank_id) REFERENCES banks(id),
    CONSTRAINT uq_clearing_bank_date   UNIQUE (bank_id, eod_date)
);
 
CREATE INDEX IF NOT EXISTS idx_clearing_eod_date ON clearing_results(eod_date);
 
COMMENT ON TABLE clearing_results IS
'Aggregatie-resultaten per bank per EOD-dag.
Berekend via: transactions → grouping → net position computation.';
 
 
-- =============================================================================
-- TABEL: settlement_files
-- Gegenereerde NSI-settlementbestanden per EOD-datum.
-- file_type : COMBINED | INDIVIDUAL (per bank)
-- status    : SUCCESS | FAILED
--
-- CORRECTIE (v2): bank_code vervangen door bank_id met FK
-- (Unieke index ziet erop toe: één file per type+datum+bank)
-- =============================================================================
CREATE TABLE IF NOT EXISTS settlement_files (
    id           BIGSERIAL     PRIMARY KEY,
    file_name    VARCHAR(255)  NOT NULL,
    file_path    TEXT          NOT NULL,
    total_debit  NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    eod_date     DATE          NOT NULL,
    status       VARCHAR(20)   NOT NULL DEFAULT 'SUCCESS',
    file_type    VARCHAR(20)   NOT NULL DEFAULT 'COMBINED',
    bank_id      INT,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT chk_file_status CHECK (status IN ('SUCCESS', 'FAILED')),
    CONSTRAINT fk_settlement_file_bank FOREIGN KEY (bank_id) REFERENCES banks(id)
);
 
-- Unieke combinatie: één bestand per type + datum + optionele bank
CREATE UNIQUE INDEX IF NOT EXISTS uq_settlement_file_type_date
    ON settlement_files(eod_date, file_type, COALESCE(bank_id, 0));
 
COMMENT ON TABLE settlement_files IS
'Output-files voor settlement: NSI-format.
- COMBINED: één file voor alle banken samen
- INDIVIDUAL: aparte file per bank (bank_id is NOT NULL)';
 
COMMENT ON COLUMN settlement_files.bank_id IS
'FK naar banks. NULL = COMBINED file. Filled = INDIVIDUAL file voor deze bank.';
 
 
-- =============================================================================
-- TABEL: bilateral_settlements
-- Bilaterale netting-resultaten per bankpaar per settlementdatum.
-- bank_a_id is altijd < bank_b_id om canonieke ordening te garanderen.
-- net_direction : A_TO_B | B_TO_A | ZERO
--
-- CORRECTIE (v2): settlement_date → eod_date voor consistentie
-- =============================================================================
CREATE TABLE IF NOT EXISTS bilateral_settlements (
    id               BIGSERIAL      PRIMARY KEY,
    eod_date         DATE           NOT NULL,
    bank_a_id        INT            NOT NULL,
    bank_b_id        INT            NOT NULL,
    bank_a_owes_b    NUMERIC(15, 2) NOT NULL DEFAULT 0,
    bank_b_owes_a    NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_amount       NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_direction    VARCHAR(10)    NOT NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT fk_bilateral_bank_a        FOREIGN KEY (bank_a_id) REFERENCES banks(id),
    CONSTRAINT fk_bilateral_bank_b        FOREIGN KEY (bank_b_id) REFERENCES banks(id),
    CONSTRAINT uq_bilateral_pair_date     UNIQUE (eod_date, bank_a_id, bank_b_id),
    CONSTRAINT chk_bilateral_bank_order   CHECK (bank_a_id < bank_b_id),
    CONSTRAINT chk_bilateral_direction    CHECK (net_direction IN ('A_TO_B', 'B_TO_A', 'ZERO'))
);
 
CREATE INDEX IF NOT EXISTS idx_bilateral_eod_date  ON bilateral_settlements(eod_date);
CREATE INDEX IF NOT EXISTS idx_bilateral_banks     ON bilateral_settlements(bank_a_id, bank_b_id);
 
COMMENT ON TABLE bilateral_settlements IS
'Netting-resultaten per bankpaar. 
Canonieke ordening: bank_a_id < bank_b_id.';
 
 
-- =============================================================================
-- TABEL: cutoff_logs
-- Registreert wanneer de dagelijkse cut-off is uitgevoerd voor een datum.
-- status : ACTIVE | CANCELLED
--
-- CORRECTIE (v2): settlement_date → eod_date voor consistentie
-- =============================================================================
CREATE TABLE IF NOT EXISTS cutoff_logs (
    id                  BIGSERIAL  PRIMARY KEY,
    eod_date            DATE       NOT NULL UNIQUE,
    cutoff_timestamp    TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    triggered_by        INT,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    message             TEXT,
    created_at          TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT fk_cutoff_triggered_by  FOREIGN KEY (triggered_by) REFERENCES users(id),
    CONSTRAINT chk_cutoff_status       CHECK (status IN ('ACTIVE', 'CANCELLED'))
);
 
CREATE INDEX IF NOT EXISTS idx_cutoff_logs_eod_date ON cutoff_logs(eod_date);
 
COMMENT ON TABLE cutoff_logs IS
'Audit-trail voor EOD cut-offs. Wanneer is cutoff voor welke datum uitgevoerd?';
 
 
-- =============================================================================
-- TABEL: cutoff_schedules
-- Singleton-configuratietabel voor automatische cut-offtijdinstellingen.
-- Ideaal: slechts 1 rij in deze tabel.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cutoff_schedules (
    id               SERIAL      PRIMARY KEY,
    cutoff_time      VARCHAR(5)  NOT NULL DEFAULT '16:00',
    is_auto_enabled  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
COMMENT ON TABLE cutoff_schedules IS
'Globale cut-off configuratie. Normaal: 1 rij.
cutoff_time: HH:MM format (bijv. "16:00").
is_auto_enabled: automatische cut-off ingeschakeld?';
 
 
-- =============================================================================
-- TABEL: process_logs
-- Logboek van EOD-processen (clearing, validatie, bestandsgeneratie, etc.).
-- =============================================================================
CREATE TABLE IF NOT EXISTS process_logs (
    id            BIGSERIAL    PRIMARY KEY,
    process_name  VARCHAR(100) NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    message       TEXT,
    eod_date      DATE         NOT NULL,
    triggered_by  INT,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT fk_process_log_triggered_by FOREIGN KEY (triggered_by) REFERENCES users(id)
);
 
CREATE INDEX IF NOT EXISTS idx_process_logs_eod_date ON process_logs(eod_date);
 
COMMENT ON TABLE process_logs IS
'Uitvoerings-log van alle EOD-processen.
Bijv: CLEARING START → CLEARING END, FILE_GENERATION, NOTIFICATION_SEND, etc.';
 
 
-- =============================================================================
-- TABEL: validation_results
-- Resultaten van validatiechecks per EOD-datum.
-- status : PASS | FAIL
-- =============================================================================
CREATE TABLE IF NOT EXISTS validation_results (
    id            BIGSERIAL    PRIMARY KEY,
    check_name    VARCHAR(100) NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    message       TEXT,
    eod_date      DATE         NOT NULL,
    triggered_by  INT,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT fk_validation_triggered_by FOREIGN KEY (triggered_by) REFERENCES users(id),
    CONSTRAINT chk_validation_status      CHECK (status IN ('PASS', 'FAIL'))
);
 
CREATE INDEX IF NOT EXISTS idx_validation_eod_date     ON validation_results(eod_date);
CREATE INDEX IF NOT EXISTS idx_validation_triggered_by ON validation_results(triggered_by);
 
COMMENT ON TABLE validation_results IS
'Validatie-checks per EOD-dag.
Bijv: TOTAL_DEBIT_CREDIT_MATCH, BANK_BALANCE_VALID, FILE_FORMAT_VALID, etc.';
 
 
-- =============================================================================
-- TABEL: audit_logs
-- Registreert alle gebruikersacties voor auditdoeleinden.
-- Bevat: wie, wat, waar, wanneer, en aanvullende details als JSON.
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      INT,
    action       VARCHAR(100) NOT NULL,
    resource     VARCHAR(100),
    resource_id  VARCHAR(100),
    details      JSONB,
    ip_address   VARCHAR(45),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);
 
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action  ON audit_logs(action);
 
COMMENT ON TABLE audit_logs IS
'Volledige audit-trail. Wie deed wat, wanneer?
action: LOGIN, UPLOAD_FILE, RUN_CLEARING, DOWNLOAD_SETTLEMENT, etc.';
 
 
-- =============================================================================
-- TABEL: notification_settings
-- Singleton-configuratietabel voor e-mailnotificaties.
-- Normaal: slechts 1 rij.
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id                  SERIAL    PRIMARY KEY,
    email_recipients    JSONB     NOT NULL DEFAULT '[]',
    notify_on_success   BOOLEAN   NOT NULL DEFAULT FALSE,
    notify_on_failure   BOOLEAN   NOT NULL DEFAULT TRUE,
    smtp_configured     BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
COMMENT ON TABLE notification_settings IS
'Notificatie-configuratie. Standaard: 1 rij.
email_recipients: JSON array van e-mailadressen.
notify_on_success/failure: welke events triggeren e-mail?';
 
 
-- =============================================================================
-- TABEL: mapping_rules
-- Configureerbare veldmappingregels voor bestandsparsing en -transformatie.
-- transform_type : DIRECT | FORMAT | LOOKUP | CONSTANT
-- =============================================================================
CREATE TABLE IF NOT EXISTS mapping_rules (
    id                SERIAL       PRIMARY KEY,
    rule_name         VARCHAR(100) NOT NULL,
    field_source      VARCHAR(100) NOT NULL,
    field_target      VARCHAR(100) NOT NULL,
    transform_type    VARCHAR(50)  NOT NULL DEFAULT 'DIRECT',
    transform_config  JSONB        NOT NULL DEFAULT '{}',
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
COMMENT ON TABLE mapping_rules IS
'Configureerbare veld-transformatie-regels.
Bijv: CSV-kolom "SourceBank" → database-field "source_bank_id" met LOOKUP transform.';
 
 
-- =============================================================================
-- STANDAARD INITIËLE DATA
-- =============================================================================
 
-- Standaard admin-gebruiker (wachtwoord: admin123)
INSERT INTO users (username, password_hash, email, role, is_active)
VALUES (
    'admin',
    '$2b$12$J/120E5OgYi7EbDsrJ8H5e4pGCJnfzZAYfGg5WBIuv4TTwaUcvtbW',
    'admin@eod-settlement.local',
    'ADMIN',
    TRUE
)
ON CONFLICT (username) DO NOTHING;
 
-- Standaard notificatie-instellingen
INSERT INTO notification_settings (email_recipients, notify_on_success, notify_on_failure, smtp_configured)
SELECT '[]', FALSE, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM notification_settings);
 
-- Standaard cut-off schema
INSERT INTO cutoff_schedules (cutoff_time, is_auto_enabled)
SELECT '16:00', FALSE
WHERE NOT EXISTS (SELECT 1 FROM cutoff_schedules);
 
-- =============================================================================
-- EINDE SCHEMA
-- =============================================================================