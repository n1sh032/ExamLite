from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json, os, math

app = Flask(__name__)
DATA_FILE = "data/subjects.json"

def load_subjects():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_subjects(subjects):
    with open(DATA_FILE, "w") as f:
        json.dump(subjects, f, indent=4)

def validate_data(data):
    errors = []
    subject = str(data.get("subject", "")).strip()
    cu = data.get("cu", "")
    priority = str(data.get("priority", "Low")).strip()
    exam = str(data.get("exam", "")).strip()

    if not subject:
        errors.append("Subject name is required")

    try:
        cu_int = int(cu)
        if cu_int <= 0:
            errors.append("Credit units must be positive")
    except Exception:
        errors.append("Credit units must be a valid number")
        cu_int = 1

    if priority not in ("High", "Medium", "Low"):
        errors.append("Priority must be High, Medium, or Low")

    if not exam:
        errors.append("Exam date is required")
    else:
        try:
            datetime.strptime(exam, "%Y-%m-%d")
        except Exception:
            errors.append("Exam date must be YYYY-MM-DD")

    return errors, {"subject": subject, "cu": cu_int, "priority": priority, "exam": exam}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/add_subject", methods=["POST"])
def add_subject():
    data = request.json or {}
    errors, subject = validate_data(data)
    if errors:
        return jsonify({"message": "invalid input", "errors": errors}), 400

    subjects = load_subjects()
    subjects.append(subject)
    save_subjects(subjects)
    return jsonify({"message": "saved", "subject": subject})

@app.route("/edit_subject", methods=["POST"])
def edit_subject():
    data = request.json or {}
    index = data.get("index")
    if not isinstance(index, int):
        return jsonify({"message": "invalid index"}), 400

    errors, subject = validate_data(data)
    if errors:
        return jsonify({"message": "invalid input", "errors": errors}), 400

    subjects = load_subjects()
    if index < 0 or index >= len(subjects):
        return jsonify({"message": "invalid index"}), 400

    subjects[index] = subject
    save_subjects(subjects)
    return jsonify({"message": "updated", "subject": subject})

@app.route("/delete_subject", methods=["POST"])
def delete_subject():
    data = request.json or {}
    index = data.get("index")
    subjects = load_subjects()
    if not isinstance(index, int) or index < 0 or index >= len(subjects):
        return jsonify({"message": "invalid index"}), 400
    subjects.pop(index)
    save_subjects(subjects)
    return jsonify({"message": "deleted"})

@app.route("/reset_subjects", methods=["POST"])
def reset_subjects():
    save_subjects([])
    return jsonify({"message": "reset"})

@app.route("/get_subjects")
def get_subjects():
    return jsonify(load_subjects())

@app.route("/study_plan")
def study_plan():
    subjects = load_subjects()
    plans = []
    for s in subjects:
        try:
            cu = int(s.get("cu", 1))
        except Exception:
            cu = 1
        hours = max(2, cu * 2)
        priority = s.get("priority", "Low")
        if priority == "High":
            hours += 4
        elif priority == "Medium":
            hours += 2

        exam = s.get("exam", "")
        try:
            exam_date = datetime.strptime(exam, "%Y-%m-%d")
            days_left = (exam_date - datetime.now()).days
            if days_left < 0:
                status = "Past due"
                week_hours = 0
            else:
                week_count = max(1, math.ceil((days_left + 1) / 7))
                if days_left <= 7:
                    hours += 8
                elif days_left <= 14:
                    hours += 4
                status = "Today" if days_left == 0 else "Due in %d day%s" % (days_left, "" if days_left == 1 else "s")
                week_hours = math.ceil(hours / week_count)
        except Exception:
            status = "No exam date"
            days_left = None
            week_hours = hours
        plans.append({
            "subject": s.get("subject", "Unknown"),
            "hours": week_hours,
            "exam": exam,
            "days_left": days_left,
            "priority": priority,
            "status": status
        })
    return jsonify(plans)

if __name__ == "__main__":
    app.run(debug=True)
