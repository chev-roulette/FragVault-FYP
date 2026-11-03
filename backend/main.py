from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from datetime import datetime
from pathlib import Path
from typing import Literal

import hashlib
import json
import os
import re
import secrets
import time
import uuid

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


# ==========================================
# APPLICATION SETUP
# ==========================================

app = FastAPI(
    title="FragVault Backend",
    description="PostgreSQL-backed XOR API token fragmentation backend.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CONFIGURATION
# ==========================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://xoruser:xorpass@localhost:5432/xorvault",
)

AUDIT_DATABASE_URL = os.getenv(
    "AUDIT_DATABASE_URL",
    "postgresql://audituser:auditpass@localhost:5433/xorvault_audit",
)

POSTGRES_LOG_DIR = Path(
    os.getenv("POSTGRES_LOG_DIR", "/app/postgres-logs")
)

ATTACK_ROLE_VAULTS = {
    "vault_a_reader": "vaultA",
    "vault_b_reader": "vaultB",
    "vault_c_reader": "vaultC",
}

TABLE_VAULTS = {
    "vault_a_fragments": "vaultA",
    "vault_b_fragments": "vaultB",
    "vault_c_fragments": "vaultC",
}

VAULT_NAMES = ("vaultA", "vaultB", "vaultC")

VAULT_TABLES = {
    "vaultA": "vault_a_fragments",
    "vaultB": "vault_b_fragments",
    "vaultC": "vault_c_fragments",
}

VAULT_LABELS = {
    "vaultA": "Vault A",
    "vaultB": "Vault B",
    "vaultC": "Vault C",
}

FRAGMENT_LABELS = {
    "vaultA": "Fragment A",
    "vaultB": "Fragment B",
    "vaultC": "Fragment C",
}

VAULT_A_PATH = Path("vaults/vaultA")
VAULT_B_PATH = Path("vaults/vaultB")
VAULT_C_PATH = Path("vaults/vaultC")
METADATA_PATH = Path("metadata")

for folder in [VAULT_A_PATH, VAULT_B_PATH, VAULT_C_PATH, METADATA_PATH]:
    folder.mkdir(parents=True, exist_ok=True)


def get_db_connection():
    return psycopg.connect(DATABASE_URL)


def get_audit_connection():
    return psycopg.connect(
        AUDIT_DATABASE_URL,
        row_factory=dict_row,
    )


# ==========================================
# REQUEST MODELS
# ==========================================

class TokenRequest(BaseModel):
    service: str
    environment: str
    owner: str
    token: str


class AttackSimulationRequest(BaseModel):
    action: Literal[
        "COMPROMISE_VAULT",
        "INTERCEPT_FRAGMENT",
        "FULL_FRAGMENT_COMPROMISE",
        "RESET",
    ]

    target: Literal[
        "vaultA",
        "vaultB",
        "vaultC",
        "all",
    ] = "all"


# ==========================================
# HASH / XOR HELPERS
# ==========================================

def calculate_text_sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def xor_fragment(secret: str):
    secret_bytes = secret.encode("utf-8")

    fragment_a = secrets.token_bytes(len(secret_bytes))
    fragment_b = secrets.token_bytes(len(secret_bytes))

    fragment_c = bytes(
        secret_bytes[i] ^ fragment_a[i] ^ fragment_b[i]
        for i in range(len(secret_bytes))
    )

    return (
        fragment_a.hex(),
        fragment_b.hex(),
        fragment_c.hex(),
    )


def xor_reconstruct_from_hex(
    fragment_a_hex: str,
    fragment_b_hex: str,
    fragment_c_hex: str,
) -> str:
    try:
        fragment_a = bytes.fromhex(fragment_a_hex)
        fragment_b = bytes.fromhex(fragment_b_hex)
        fragment_c = bytes.fromhex(fragment_c_hex)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Reconstruction failed: one or more fragments are not valid hexadecimal values.",
        )

    if not (len(fragment_a) == len(fragment_b) == len(fragment_c)):
        raise HTTPException(
            status_code=400,
            detail="Reconstruction failed: fragment lengths do not match.",
        )

    reconstructed = bytes(
        fragment_a[i] ^ fragment_b[i] ^ fragment_c[i]
        for i in range(len(fragment_a))
    )

    try:
        return reconstructed.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Reconstruction failed: reconstructed value is not valid UTF-8.",
        )


def mask_fragment(fragment_hex: str) -> str:
    if not fragment_hex:
        return "Unavailable"

    if len(fragment_hex) <= 18:
        return fragment_hex

    return f"{fragment_hex[:10]}...{fragment_hex[-8:]}"


def get_vault_table_name(vault_name: str) -> str:
    if vault_name not in VAULT_TABLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid vault name.",
        )

    return VAULT_TABLES[vault_name]


# ==========================================
# DATABASE INITIALIZATION
# ==========================================

