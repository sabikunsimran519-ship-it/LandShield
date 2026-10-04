from flask import Flask

app = Flask(__name__)


@app.route("/")
def home():
    return "LandShield Backend is Running!"


@app.route("/api/test")
def test_api():
    return {
        "status": "success",
        "message": "LandShield API is working!"
    }


if __name__ == "__main__":
    app.run(debug=True)
    