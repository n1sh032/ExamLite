let btn = document.getElementById("addBtn");

btn.addEventListener("click", function(){

    let subject = document.getElementById("subject").value;
    let cu = document.getElementById("cu").value;
    let priority = document.getElementById("priority").value;
    let exam = document.getElementById("exam").value;

    if(subject == "" || cu == "" || exam == ""){
        alert("Fill in all fields");
        return;
    }

    fetch("/add_subject", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
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
        alert("Subject Saved");

        document.getElementById("subject").value = "";
        document.getElementById("cu").value = "";
        document.getElementById("exam").value = "";
    });

});