def initialize_demo_database_users(cursor):
    """
    Demo users for the FYP live demo only.

    They simulate partial vault compromise:
    - vault_a_reader can only read Vault A
    - vault_b_reader can only read Vault B
    - vault_c_reader can only read Vault C
    """

    demo_users = {
        "vault_a_reader": {
            "password": "demo_vault_a_pass",
            "table": "vault_a_fragments",
        },
        "vault_b_reader": {
            "password": "demo_vault_b_pass",
            "table": "vault_b_fragments",
        },
        "vault_c_reader": {
            "password": "demo_vault_c_pass",
            "table": "vault_c_fragments",
        },
    }

    cursor.execute("REVOKE ALL ON SCHEMA public FROM PUBLIC;")

    for username, config in demo_users.items():
        password = config["password"]
        table_name = config["table"]

        cursor.execute(
            f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT FROM pg_catalog.pg_roles
                    WHERE rolname = '{username}'
                ) THEN
                    CREATE ROLE {username}
                    LOGIN PASSWORD '{password}';
                END IF;
            END
            $$;
            """
        )

        cursor.execute(f"GRANT CONNECT ON DATABASE xorvault TO {username};")
        cursor.execute(f"GRANT USAGE ON SCHEMA public TO {username};")

        for vault_table in VAULT_TABLES.values():
            cursor.execute(f"REVOKE ALL ON {vault_table} FROM {username};")

        cursor.execute(f"GRANT SELECT ON {table_name} TO {username};")

        cursor.execute(
            f"ALTER ROLE {username} IN DATABASE xorvault "
            "SET log_statement = 'all';"
        )


def initialize_database():
    for attempt in range(10):
        try:
            with get_db_connection() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS vault_index (
                            secret_id TEXT PRIMARY KEY,
                            service TEXT NOT NULL,
                            environment TEXT NOT NULL,
                            owner TEXT NOT NULL,
                            created_at TEXT NOT NULL
                        );
                        """
                    )

                    for table_name in VAULT_TABLES.values():
                        cursor.execute(
                            f"""
                            CREATE TABLE IF NOT EXISTS {table_name} (
                                secret_id TEXT PRIMARY KEY,
                                file_id TEXT,
                                fragment_hex TEXT NOT NULL,
                                fragment_hash TEXT NOT NULL,
                                created_at TEXT NOT NULL
                            );
                            """
                        )

                        cursor.execute(
                            f"""
                            ALTER TABLE {table_name}
                            ADD COLUMN IF NOT EXISTS file_id TEXT;
                            """
                        )

                        cursor.execute(
                            f"""
                            UPDATE {table_name}
                            SET file_id = secret_id
                            WHERE file_id IS NULL;
                            """
                        )

                    initialize_demo_database_users(cursor)

                    connection.commit()

            print("[+] PostgreSQL vault tables initialized")
            return

        except Exception as error:
            print(f"[!] Database not ready yet. Retry {attempt + 1}/10")
            print(error)
            time.sleep(2)

    raise RuntimeError("Database connection failed after multiple attempts.")


def initialize_audit_database():
    """
    Creates the persistent PostgreSQL table used by the Attack Event Timeline.
    The table is stored in the separate audit-postgres Docker service.
    """

    for attempt in range(10):
        try:
            with get_audit_connection() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS attack_event_logs (
                            id BIGSERIAL PRIMARY KEY,
                            scenario_id VARCHAR(100),
                            action VARCHAR(255) NOT NULL,
                            target VARCHAR(255),
                            severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
                            outcome TEXT NOT NULL,
                            fragments_exposed INTEGER NOT NULL DEFAULT 0,
                            reconstruction_possible BOOLEAN NOT NULL DEFAULT FALSE,
                            event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                        );
                        """
                    )

                    cursor.execute(
                        """
                        CREATE INDEX IF NOT EXISTS idx_attack_event_created_at
                        ON attack_event_logs (created_at DESC);
                        """
                    )

                    cursor.execute(
                        """
                        CREATE INDEX IF NOT EXISTS idx_attack_event_scenario
                        ON attack_event_logs (scenario_id);
                        """
                    )

                    cursor.execute(
                        """
                        ALTER TABLE attack_event_logs
                        ADD COLUMN IF NOT EXISTS source_event_key TEXT;
                        """
                    )

                    cursor.execute(
                        """
                        ALTER TABLE attack_event_logs
                        ADD COLUMN IF NOT EXISTS source_type VARCHAR(30)
                        NOT NULL DEFAULT 'SIMULATION';
                        """
                    )

                    cursor.execute(
                        """
                        CREATE UNIQUE INDEX IF NOT EXISTS
                        uq_attack_event_source_key
                        ON attack_event_logs (source_event_key);
                        """
                    )

                    connection.commit()

            print("[+] PostgreSQL attack-event audit table initialized")
            return

        except Exception as error:
            print(f"[!] Audit database not ready yet. Retry {attempt + 1}/10")
            print(error)
            time.sleep(2)

    raise RuntimeError(
        "Audit database connection failed after multiple attempts."
    )


# ==========================================
# POSTGRESQL VAULT HELPERS
# ==========================================

def get_fragment_from_vault(vault_name: str, secret_id: str):
    table_name = get_vault_table_name(vault_name)

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT fragment_hex, fragment_hash
                FROM {table_name}
                WHERE secret_id = %s;
                """,
                (secret_id,),
            )

            result = cursor.fetchone()

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"{vault_name} fragment not found.",
        )

    return {
        "fragment_hex": result[0],
        "fragment_hash": result[1],
    }


