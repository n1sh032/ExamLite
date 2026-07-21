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

def validate_subject_data(data):
    errs = []
    subject = str(data.get("subject", "")).strip()
    cu = data.get("cu", "")
    priority = str(data.get("priority", "Low")).strip()
    exam = str(data.get("exam", "")).strip()

    if not subject:
        errs.append("Subject name is required")

    try:
        cu_int = int(cu)
        if cu_int <= 0:
            errs.append("Credit units must be positive")
    except Exception:
        errs.append("Credit units must be a valid number")
        cu_int = 1

    if priority not in ("High", "Medium", "Low"):
        errs.append("Priority must be High, Medium, or Low")

    if not exam:
        errs.append("Exam date is required")
    else:
        try:
            datetime.strptime(exam, "%Y-%m-%d")
        except Exception:
            errs.append("Exam date must be YYYY-MM-DD")

    return errs, {"subject": subject, "cu": cu_int, "priority": priority, "exam": exam}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/add_subject", methods=["POST"])
def add_subject():
    data = request.json or {}
    errs, subject = validate_subject_data(data)
    if errs:
        return jsonify({"message": "invalid input", "errors": errs}), 400

    subs = load_subjects()
    subs.append(subject)
    save_subjects(subs)
    return jsonify({"message": "saved", "subject": subject})

@app.route("/edit_subject", methods=["POST"])
def edit_subject():
    data = request.json or {}
    index = data.get("index")
    if not isinstance(index, int):
        return jsonify({"message": "invalid index"}), 400

    errs, subject = validate_subject_data(data)
    if errs:
        return jsonify({"message": "invalid input", "errors": errs}), 400

    subs = load_subjects()
    if index < 0 or index >= len(subs):
        return jsonify({"message": "invalid index"}), 400

    subs[index] = subject
    save_subjects(subs)
    return jsonify({"message": "updated", "subject": subject})

@app.route("/delete_subject", methods=["POST"])
def delete_subject():
    data = request.json or {}
    index = data.get("index")
    subs = load_subjects()
    if not isinstance(index, int) or index < 0 or index >= len(subs):
        return jsonify({"message": "invalid index"}), 400
    subs.pop(index)
    save_subjects(subs)
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
        pri = s.get("priority", "Low")
        if pri == "High":
            hours += 4
        elif pri == "Medium":
            hours += 2

        exam = s.get("exam", "")
        try:
            date = datetime.strptime(exam, "%Y-%m-%d")
            days_left = (date - datetime.now()).days
            if days_left < 0:
                status = "Past due"
                weekly = 0
            else:
                weeks = max(1, math.ceil((days_left + 1) / 7))
                if days_left <= 7:
                    hours += 8
                elif days_left <= 14:
                    hours += 4
                status = "Today" if days_left == 0 else "Due in %d day%s" % (days_left, "" if days_left == 1 else "s")
                weekly = math.ceil(hours / weeks)
        except Exception:
            status = "No exam date"
            days_left = None
            weekly = hours
        plans.append({
            "subject": s.get("subject", "Unknown"),
            "hours": weekly,
            "exam": exam,
            "days_left": days_left,
            "priority": pri,
            "status": status
        })
    return jsonify(plans)

if __name__ == "__main__":
    app.run(debug=True)
