from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import math
import os

app = Flask(__name__)
DATA_FILE = "data/subjects.json"


def load_subjects():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []


def save_subjects(subjects):
    with open(DATA_FILE, "w") as f:
        json.dump(subjects, f, indent=4)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/add_subject", methods=["POST"])
def add_subject():
    data = request.json
    subjects = load_subjects()
    subjects.append(data)
    save_subjects(subjects)
    return jsonify({"message": "saved"})


@app.route("/get_subjects")
def get_subjects():
    return jsonify(load_subjects())


@app.route("/delete_subject", methods=["POST"])
def delete_subject():
    data = request.json
    index = data.get("index")
    subjects = load_subjects()

    if not isinstance(index, int) or index < 0 or index >= len(subjects):
        return jsonify({"message": "invalid index"}), 400

    subjects.pop(index)
    save_subjects(subjects)
    return jsonify({"message": "deleted"})


@app.route("/study_plan")
def study_plan():
    subjects = load_subjects()
    plans = []

    for s in subjects:
        try:
            cu = int(s.get("cu", 1))
        except (TypeError, ValueError):
            cu = 1

        hours = max(2, cu * 2)
        priority = s.get("priority", "Low")

        if priority == "High":
            hours += 4
        elif priority == "Medium":
            hours += 2

        exam_value = s.get("exam", "")
        try:
            exam_date = datetime.strptime(exam_value, "%Y-%m-%d")
            delta = exam_date - datetime.now()
            days_left = delta.days

            if days_left < 0:
                status = "Past due"
                weekly_hours = 0
            else:
                weeks_left = max(1, math.ceil((days_left + 1) / 7))
                if days_left <= 7:
                    hours += 8
                elif days_left <= 14:
                    hours += 4

                status = "Today" if days_left == 0 else f"Due in {days_left} day{'s' if days_left != 1 else ''}"
                weekly_hours = math.ceil(hours / weeks_left)

        except ValueError:
            status = "No exam date"
            weekly_hours = hours

        plans.append({
            "subject": s.get("subject", "Unknown"),
            "hours": weekly_hours,
            "exam": exam_value,
            "days_left": days_left,
            "priority": priority,
            "status": status
        })

    return jsonify(plans)


if __name__ == "__main__":
    app.run(debug=True)