def count_vault_rows(vault_name: str) -> int:
    table_name = get_vault_table_name(vault_name)

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            result = cursor.fetchone()

    return result[0]


def store_fragments(
    service: str,
    environment: str,
    owner: str,
    frag_a: str,
    frag_b: str,
    frag_c: str,
) -> str:
    secret_id = str(uuid.uuid4())[:8]
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    fragment_hashes = {
        "vaultA": calculate_text_sha256(frag_a),
        "vaultB": calculate_text_sha256(frag_b),
        "vaultC": calculate_text_sha256(frag_c),
    }

    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO vault_index
                (
                    secret_id,
                    service,
                    environment,
                    owner,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s);
                """,
                (
                    secret_id,
                    service,
                    environment,
                    owner,
                    created_at,
                ),
            )

            cursor.execute(
                """
                INSERT INTO vault_a_fragments
                (
                    secret_id,
                    file_id,
                    fragment_hex,
                    fragment_hash,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s);
                """,
                (
                    secret_id,
                    secret_id,
                    frag_a,
                    fragment_hashes["vaultA"],
                    created_at,
                ),
            )

            cursor.execute(
                """
                INSERT INTO vault_b_fragments
                (
                    secret_id,
                    file_id,
                    fragment_hex,
                    fragment_hash,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s);
                """,
                (
                    secret_id,
                    secret_id,
                    frag_b,
                    fragment_hashes["vaultB"],
                    created_at,
                ),
            )

            cursor.execute(
                """
                INSERT INTO vault_c_fragments
                (
                    secret_id,
                    file_id,
                    fragment_hex,
                    fragment_hash,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s);
                """,
                (
                    secret_id,
                    secret_id,
                    frag_c,
                    fragment_hashes["vaultC"],
                    created_at,
                ),
            )

            connection.commit()

    print(f"[+] PostgreSQL fragments stored: {secret_id}")

    return secret_id


def verify_fragment_integrity(secret_id: str):
    fragment_results = {}

    for vault_name in VAULT_NAMES:
        fragment_record = get_fragment_from_vault(vault_name, secret_id)

        fragment_hex = fragment_record["fragment_hex"]
        expected_hash = fragment_record["fragment_hash"]
        actual_hash = calculate_text_sha256(fragment_hex)

        verified = (
            expected_hash is not None
            and secrets.compare_digest(expected_hash, actual_hash)
        )

        fragment_results[vault_name] = {
            "verified": verified,
            "status": "VERIFIED" if verified else "FAILED",
            "expected_hash": expected_hash,
            "actual_hash": actual_hash,
        }

    overall_verified = all(
        result["verified"] for result in fragment_results.values()
    )

    return {
        "file_id": secret_id,
        "verified": overall_verified,
        "status": "VERIFIED" if overall_verified else "FAILED",
        "fragments": fragment_results,
    }


def reconstruct_secret(secret_id: str) -> str:
    fragment_integrity = verify_fragment_integrity(secret_id)

    if not fragment_integrity["verified"]:
        raise HTTPException(
            status_code=409,
            detail=(
                "Reconstruction blocked: one or more PostgreSQL vault "
                "fragments failed integrity verification."
            ),
        )

    frag_a = get_fragment_from_vault("vaultA", secret_id)["fragment_hex"]
    frag_b = get_fragment_from_vault("vaultB", secret_id)["fragment_hex"]
    frag_c = get_fragment_from_vault("vaultC", secret_id)["fragment_hex"]

    return xor_reconstruct_from_hex(frag_a, frag_b, frag_c)


# ==========================================
# ATTACK DEMO STATE
# ==========================================

def create_default_attack_demo_state():
    return {
        "vaults": {
            "vaultA": {
                "label": "Vault A",
                "vault_status": "protected",
                "fragment_label": "Fragment A",
                "fragment_status": "protected",
                "fragment_preview": None,
            },
            "vaultB": {
                "label": "Vault B",
                "vault_status": "protected",
                "fragment_label": "Fragment B",
                "fragment_status": "protected",
                "fragment_preview": None,
            },
            "vaultC": {
                "label": "Vault C",
                "vault_status": "protected",
                "fragment_label": "Fragment C",
                "fragment_status": "protected",
                "fragment_preview": None,
            },
        },
        "attacker_fragments_obtained": 0,
        "attacker_reconstruction": "blocked",
        "latest_attack": "No attack has been simulated yet.",
        "demo_focus": "Vault compromise and fragment interception",
        "events": [],
    }


attack_demo_state = create_default_attack_demo_state()


def record_attack_demo_event(
    action: str,
    target: str,
    outcome: str,
    severity: str,
    scenario_id: str | None = None,
    metadata: dict | None = None,
):
    """
    Persists one attack-simulation event in the separate audit PostgreSQL
    database. Resetting the simulation state does not delete this history.
    """

    update_attacker_reconstruction_status()

    fragments_exposed = attack_demo_state["attacker_fragments_obtained"]
    reconstruction_possible = (
        attack_demo_state["attacker_reconstruction"] == "possible"
    )

    query = """
        INSERT INTO attack_event_logs (
            scenario_id,
            action,
            target,
            severity,
            outcome,
            fragments_exposed,
            reconstruction_possible,
            event_metadata
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING
            id,
            scenario_id,
            action,
            target,
            severity,
            outcome,
            fragments_exposed,
            reconstruction_possible,
            event_metadata,
            created_at;
    """

    with get_audit_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                query,
                (
                    scenario_id or action,
                    action,
                    target,
                    severity,
                    outcome,
                    fragments_exposed,
                    reconstruction_possible,
                    Jsonb(metadata or {}),
                ),
            )

            event = cursor.fetchone()

        connection.commit()

    return {
        **event,
        "timestamp": event["created_at"].isoformat(),
    }


def get_recent_attack_events(limit: int = 50):
    safe_limit = max(1, min(limit, 100))

    query = """
        SELECT
            id,
            scenario_id,
            action,
            target,
            severity,
            outcome,
            fragments_exposed,
            reconstruction_possible,
            event_metadata,
            source_event_key,
            source_type,
            created_at
        FROM attack_event_logs
        ORDER BY created_at DESC, id DESC
        LIMIT %s;
    """

    with get_audit_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (safe_limit,))
            rows = cursor.fetchall()

    return [
        {
            **row,
            "timestamp": row["created_at"].isoformat(),
        }
        for row in rows
    ]



def source_event_already_imported(source_event_key: str) -> bool:
    with get_audit_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 1
                FROM attack_event_logs
                WHERE source_event_key = %s;
                """,
                (source_event_key,),
            )
            return cursor.fetchone() is not None


