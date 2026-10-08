import sqlite3
from pathlib import Path

DATABASE = Path(__file__).with_name("landshield.db")


def get_db_connection(read_only=False):
    if read_only:
        conn = sqlite3.connect(DATABASE.resolve().as_uri() + "?mode=ro", uri=True)
    else:
        conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def create_database():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS land (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            land_id TEXT UNIQUE NOT NULL,
            owner_name TEXT NOT NULL,
            district TEXT NOT NULL,
            upazila TEXT NOT NULL,
            mouza TEXT,
            khatian_no TEXT,
            dag_no TEXT,
            land_size REAL,
            mutation_status TEXT,
            dispute_status TEXT,
            khas_status TEXT,
            acquisition_status TEXT,
            latitude REAL,
            longitude REAL
        )
    """)

    conn.commit()
    conn.close()




def create_risk_assessments_table():
    """Add assessment history without replacing existing tables or records."""
    conn = get_db_connection()
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS risk_assessments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    land_id INTEGER NOT NULL REFERENCES land(id),
                    risk_score INTEGER NOT NULL,
                    risk_level TEXT NOT NULL,
                    ownership_risk INTEGER,
                    document_risk INTEGER,
                    dispute_risk INTEGER,
                    acquisition_risk INTEGER,
                    khas_risk INTEGER,
                    assessment_type TEXT NOT NULL,
                    note TEXT,
                    created_at TEXT NOT NULL
                )
            """)
    finally:
        conn.close()


if __name__ == "__main__":
    create_database()
    create_risk_assessments_table()
    print("LandShield database created successfully!")
