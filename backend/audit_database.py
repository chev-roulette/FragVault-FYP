import os

import psycopg
from psycopg.rows import dict_row


AUDIT_DATABASE_URL = os.getenv("AUDIT_DATABASE_URL")


def get_audit_connection():
    if not AUDIT_DATABASE_URL:
        raise RuntimeError("AUDIT_DATABASE_URL is not configured.")

    return psycopg.connect(
        AUDIT_DATABASE_URL,
        row_factory=dict_row,
    )


def initialise_audit_database():
    create_table_query = """
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

    create_date_index_query = """
        CREATE INDEX IF NOT EXISTS idx_attack_event_created_at
        ON attack_event_logs (created_at DESC);
    """

    with get_audit_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(create_table_query)
            cursor.execute(create_date_index_query)

        connection.commit()