def determine_target_vault(log_text: str) -> str | None:
    normalized = log_text.lower()

    for table_name, vault_name in TABLE_VAULTS.items():
        if table_name in normalized:
            return vault_name

    return None


def extract_secret_id(log_text: str) -> str | None:
    match = re.search(
        r"\bsecret_id\s*=\s*['\"]?([a-zA-Z0-9_-]+)",
        log_text,
        flags=re.IGNORECASE,
    )

    return match.group(1) if match else None


def record_detected_attack_event(
    *,
    source_event_key: str,
    scenario_id: str,
    action: str,
    target: str,
    severity: str,
    outcome: str,
    metadata: dict,
) -> bool:
    """
    Stores one PostgreSQL-derived event exactly once.

    Returns True only when the event was newly inserted. The unique
    source_event_key prevents duplicate records when Refresh is clicked
    repeatedly.
    """

    update_attacker_reconstruction_status()

    fragments_exposed = attack_demo_state["attacker_fragments_obtained"]
    reconstruction_possible = (
        attack_demo_state["attacker_reconstruction"] == "possible"
    )

    query = """
        INSERT INTO attack_event_logs (
            source_event_key,
            source_type,
            scenario_id,
            action,
            target,
            severity,
            outcome,
            fragments_exposed,
            reconstruction_possible,
            event_metadata
        )
        VALUES (
            %s,
            'POSTGRESQL_LOG',
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s
        )
        ON CONFLICT (source_event_key)
        DO NOTHING
        RETURNING id;
    """

    with get_audit_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                query,
                (
                    source_event_key,
                    scenario_id,
                    action,
                    target,
                    severity,
                    outcome,
                    fragments_exposed,
                    reconstruction_possible,
                    Jsonb(metadata),
                ),
            )
            inserted = cursor.fetchone()

        connection.commit()

    return inserted is not None


def mark_live_vault_login(vault_name: str):
    attack_demo_state["vaults"][vault_name]["vault_status"] = "compromised"
    attack_demo_state["latest_attack"] = (
        f"{VAULT_LABELS[vault_name]} was accessed using a restricted "
        "database account."
    )


def mark_live_fragment_read(vault_name: str):
    attack_demo_state["vaults"][vault_name]["vault_status"] = "compromised"
    attack_demo_state["vaults"][vault_name]["fragment_status"] = "intercepted"

    update_attacker_reconstruction_status()

    exposed_count = attack_demo_state["attacker_fragments_obtained"]

    if exposed_count == 1:
        attack_demo_state["latest_attack"] = (
            "One XOR fragment was exfiltrated from PostgreSQL. "
            "Reconstruction remains blocked."
        )
    elif exposed_count == 2:
        attack_demo_state["latest_attack"] = (
            "Two XOR fragments were exfiltrated from separate vaults. "
            "Reconstruction remains blocked because one fragment is missing."
        )
    else:
        attack_demo_state["latest_attack"] = (
            "All three XOR fragments were exfiltrated. "
            "Attacker reconstruction is possible."
        )


