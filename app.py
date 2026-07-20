from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/add_subject", methods=["POST"])
def add_subject():

    data = request.json

    file = "data/subjects.json"

    if os.path.exists(file):
        with open(file, "r") as f:
            subjects = json.load(f)
    else:
        subjects = []

    subjects.append(data)

    with open(file, "w") as f:
        json.dump(subjects, f, indent=4)

    return jsonify({"message":"saved"})

if __name__ == "__main__":
    app.run(debug=True) 