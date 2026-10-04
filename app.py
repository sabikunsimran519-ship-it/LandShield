from flask import Flask, jsonify
import sqlite3

app = Flask(__name__)

DATABASE = "landshield.db"


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/")
def home():
    return jsonify({
        "message": "LandShield API is running!"
    })


@app.route("/api/lands")
def get_lands():
    conn = get_db()

    lands = conn.execute(
        "SELECT * FROM land"
    ).fetchall()

    conn.close()

    return jsonify([dict(land) for land in lands])


if __name__ == "__main__":
    app.run(debug=True)