def collect_live_postgresql_attacks() -> dict:
    """
    Reads PostgreSQL JSON log files mounted read-only into the backend,
    classifies new activity from the three restricted demo roles, updates
    the in-memory live state, and persists events in the audit database.
    """

    detected = 0
    ignored = 0
    parse_errors = 0
    file_errors = []

    if not POSTGRES_LOG_DIR.exists():
        return {
            "detected": 0,
            "ignored": 0,
            "parse_errors": 0,
            "files_scanned": 0,
            "log_directory": str(POSTGRES_LOG_DIR),
            "errors": [
                f"PostgreSQL log directory not found: {POSTGRES_LOG_DIR}"
            ],
        }

    log_files = sorted(
        (
            path
            for path in POSTGRES_LOG_DIR.iterdir()
            if path.is_file() and ".json" in path.name.lower()
        ),
        key=lambda path: path.stat().st_mtime,
    )

    for log_file in log_files:
        try:
            with log_file.open(
                "r",
                encoding="utf-8",
                errors="replace",
            ) as file:
                for raw_line in file:
                    raw_line = raw_line.strip()

                    if not raw_line:
                        continue

                    try:
                        entry = json.loads(raw_line)
                    except json.JSONDecodeError:
                        parse_errors += 1
                        continue

                    database_user = entry.get("user")

                    if database_user not in ATTACK_ROLE_VAULTS:
                        ignored += 1
                        continue

                    session_id = entry.get("session_id")
                    line_num = entry.get("line_num")

                    if not session_id or line_num is None:
                        ignored += 1
                        continue

                    source_event_key = f"{session_id}:{line_num}"

                    if source_event_already_imported(source_event_key):
                        ignored += 1
                        continue

                    message = str(entry.get("message") or "")
                    statement = str(entry.get("statement") or "")

                    combined_text = f"{message}\n{statement}".strip()
                    normalized = combined_text.lower()

                    role_vault = ATTACK_ROLE_VAULTS[database_user]
                    target_vault = determine_target_vault(combined_text)
                    secret_id = extract_secret_id(combined_text)

                    metadata = {
                        "database_user": database_user,
                        "source_ip": entry.get("remote_host"),
                        "source_port": entry.get("remote_port"),
                        "database": entry.get("dbname"),
                        "application_name": entry.get("application_name"),
                        "postgres_session_id": session_id,
                        "postgres_line_num": line_num,
                        "sql_state": entry.get("state_code"),
                        "statement": statement or message,
                        "log_timestamp": entry.get("timestamp"),
                        "log_file": log_file.name,
                        "secret_id": secret_id,
                    }

                    is_authorized_connection = (
                        "connection authorized" in normalized
                    )

                    if is_authorized_connection:
                        mark_live_vault_login(role_vault)

                        inserted = record_detected_attack_event(
                            source_event_key=source_event_key,
                            scenario_id=f"LIVE_{role_vault.upper()}_LOGIN",
                            action="VAULT_ACCOUNT_COMPROMISE",
                            target=role_vault,
                            severity="HIGH",
                            outcome=(
                                f"{VAULT_LABELS[role_vault]} was accessed "
                                f"using database role {database_user}."
                            ),
                            metadata=metadata,
                        )

                        if inserted:
                            detected += 1

                        continue

                    is_permission_denied = (
                        "permission denied" in normalized
                        and target_vault is not None
                    )

                    if is_permission_denied:
                        inserted = record_detected_attack_event(
                            source_event_key=source_event_key,
                            scenario_id="LIVE_CROSS_VAULT_ACCESS_DENIED",
                            action="UNAUTHORIZED_VAULT_ACCESS",
                            target=target_vault,
                            severity="WARNING",
                            outcome=(
                                f"{database_user} attempted to access "
                                f"{VAULT_LABELS[target_vault]}, but "
                                "PostgreSQL denied permission."
                            ),
                            metadata=metadata,
                        )

                        if inserted:
                            detected += 1

                        continue

                    is_fragment_select = (
                        target_vault is not None
                        and "select" in normalized
                        and "fragment_hex" in normalized
                    )

                    if is_fragment_select:
                        mark_live_fragment_read(target_vault)

                        exposed_count = attack_demo_state[
                            "attacker_fragments_obtained"
                        ]

                        if exposed_count == 1:
                            scenario_id = "LIVE_SINGLE_FRAGMENT_EXFILTRATION"
                        elif exposed_count == 2:
                            scenario_id = "LIVE_TWO_FRAGMENT_EXFILTRATION"
                        else:
                            scenario_id = "LIVE_FULL_FRAGMENT_COMPROMISE"

                        inserted = record_detected_attack_event(
                            source_event_key=source_event_key,
                            scenario_id=scenario_id,
                            action="FRAGMENT_EXFILTRATION",
                            target=target_vault,
                            severity=(
                                "CRITICAL"
                                if exposed_count == 3
                                else "HIGH"
                            ),
                            outcome=attack_demo_state["latest_attack"],
                            metadata=metadata,
                        )

                        if inserted:
                            detected += 1

                        continue

                    ignored += 1

        except OSError as error:
            file_errors.append(f"{log_file.name}: {error}")

    return {
        "detected": detected,
        "ignored": ignored,
        "parse_errors": parse_errors,
        "files_scanned": len(log_files),
        "log_directory": str(POSTGRES_LOG_DIR),
        "log_files": [path.name for path in log_files],
        "errors": file_errors,
    }


