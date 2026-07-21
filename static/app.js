const btn = document.getElementById("addBtn");
const planBtn = document.getElementById("planBtn");
const messageBox = document.getElementById("messageBox");

loadSubjects();

btn.addEventListener("click", function () {
    const subject = document.getElementById("subject").value.trim();
    const cu = document.getElementById("cu").value.trim();
    const priority = document.getElementById("priority").value;
    const exam = document.getElementById("exam").value;

    if (!subject || !cu || !exam) {
        showMessage("Please fill in all required fields.", "warning");
        return;
    }

    fetch("/add_subject", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            subject: subject,
            cu: cu,
            priority: priority,
            exam: exam
        })
    })
        .then(response => response.json())
        .then(() => {
            document.getElementById("subject").value = "";
            document.getElementById("cu").value = "";
            document.getElementById("exam").value = "";
            document.getElementById("subject").focus();
            loadSubjects();
            showMessage("Subject added successfully.", "info");
        });
});

planBtn.addEventListener("click", function () {
    fetch("/study_plan")
        .then(response => response.json())
        .then(data => {
            const box = document.getElementById("planBox");
            box.innerHTML = "";

            if (data.length === 0) {
                box.innerHTML = "<p class='empty'>Add a subject first to generate a study recommendation.</p>";
                return;
            }

            data.forEach(item => {
                const hoursLabel = item.hours > 0 ? `${item.hours} hrs/week` : "Review overdue subject";
                const statusLabel = item.status ? `<div class='small-text'>${item.status}</div>` : "";

                box.innerHTML += `
                    <div class='plan-item'>
                        <div class='plan-title'>${item.subject}</div>
                        ${statusLabel}
                        <div><strong>${hoursLabel}</strong></div>
                    </div>
                `;
            });
        });
});

function showMessage(text, type = "info") {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.style.display = "block";
    clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = setTimeout(() => {
        messageBox.style.display = "none";
    }, 4000);
}

function getDaysUntil(dateString) {
    const examDate = new Date(dateString);
    if (Number.isNaN(examDate.getTime())) {
        return null;
    }
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((examDate - new Date()) / msPerDay);
}

function loadSubjects() {
    fetch("/get_subjects")
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById("subjectList");
            list.innerHTML = "";

            let highCount = 0;
            let nearestExam = null;
            let nearestDays = null;

            if (data.length === 0) {
                list.innerHTML = "<p class='empty'>No subjects added yet. Add one above to begin tracking your exam plan.</p>";
            }

            data.forEach((item, index) => {
                if (item.priority === "High") {
                    highCount++;
                }

                const daysUntil = getDaysUntil(item.exam);
                if (daysUntil !== null && (nearestDays === null || daysUntil < nearestDays)) {
                    nearestDays = daysUntil;
                    nearestExam = item.exam;
                }

                const examText = daysUntil === null
                    ? "No exam date"
                    : daysUntil < 0
                        ? `Past due ${Math.abs(daysUntil)} day(s)`
                        : `In ${daysUntil} day(s)`;

                list.innerHTML += `
                    <div class='card'>
                        <div class='card-head'>
                            <strong>${item.subject}</strong>
                            <span class='tag ${item.priority.toLowerCase()}'>${item.priority}</span>
                        </div>
                        <div>CU: ${item.cu}</div>
                        <div>Exam: ${item.exam || "Not set"}</div>
                        <div class='small-text'>${examText}</div>
                        <button class='deleteBtn' onclick='delSub(${index})'>Delete</button>
                    </div>
                `;
            });

            document.getElementById("totalSubjects").innerText = data.length;
            document.getElementById("highSubjects").innerText = highCount;

            if (nearestExam !== null) {
                const nearestText = nearestDays >= 0
                    ? `${nearestExam} (${nearestDays} day${nearestDays === 1 ? "" : "s"})`
                    : `${nearestExam} (past due)`;
                document.getElementById("nearestExam").innerText = nearestText;
            } else {
                document.getElementById("nearestExam").innerText = "None";
            }
        });
}

function delSub(i) {
    fetch("/delete_subject", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            index: i
        })
    })
        .then(response => response.json())
        .then(() => {
            loadSubjects();
            showMessage("Subject removed.", "info");
        });
}
