# ExamLite

A simple study planner. Add your subjects, exam dates, and priorities, and it works out how many hours a week you should be studying each one.

## What it does

- Add/edit/delete subjects (name, credit units, priority, exam date)
- Dashboard shows total subjects, high priority count, and your next exam
- Auto-generates a weekly study plan — more credit units, higher priority, and closer exam dates all bump up recommended hours
- Reset everything with one button

## Stack

Flask backend, vanilla JS/HTML/CSS frontend, data just saved to a local JSON file (no database).

## Running it

```bash
git clone https://github.com/n1sh032/ExamLite.git
cd ExamLite
pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:5000`.

## Routes

- `GET /` – main page
- `GET /get_subjects` – list subjects
- `POST /add_subject` – add one
- `POST /edit_subject` – edit by index
- `POST /delete_subject` – delete by index
- `POST /reset_subjects` – wipe all
- `GET /study_plan` – get the generated plan

## Notes

There's a stray `requirments.txt` (typo, empty) in the repo alongside the real `requirements.txt` — worth deleting. No license yet either, add one if you care about that.