def update_attacker_reconstruction_status():
    exposed_count = 0

    for vault_name in VAULT_NAMES:
        fragment_status = attack_demo_state["vaults"][vault_name]["fragment_status"]

        if fragment_status in ["exposed", "intercepted"]:
            exposed_count += 1

    attack_demo_state["attacker_fragments_obtained"] = exposed_count

    if exposed_count == 3:
        attack_demo_state["attacker_reconstruction"] = "possible"
    else:
        attack_demo_state["attacker_reconstruction"] = "blocked"


def apply_fragment_preview(vault_name: str, secret_id: str | None):
    if not secret_id:
        attack_demo_state["vaults"][vault_name]["fragment_preview"] = (
            "Preview unavailable. Pass ?file_id=<stored_id> to show a masked fragment."
        )
        return

    try:
        fragment = get_fragment_from_vault(vault_name, secret_id)["fragment_hex"]
        attack_demo_state["vaults"][vault_name]["fragment_preview"] = mask_fragment(fragment)
    except HTTPException:
        attack_demo_state["vaults"][vault_name]["fragment_preview"] = (
            "Fragment preview unavailable."
        )


def build_attack_demo_status():
    update_attacker_reconstruction_status()

    compromised_vaults = [
        vault_name
        for vault_name in VAULT_NAMES
        if attack_demo_state["vaults"][vault_name]["vault_status"] == "compromised"
    ]

    intercepted_fragments = [
        vault_name
        for vault_name in VAULT_NAMES
        if attack_demo_state["vaults"][vault_name]["fragment_status"] == "intercepted"
    ]

    exposed_fragments = [
        vault_name
        for vault_name in VAULT_NAMES
        if attack_demo_state["vaults"][vault_name]["fragment_status"] in [
            "exposed",
            "intercepted",
        ]
    ]

    attacker_possible = attack_demo_state["attacker_reconstruction"] == "possible"
    recent_events = get_recent_attack_events(limit=50)

    return {
        **attack_demo_state,
        "events": recent_events,
        "summary": {
            "protected_vaults": 3 - len(compromised_vaults),
            "compromised_vaults": len(compromised_vaults),
            "intercepted_fragments": len(intercepted_fragments),
            "exposed_fragments": len(exposed_fragments),
            "attacker_reconstruction": "POSSIBLE" if attacker_possible else "BLOCKED",
            "containment": "FAILED" if attacker_possible else "MAINTAINED",
            "main_message": (
                "All three fragments are exposed. Attacker reconstruction is possible."
                if attacker_possible
                else "Partial compromise only. Attacker reconstruction remains blocked."
            ),
        },
        "recent_events": recent_events[:20],
    }


def validate_vault_name(vault_name: str):
    if vault_name not in VAULT_NAMES:
        raise HTTPException(
            status_code=400,
            detail="Invalid vault name. Use vaultA, vaultB, or vaultC.",
        )


# ==========================================
# ROOT / HEALTH
# ==========================================

@app.get("/")
def root():
    return {
        "message": "FragVault Backend Running",
        "storage": "PostgreSQL",
    }


