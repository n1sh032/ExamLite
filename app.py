from flask import Flask, render_template, request, jsonify
from datetime import datetime
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

    return jsonify({"message": "saved"})


@app.route("/get_subjects")
def get_subjects():

    file = "data/subjects.json"

    if os.path.exists(file):
        with open(file, "r") as f:
            subjects = json.load(f)
    else:
        subjects = []

    return jsonify(subjects)


@app.route("/delete_subject", methods=["POST"])
def delete_subject():

    data = request.json
    index = data["index"]

    file = "data/subjects.json"

    with open(file, "r") as f:
        subjects = json.load(f)

    subjects.pop(index)

    with open(file, "w") as f:
        json.dump(subjects, f, indent=4)

    return jsonify({"message": "deleted"})


@app.route("/study_plan")
def study_plan():

    file = "data/subjects.json"

    if os.path.exists(file):
        with open(file, "r") as f:
            subjects = json.load(f)
    else:
        subjects = []

    plans = []

    for s in subjects:

        hrs = 2

        if s["priority"] == "High":
            hrs += 4
        elif s["priority"] == "Medium":
            hrs += 2

        try:
            exam_date = datetime.strptime(s["exam"], "%Y-%m-%d")
            days_left = (exam_date - datetime.now()).days

            if days_left <= 7:
                hrs += 8
            elif days_left <= 14:
                hrs += 4

        except:
            pass

        plans.append({
            "subject": s["subject"],
            "hours": hrs
        })

    return jsonify(plans)


if __name__ == "__main__":
    app.run(debug=True)