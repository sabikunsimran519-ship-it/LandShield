import sqlite3
import re
from pathlib import Path

from flask import Flask, jsonify

app = Flask(__name__)

DATABASE = Path(__file__).with_name("landshield.db")


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def find_land(land_id):
    """Look up either the numeric primary key or the public land_id."""
    conn = get_db()
    try:
        if land_id.isdecimal():
            return conn.execute("SELECT * FROM land WHERE id = ?", (int(land_id),)).fetchone()
        return conn.execute("SELECT * FROM land WHERE land_id = ?", (land_id,)).fetchone()
    finally:
        conn.close()


def risk_level(score):
    return "LOW" if score <= 30 else "MEDIUM" if score <= 60 else "HIGH"


def category(score, status, explanation):
    return {"score": score, "level": risk_level(score), "status": status, "explanation": explanation}


def stored_status(value):
    return str(value or "").strip().lower()


def calculate_risk(land):
    """Deterministic screening based only on fields in the land table."""
    mutation = stored_status(land["mutation_status"])
    if not str(land["owner_name"] or "").strip() or mutation in {"conflict", "rejected"}:
        ownership = category(90, mutation or "missing", "Owner or mutation information indicates a conflict or is missing.")
    elif mutation in {"pending", "no", "not done", "not verified"}:
        ownership = category(60, mutation, "Mutation is not complete; ownership requires verification.")
    elif mutation in {"yes", "done", "complete", "completed", "verified"}:
        ownership = category(10, mutation, "Mutation is recorded as complete; verify ownership with official records.")
    else:
        ownership = category(50, mutation or "unknown", "Mutation status is unclear; verify ownership with official records.")

    missing = [name for name, present in (
        ("khatian number", bool(str(land["khatian_no"] or "").strip())),
        ("dag number", bool(str(land["dag_no"] or "").strip())),
        ("land area", land["land_size"] is not None and land["land_size"] > 0),
    ) if not present]
    if missing:
        document = category(70 if len(missing) == 1 else 90, "FURTHER VERIFICATION REQUIRED",
                            "Missing or invalid stored identifier: " + ", ".join(missing) + ".")
    else:
        document = category(30, "SCREENING PASSED",
                            "Khatian, dag and land area are recorded; document authenticity has not been verified.")

    dispute_status = stored_status(land["dispute_status"])
    if dispute_status in {"yes", "active", "disputed", "pending"}:
        dispute = category(90, dispute_status, "Active or pending dispute indicator detected.")
    elif dispute_status in {"resolved", "previous", "closed"}:
        dispute = category(50, dispute_status, "A previous dispute is recorded; confirm its resolution.")
    elif dispute_status in {"no", "none", "clear"}:
        dispute = category(10, dispute_status, "No dispute indicator is recorded.")
    else:
        dispute = category(50, dispute_status or "unknown", "Dispute status is unclear; verify with official records.")

    acquisition_status = stored_status(land["acquisition_status"])
    if acquisition_status in {"yes", "active", "acquired", "under acquisition"}:
        acquisition = category(90, acquisition_status, "Government acquisition indicator detected.")
    elif acquisition_status in {"pending", "potential", "proposed"}:
        acquisition = category(60, acquisition_status, "Potential acquisition indicator requires verification.")
    elif acquisition_status in {"no", "none", "clear"}:
        acquisition = category(10, acquisition_status, "No acquisition indicator is recorded.")
    else:
        acquisition = category(50, acquisition_status or "unknown", "Acquisition status is unclear; verify with official records.")

    khas_status = stored_status(land["khas_status"])
    if khas_status in {"yes", "active", "khas"}:
        khas = category(90, khas_status, "Khas land indicator detected.")
    elif khas_status in {"no", "none", "clear"}:
        khas = category(10, khas_status, "No khas land indicator is recorded.")
    else:
        khas = category(50, khas_status or "unknown", "Khas land status is unclear; verify with official records.")

    categories = {"ownership": ownership, "documents": document, "dispute": dispute,
                  "acquisition": acquisition, "khas": khas}
    # Weights total 100%. Half points round up to a whole-number score.
    weights = {"ownership": 25, "documents": 20, "dispute": 25, "acquisition": 15, "khas": 15}
    overall = (sum(categories[name]["score"] * weight for name, weight in weights.items()) + 50) // 100
    main_risks = [item["explanation"] for item in categories.values() if item["score"] >= 60]
    critical = any(categories[name]["score"] >= 90 for name in ("dispute", "acquisition", "khas"))
    if overall > 60 or critical:
        screening_result = "HIGH RISK - DO NOT PROCEED UNTIL VERIFIED"
    elif overall > 30 or main_risks:
        screening_result = "FURTHER VERIFICATION REQUIRED"
    else:
        screening_result = "LOW-RISK SCREENING RESULT"
    return {
        "land_id": land["id"],
        "public_land_id": land["land_id"],
        "overall_score": overall,
        "risk_level": risk_level(overall),
        "ownership_risk": ownership["score"],
        "document_risk": document["score"],
        "dispute_risk": dispute["score"],
        "acquisition_risk": acquisition["score"],
        "khas_risk": khas["score"],
        "categories": categories,
        "main_risks": main_risks,
        "screening_result": screening_result,
        "explanation": " ".join(main_risks) if main_risks else "No major indicators in stored fields; verify with official records.",
    }