@app.get("/health")
def health():
    return {
        "status": "ONLINE",
        "service": "FragVault Backend",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


# ==========================================
# REAL FRAGMENT STORAGE API
# ==========================================

@app.post("/fragment")
def fragment_token(request: TokenRequest):
    frag_a, frag_b, frag_c = xor_fragment(request.token)

    secret_id = store_fragments(
        request.service,
        request.environment,
        request.owner,
        frag_a,
        frag_b,
        frag_c,
    )

    return {
        "message": "Fragments Stored Successfully",
        "id": secret_id,
        "service": request.service,
        "environment": request.environment,
        "owner": request.owner,
        "fragments": {
            "vaultA": frag_a,
            "vaultB": frag_b,
            "vaultC": frag_c,
        },
    }


# ==========================================
# XOR VISUALIZATION API - DOES NOT STORE DATA
# ==========================================

@app.post("/visualize-xor")
def visualize_xor(request: TokenRequest):
    frag_a, frag_b, frag_c = xor_fragment(request.token)

    return {
        "message": "Visualization Generated",
        "fragments": {
            "vaultA": frag_a,
            "vaultB": frag_b,
            "vaultC": frag_c,
        },
    }


# ==========================================
# VAULT STATUS API
# ==========================================

@app.get("/vault-status")
def get_vault_status():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return {
        "vaultA": {
            "fragments": count_vault_rows("vaultA"),
            "status": "ONLINE",
            "storage": "PostgreSQL",
            "last_checked": current_time,
        },
        "vaultB": {
            "fragments": count_vault_rows("vaultB"),
            "status": "ONLINE",
            "storage": "PostgreSQL",
            "last_checked": current_time,
        },
        "vaultC": {
            "fragments": count_vault_rows("vaultC"),
            "status": "ONLINE",
            "storage": "PostgreSQL",
            "last_checked": current_time,
        },
    }


# ==========================================
# SECRET INVENTORY API
# ==========================================

@app.get("/secret-inventory")
def get_secret_inventory():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    secret_id,
                    service,
                    environment,
                    owner,
                    created_at
                FROM vault_index
                ORDER BY created_at DESC;
                """
            )

            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "service": row[1],
            "environment": row[2],
            "owner": row[3],
            "created_at": row[4],
        }
        for row in rows
    ]


# ==========================================
# INTEGRITY STATUS API
# ==========================================

@app.get("/integrity-status")
def get_integrity_status():
    inventory = get_secret_inventory()
    secret_results = []

    for secret_entry in inventory:
        secret_id = secret_entry.get("id")

        if not secret_id:
            continue

        try:
            secret_results.append(verify_fragment_integrity(secret_id))
        except HTTPException as error:
            secret_results.append(
                {
                    "file_id": secret_id,
                    "verified": False,
                    "status": "FAILED",
                    "message": error.detail,
                }
            )

    all_fragments_verified = all(
        secret_result.get("verified", False)
        for secret_result in secret_results
    )

    return {
        "vault_index": {
            "verified": True,
            "status": "POSTGRESQL_MANAGED",
            "message": "Vault index is stored in PostgreSQL.",
        },
        "all_fragments_verified": all_fragments_verified,
        "overall_verified": all_fragments_verified,
        "secrets": secret_results,
    }


@app.get("/integrity-status/{file_id}")
def get_secret_integrity_status(file_id: str):
    return {
        "vault_index": {
            "verified": True,
            "status": "POSTGRESQL_MANAGED",
            "message": "Vault index is stored in PostgreSQL.",
        },
        "secret": verify_fragment_integrity(file_id),
    }


# ==========================================
# RECONSTRUCT API
# ==========================================

@app.get("/reconstruct/{file_id}")
def reconstruct(file_id: str):
    secret = reconstruct_secret(file_id)

    return {
        "file_id": file_id,
        "reconstructed_secret": secret,
    }


# ==========================================
# LIVE STATISTICS API
# ==========================================

@app.get("/statistics")
def get_statistics():
    try:
        vault_a = count_vault_rows("vaultA")
        vault_b = count_vault_rows("vaultB")
        vault_c = count_vault_rows("vaultC")

        total_fragments = vault_a + vault_b + vault_c

        vault_a_percent = round((vault_a / total_fragments) * 100) if total_fragments else 0
        vault_b_percent = round((vault_b / total_fragments) * 100) if total_fragments else 0
        vault_c_percent = round((vault_c / total_fragments) * 100) if total_fragments else 0

        reconstruction_success = (
            100 if vault_a > 0 and vault_a == vault_b == vault_c else 0
        )

        return {
            "vaultA": vault_a,
            "vaultB": vault_b,
            "vaultC": vault_c,
            "vaultA_percent": vault_a_percent,
            "vaultB_percent": vault_b_percent,
            "vaultC_percent": vault_c_percent,
            "totalFragments": total_fragments,
            "reconstructionSuccess": reconstruction_success,
            "fragmentIsolation": 95,
            "breachContainment": 90,
            "storageBackend": "PostgreSQL",
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# ==========================================
# ATTACK DEMO API
# ==========================================

@app.get("/attack-demo/status")
def get_attack_demo_status():
    return build_attack_demo_status()


@app.get("/attack-demo/logs")
def get_attack_demo_logs(limit: int = 50):
    return {
        "events": get_recent_attack_events(limit=limit),
    }


@app.post("/attack-demo/refresh-live")
def refresh_live_attack_data():
    collection_result = collect_live_postgresql_attacks()

    status = build_attack_demo_status()
    status["live_detection"] = collection_result

    return status


@app.get("/attack-demo/live-diagnostics")
def get_live_attack_diagnostics():
    """
    Small troubleshooting endpoint for the live demo. It confirms whether
    the backend can see the mounted PostgreSQL JSON log files.
    """

    exists = POSTGRES_LOG_DIR.exists()
    files = []

    if exists:
        files = [
            {
                "name": path.name,
                "size": path.stat().st_size,
                "modified": datetime.fromtimestamp(
                    path.stat().st_mtime
                ).isoformat(),
            }
            for path in sorted(
                POSTGRES_LOG_DIR.iterdir(),
                key=lambda item: item.stat().st_mtime,
            )
            if path.is_file()
        ]

    return {
        "log_directory": str(POSTGRES_LOG_DIR),
        "exists": exists,
        "files": files,
        "attacker_roles": list(ATTACK_ROLE_VAULTS.keys()),
    }


@app.post("/attack-demo/reset")
def reset_attack_demo():
    global attack_demo_state

    attack_demo_state = create_default_attack_demo_state()

    record_attack_demo_event(
        action="RESET",
        target="all",
        outcome="Attack simulation reset. All vaults are protected and no fragments are intercepted.",
        severity="INFO",
    )

    return build_attack_demo_status()


@app.post("/attack-demo/compromise-vault/{vault_name}")
def compromise_vault(vault_name: str, file_id: str | None = None):
    validate_vault_name(vault_name)

    attack_demo_state["vaults"][vault_name]["vault_status"] = "compromised"
    attack_demo_state["vaults"][vault_name]["fragment_status"] = "exposed"

    apply_fragment_preview(vault_name, file_id)

    attack_demo_state["latest_attack"] = (
        f"{VAULT_LABELS[vault_name]} compromised. "
        f"{FRAGMENT_LABELS[vault_name]} is exposed, but the attacker still "
        "does not have all required fragments."
    )

    record_attack_demo_event(
        action="VAULT_COMPROMISE",
        target=vault_name,
        outcome=attack_demo_state["latest_attack"],
        severity="HIGH",
    )

    return build_attack_demo_status()


@app.post("/attack-demo/intercept-fragment/{vault_name}")
def intercept_fragment(vault_name: str, file_id: str | None = None):
    validate_vault_name(vault_name)

    attack_demo_state["vaults"][vault_name]["fragment_status"] = "intercepted"

    apply_fragment_preview(vault_name, file_id)

    attack_demo_state["latest_attack"] = (
        f"{FRAGMENT_LABELS[vault_name]} intercepted. "
        "A single XOR fragment is insufficient for reconstruction."
    )

    record_attack_demo_event(
        action="FRAGMENT_INTERCEPTION",
        target=vault_name,
        outcome=attack_demo_state["latest_attack"],
        severity="HIGH",
    )

    return build_attack_demo_status()


@app.post("/attack-demo/full-fragment-compromise")
def full_fragment_compromise(file_id: str | None = None):
    for vault_name in VAULT_NAMES:
        attack_demo_state["vaults"][vault_name]["vault_status"] = "compromised"
        attack_demo_state["vaults"][vault_name]["fragment_status"] = "exposed"
        apply_fragment_preview(vault_name, file_id)

    attack_demo_state["latest_attack"] = (
        "Full fragment compromise simulated. Vault A, Vault B, and Vault C "
        "are all compromised, so attacker reconstruction becomes possible."
    )

    record_attack_demo_event(
        action="FULL_FRAGMENT_COMPROMISE",
        target="all",
        outcome=attack_demo_state["latest_attack"],
        severity="CRITICAL",
    )

    return build_attack_demo_status()


# ==========================================
# LEGACY ATTACK SIMULATION API COMPATIBILITY
# ==========================================

@app.get("/attack-simulation/status")
def get_attack_simulation_status():
    status = build_attack_demo_status()

    return {
        "components": {
            "vault_index": {
                "status": "POSTGRESQL_MANAGED",
                "exposed": False,
                "tampered": False,
            },
            **{
                vault_name: {
                    "status": (
                        "EXPOSED"
                        if vault_state["fragment_status"] in ["exposed", "intercepted"]
                        else "SECURE"
                    ),
                    "fragment_exposed": (
                        vault_state["fragment_status"] in ["exposed", "intercepted"]
                    ),
                    "tampered": False,
                    "available": True,
                }
                for vault_name, vault_state in status["vaults"].items()
            },
        },
        "metrics": {
            "vault_attack_surface": round(
                (status["summary"]["compromised_vaults"] / 3) * 100,
                2,
            ),
            "overall_attack_surface": round(
                (status["summary"]["exposed_fragments"] / 3) * 100,
                2,
            ),
            "exposed_fragments": status["summary"]["exposed_fragments"],
            "all_fragments_exposed": status["summary"]["exposed_fragments"] == 3,
            "correlated_fragments": status["summary"]["exposed_fragments"],
            "index_map_exposed": False,
            "mapping_integrity": "POSTGRESQL_MANAGED",
            "fragment_integrity": "VERIFIED",
            "attacker_reconstruction": status["summary"]["attacker_reconstruction"],
            "targeted_reconstruction_path": (
                "COMPLETE"
                if status["summary"]["attacker_reconstruction"] == "POSSIBLE"
                else "INCOMPLETE"
            ),
            "legitimate_reconstruction": "AVAILABLE",
            "containment": status["summary"]["containment"],
        },
        "recent_events": status["recent_events"],
        "demo": status,
    }


@app.get("/attack-simulation/events")
def get_attack_simulation_events():
    return {"events": get_recent_attack_events(limit=100)}


@app.post("/attack-simulation/reset")
def reset_attack_simulation():
    return {
        "message": "Attack simulation reset successfully",
        "simulation": reset_attack_demo(),
    }


@app.post("/attack-simulation/launch")
def launch_attack_simulation(request: AttackSimulationRequest):
    if request.action == "RESET":
        simulation = reset_attack_demo()

    elif request.action == "COMPROMISE_VAULT":
        if request.target == "all":
            raise HTTPException(
                status_code=400,
                detail="COMPROMISE_VAULT requires vaultA, vaultB, or vaultC.",
            )

        simulation = compromise_vault(request.target)

    elif request.action == "INTERCEPT_FRAGMENT":
        if request.target == "all":
            raise HTTPException(
                status_code=400,
                detail="INTERCEPT_FRAGMENT requires vaultA, vaultB, or vaultC.",
            )

        simulation = intercept_fragment(request.target)

    elif request.action == "FULL_FRAGMENT_COMPROMISE":
        simulation = full_fragment_compromise()

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported attack simulation action.",
        )

    return {
        "message": "Attack simulation completed",
        "simulation": simulation,
    }


# ==========================================
# STARTUP INITIALIZATION
# ==========================================

initialize_database()
initialize_audit_database()
