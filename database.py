import sqlite3

DATABASE = "landshield.db"


def get_db_connection():
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
            acquisition_status TEXT
        )
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    create_database()
    print("LandShield database created successfully!")