from typing import Any

from audit_database import get_audit_connection


def record_attack_event(
    scenario_id: str,
    action: str,
    outcome: str,
    severity: str = "INFO",
    target: str | None = None,
    fragments_exposed: int = 0,
    reconstruction_possible: bool = False,
    metadata: dict[str, Any] | None = None,
) -> dict:
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
        VALUES (
            %(scenario_id)s,
            %(action)s,
            %(target)s,
            %(severity)s,
            %(outcome)s,
            %(fragments_exposed)s,
            %(reconstruction_possible)s,
            %(event_metadata)s
        )
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

    values = {
        "scenario_id": scenario_id,
        "action": action,
        "target": target,
        "severity": severity,
        "outcome": outcome,
        "fragments_exposed": fragments_exposed,
        "reconstruction_possible": reconstruction_possible,
        "event_metadata": metadata or {},
    }

    with get_audit_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            event = cursor.fetchone()

        connection.commit()

    return dict(event)


def get_recent_attack_events(limit: int = 50) -> list[dict]:
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
            created_at
        FROM attack_event_logs
        ORDER BY created_at DESC
        LIMIT %(limit)s;
    """

    with get_audit_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, {"limit": safe_limit})
            events = cursor.fetchall()

    return [
        {
            **dict(event),
            "timestamp": event["created_at"].isoformat(),
        }
        for event in events
    ]