def check_documents(land):
    """Check stored land information, not document authenticity."""
    checks = {}
    warnings = []
    missing_required = 0

    for name, column in (("khatian", "khatian_no"), ("dag", "dag_no")):
        present = bool(str(land[column] or "").strip())
        checks[name] = {
            "status": "PASS" if present else "FAIL",
            "value_present": present,
            "message": f"{name.capitalize()} information is recorded." if present else f"{name.capitalize()} information is missing.",
        }
        if not present:
            missing_required += 1
            warnings.append(checks[name]["message"])

    area_present = land["land_size"] is not None
    area_valid = area_present and land["land_size"] > 0
    checks["land_area"] = {
        "status": "PASS" if area_valid else "FAIL",
        "value_present": area_present,
        "valid": area_valid,
        "message": "Land area is recorded and greater than zero." if area_valid else "Land area is missing or invalid.",
    }
    if not area_valid:
        missing_required += 1
        warnings.append(checks["land_area"]["message"])

    owner_present = bool(str(land["owner_name"] or "").strip())
    mutation = stored_status(land["mutation_status"])
    if not owner_present:
        owner_status = "FAIL"
        owner_message = "Owner name is missing; further verification is required."
    elif mutation in {"conflict", "rejected"}:
        owner_status = "FAIL"
        owner_message = "Mutation status indicates a conflict or rejection; further verification is required."
    elif mutation in {"yes", "done", "complete", "completed", "verified"}:
        owner_status = "PASS"
        owner_message = "Owner name and completed mutation status are recorded; confirm with official records."
    else:
        owner_status = "REVIEW"
        owner_message = "Mutation is not recorded as complete; further verification is required."
    checks["ownership"] = {
        "status": owner_status,
        "owner_name_present": owner_present,
        "mutation_status": mutation or "unknown",
        "message": owner_message,
    }
    if owner_status != "PASS":
        warnings.append(owner_message)

    # Two missing core identifiers, or a missing owner, prevent useful screening.
    if missing_required >= 2 or owner_status == "FAIL":
        verification_status = "SCREENING FAILED"
    elif missing_required or owner_status == "REVIEW":
        verification_status = "PARTIAL - FURTHER VERIFICATION REQUIRED"
    else:
        verification_status = "SCREENING PASSED"

    return {
        "land_id": land["id"],
        "public_land_id": land["land_id"],
        "verification_status": verification_status,
        "screening_only": True,
        "message": "Screening only - official/legal document verification is still required.",
        "checks": checks,
        "warnings": warnings,
    }


