# LandShield

**LandTech 2026 · Digital Land Records, Verification & Digitization · P5 — Citizen Pre-Purchase Verification**

LandShield is a pre-purchase land risk screening and decision-support prototype. It brings recorded demo indicators, a risk score, a mutation timeline, a map preview, hypothetical scenarios, and a printable report together for review before a land purchase.

> LandShield is a decision-support screening prototype using synthetic demo data; it is not official government verification or legal advice.

## Features

- Ownership and document-field screening
- Mutation History timeline
- Pending dispute/case indicator screening
- Khas status screening
- Acquisition status screening
- Overall risk score and category explanations
- Interactive demo map with approximate coordinates and illustrative boundary
- What-If risk simulation
- Consolidated final report with print/save-to-PDF support


## Technology

- Python and Flask backend
- SQLite demo database
- HTML, CSS, and JavaScript frontend
- Node.js built-in HTTP server and API proxy (`server.js`; Express is not used)
- Leaflet map library and OpenStreetMap tiles

## Run locally

Install Python 3 and Node.js 18 or later. From the project root, install the Python dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the Flask API in one terminal:

```bash
python app.py
```

The API listens on `http://127.0.0.1:5000` by default. Start the frontend and `/api` proxy in a second terminal:

```bash
node server.js
```

Open `http://127.0.0.1:3000`. The frontend proxy defaults to `http://127.0.0.1:5000`. `server.js` also reads `BACKEND_URL` and `PORT` environment variables when these need to be changed. The frontend uses browser-loaded Leaflet, fonts, and OpenStreetMap tiles, so those map/asset services need network access.

## API endpoints

- `GET /api/lands`
- `GET /api/lands/<land_id>`
- `GET /api/lands/<land_id>/risk`
- `GET /api/lands/<land_id>/documents`
- `GET /api/lands/<land_id>/mutation-history`
- `GET /api/lands/<land_id>/ai-analysis`
- `GET /api/lands/<land_id>/location`
- `GET /api/lands/<land_id>/what-if`
- `GET /api/lands/<land_id>/report`

## Data, map, and privacy

The local SQLite database contains synthetic demonstration data created for this prototype. The `DEMO-001` and `DEMO-002` records and their mutation timelines, coordinates, illustrative GeoJSON boundary, and terrain values are not real land records or verified government information. No real personal land records, NID numbers, phone numbers, or personal addresses are used.

The map uses Leaflet and OpenStreetMap tiles. Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), distributed under the [Open Database License](https://opendatacommons.org/licenses/odbl/). The displayed point and boundary are approximate/illustrative only and are not an official cadastral boundary.

The prototype does not scrape government portals or make unauthorized requests to government or third-party land systems. Do not add real land records or personal information to the demo database. The local API has no user authentication; keep it on a trusted local development machine and do not expose it as a public service with real data.

## Analysis and AI disclosure

The runtime risk score and “AI-style” analysis are deterministic, rule-based screening over stored demo fields. The application does not call an AI model or claim AI-verified results.

AI coding assistants/LLMs were used during development for code assistance, debugging, documentation, and feature implementation. The team remains responsible for reviewing and understanding the submitted implementation.

## Future deployment

A real-world deployment could integrate with authorized government land-information systems through approved APIs or data-sharing mechanisms, subject to government authorization and applicable security and privacy requirements. Until such access is authorized and implemented, all displayed values must remain identified as prototype screening indicators and require independent verification.
