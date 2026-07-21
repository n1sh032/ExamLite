let btn = document.getElementById("addBtn");

loadSubjects();

btn.addEventListener("click", function () {

    let subject = document.getElementById("subject").value;
    let cu = document.getElementById("cu").value;
    let priority = document.getElementById("priority").value;
    let exam = document.getElementById("exam").value;

    if (subject == "" || cu == "" || exam == "") {
        alert("Fill in all fields");
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
    .then(data => {

        document.getElementById("subject").value = "";
        document.getElementById("cu").value = "";
        document.getElementById("exam").value = "";

        loadSubjects();
    });

});


function loadSubjects() {

    fetch("/get_subjects")
    .then(response => response.json())
    .then(data => {

        let list = document.getElementById("subjectList");

        list.innerHTML = "";

        for (let i = 0; i < data.length; i++) {

            list.innerHTML +=
                "<b>" + data[i].subject + "</b><br>" +
                "CU: " + data[i].cu + "<br>" +
                "Priority: " + data[i].priority + "<br>" +
                "Exam: " + data[i].exam + "<br>" +
                "<button onclick='delSub(" + i + ")'>Delete</button>" +
                "<hr>";
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
    .then(data => {
        loadSubjects();
    });

}