def analyze_land(land):
    """Explain existing screening results without adding facts or calling an AI API."""
    risk = calculate_risk(land)
    documents = check_documents(land)
    scores = risk["categories"]
    key_risks = list(risk["main_risks"])
    actions = []

    if scores["ownership"]["score"] >= 31:
        actions.append("Verify ownership and mutation records before proceeding.")
    if scores["dispute"]["score"] >= 61:
        actions.append("Independently verify the current dispute status and its resolution before purchase.")
    elif scores["dispute"]["score"] >= 31:
        actions.append("Confirm the recorded dispute status with the appropriate authority.")
    if documents["verification_status"] != "SCREENING PASSED":
        key_risks.append("Document information or mutation status requires further verification.")
        actions.append("Check the original khatian, dag and related land records.")
    if scores["acquisition"]["score"] >= 31:
        actions.append("Verify whether any acquisition notice or project affects the land.")
    if scores["khas"]["score"] >= 31:
        actions.append("Verify land classification and khas status in official records.")
    if not actions:
        actions.append("Complete normal document and ownership verification before purchase.")

    if scores["dispute"]["score"] >= 61:
        recommendation = "Do not proceed until the dispute status is independently verified and resolved."
    elif risk["screening_result"].startswith("HIGH RISK"):
        recommendation = "Do not proceed until the major risk indicators have been verified and resolved."
    elif risk["risk_level"] == "MEDIUM" or documents["verification_status"] != "SCREENING PASSED":
        recommendation = "Further verification is recommended before making a purchase decision."
    else:
        recommendation = "Proceed only after normal document and ownership verification."

    if risk["main_risks"]:
        summary = (f"Overall screening risk is {risk['risk_level'].lower()} ({risk['overall_score']}/100). "
                   + " ".join(risk["main_risks"]))
    else:
        summary = (f"Overall screening risk is {risk['risk_level'].lower()} ({risk['overall_score']}/100). "
                   "No major indicators were detected in the stored fields.")
    summary += (" Document screening requires further verification." if documents["verification_status"] != "SCREENING PASSED"
                else " Stored document information is present, but official verification is still required.")

    return {
        "land_id": land["id"],
        "public_land_id": land["land_id"],
        "analysis_type": "RULE-BASED AI-STYLE SCREENING",
        "overall_risk": {"score": risk["overall_score"], "level": risk["risk_level"]},
        "summary": summary,
        "key_risks": key_risks,
        "document_assessment": {
            "status": documents["verification_status"],
            "warnings": documents["warnings"],
        },
        "recommended_actions": actions,
        "recommendation": recommendation,
        "disclaimer": "Decision-support screening only; this is not legal advice or official government verification.",
    }


def validate_land_id(land_id):
    return bool(re.fullmatch(r"[A-Za-z0-9_-]{1,64}", land_id)) and land_id != "0"


@app.route("/")
def home():
    return jsonify({
        "message": "LandShield API is running!"
    })


@app.route("/api/lands")
def get_lands():
    conn = get_db()
    try:
        lands = conn.execute("SELECT * FROM land").fetchall()
    finally:
        conn.close()
    return jsonify([dict(land) for land in lands])


@app.route("/api/lands/<land_id>")
def get_land(land_id):
    if not validate_land_id(land_id):
        return jsonify({"error": "Invalid land ID."}), 400
    land = find_land(land_id)
    if land is None:
        return jsonify({"error": "Land not found."}), 404
    return jsonify(dict(land))


@app.route("/api/lands/<land_id>/risk")
def get_land_risk(land_id):
    if not validate_land_id(land_id):
        return jsonify({"error": "Invalid land ID."}), 400
    land = find_land(land_id)
    if land is None:
        return jsonify({"error": "Land not found."}), 404
    return jsonify(calculate_risk(land))


@app.route("/api/lands/<land_id>/documents")
def get_land_documents(land_id):
    if not validate_land_id(land_id):
        return jsonify({"error": "Invalid land ID."}), 400
    land = find_land(land_id)
    if land is None:
        return jsonify({"error": "Land not found."}), 404
    return jsonify(check_documents(land))


@app.route("/api/lands/<land_id>/ai-analysis")
def get_land_ai_analysis(land_id):
    if not validate_land_id(land_id):
        return jsonify({"error": "Invalid land ID."}), 400
    land = find_land(land_id)
    if land is None:
        return jsonify({"error": "Land not found."}), 404
    return jsonify(analyze_land(land))


@app.route("/api/lands/<land_id>/location")
def get_land_location(land_id):
    if not validate_land_id(land_id):
        return jsonify({"error": "Invalid land ID."}), 400
    land = find_land(land_id)
    if land is None:
        return jsonify({"error": "Land not found."}), 404

    is_demo = land["land_id"] == "DEMO-001" and land["latitude"] is not None and land["longitude"] is not None
    has_coordinates = land["latitude"] is not None and land["longitude"] is not None
    accuracy = "DEMO / APPROXIMATE" if is_demo else "UNVERIFIED" if has_coordinates else "NOT AVAILABLE"
    note = ("This coordinate is for demonstration only and does not represent an official land parcel location."
            if is_demo else "No coordinates are recorded for this land."
            if not has_coordinates else "These coordinates have not been verified as an official land parcel location.")
    return jsonify({
        "land_id": land["id"],
        "public_land_id": land["land_id"],
        "location": {
            "latitude": land["latitude"],
            "longitude": land["longitude"],
            "district": land["district"],
            "upazila": land["upazila"],
            "mouza": land["mouza"],
            "accuracy": accuracy,
        },
        "map_note": note,
    })


@app.errorhandler(sqlite3.Error)
def handle_database_error(error):
    app.logger.error("Database error: %s", error)
    return jsonify({"error": "Database temporarily unavailable."}), 503


if __name__ == "__main__":
    app.run(debug=True)
