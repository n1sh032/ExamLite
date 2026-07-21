var btn = document.getElementById('addBtn');
var cancelBtn = document.getElementById('cancelBtn');
var planBtn = document.getElementById('planBtn');
var resetBtn = document.getElementById('resetBtn');
var messageBox = document.getElementById('messageBox');
var editingIndex = null;

loadSubjects();

btn.addEventListener('click', function() {
    var data = getFormData();
    var errors = validateForm(data);
    if (errors.length) {
        showMessage(errors.join(' '), 'warning');
        return;
    }
    if (editingIndex === null) {
        saveSubject('/add_subject', data, 'Subject added.');
    } else {
        saveSubject('/edit_subject', {index: editingIndex, subject: data.subject, cu: data.cu, priority: data.priority, exam: data.exam}, 'Subject updated.');
    }
});

cancelBtn.addEventListener('click', resetForm);

planBtn.addEventListener('click', function() {
    fetch('/study_plan')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        var box = document.getElementById('planBox');
        box.innerHTML = '';
        if (!data.length) {
            box.innerHTML = "<p class='empty'>Add a subject first.</p>";
            return;
        }
        data.forEach(function(item) {
            var label = item.hours > 0 ? item.hours + ' hrs/week' : 'Review overdue subject';
            box.innerHTML += '<div class="plan-item"><div class="plan-title">' + item.subject + '</div>' +
                (item.status ? '<div class="small-text">' + item.status + '</div>' : '') +
                '<div><strong>' + label + '</strong></div></div>';
        });
    });
});

resetBtn.addEventListener('click', function() {
    if (!confirm('Remove all subjects?')) return;
    fetch('/reset_subjects', { method: 'POST' })
    .then(function() { resetForm(); loadSubjects(); document.getElementById('planBox').innerHTML = ''; showMessage('Reset done', 'info'); });
});

function getFormData() {
    return {
        subject: document.getElementById('subject').value.trim(),
        cu: document.getElementById('cu').value.trim(),
        priority: document.getElementById('priority').value,
        exam: document.getElementById('exam').value
    };
}

function validateForm(data) {
    var errors = [];
    if (!data.subject) errors.push('Subject name is required.');
    var cu = parseInt(data.cu, 10);
    if (Number.isNaN(cu) || cu <= 0) errors.push('Credit units must be a positive number.');
    if (!data.exam) errors.push('Exam date is required.');
    else {
        var d = new Date(data.exam);
        if (Number.isNaN(d.getTime())) errors.push('Exam date must be a valid date.');
    }
    return errors;
}

function saveSubject(url, body, msg) {
    fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) })
    .then(function(res) { return res.json().then(function(data) { return {ok: res.ok, body: data}; }); })
    .then(function(result) {
        if (!result.ok) throw new Error((result.body.errors||[]).join(' ') || result.body.message || 'Error');
        resetForm(); loadSubjects(); showMessage(msg, 'info');
    }).catch(function(err) { showMessage(err.message, 'warning'); });
}

function resetForm() {
    editingIndex = null;
    document.getElementById('subject').value = '';
    document.getElementById('cu').value = '';
    document.getElementById('priority').value = 'High';
    document.getElementById('exam').value = '';
    btn.textContent = 'Add Subject';
    cancelBtn.style.display = 'none';
}

function showMessage(txt, type) {
    type = type || 'info';
    messageBox.textContent = txt;
    messageBox.className = 'message ' + type;
    messageBox.style.display = 'block';
    clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = setTimeout(function() { messageBox.style.display = 'none'; }, 4000);
}

function getDaysUntil(dateString) {
    var d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return null;
    return Math.ceil((d - new Date()) / (1000*60*60*24));
}

function loadSubjects() {
    fetch('/get_subjects')
    .then(function(res){ return res.json(); })
    .then(function(data){
        var list = document.getElementById('subjectList');
        list.innerHTML = '';
        var highCount = 0;
        var nearestExam = null;
        var nearestDays = null;
        if (!data.length) {
            list.innerHTML = '<p class="empty">No subjects yet.</p>';
        }
        data.forEach(function(item, index) {
            if (item.priority === 'High') highCount++;
            var daysUntil = getDaysUntil(item.exam);
            if (daysUntil !== null && (nearestDays === null || daysUntil < nearestDays)) {
                nearestDays = daysUntil;
                nearestExam = item.exam;
            }
            var examText = daysUntil === null ? 'No exam date' : (daysUntil < 0 ? 'Past due ' + Math.abs(daysUntil) + ' day(s)' : 'In ' + daysUntil + ' day(s)');
            list.innerHTML += '<div class="card"><div class="card-head"><strong>' + item.subject + '</strong><span class="tag ' + item.priority.toLowerCase() + '">' + item.priority + '</span></div>' +
                '<div>CU: ' + item.cu + '</div><div>Exam: ' + (item.exam || 'Not set') + '</div><div class="small-text">' + examText + '</div>' +
                '<div class="card-actions"><button class="secondary" onclick="editSub(' + index + ')">Edit</button><button class="deleteBtn" onclick="delSub(' + index + ')">Delete</button></div></div>';
        });
        document.getElementById('totalSubjects').innerText = data.length;
        document.getElementById('highSubjects').innerText = highCount;
        document.getElementById('nearestExam').innerText = nearestExam ? (nearestDays >= 0 ? nearestExam + ' ('+nearestDays+' day'+(nearestDays === 1? '':'s')+')' : nearestExam + ' (past due)') : 'None';
    });
}

function delSub(i) {
    fetch('/delete_subject', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ index:i }) })
    .then(function(res){ return res.json().then(function(data){ return {ok:res.ok, body:data}; }); })
    .then(function(result){
        if (!result.ok) throw new Error(result.body.message || 'Unable to delete');
        loadSubjects(); showMessage('Subject removed.', 'info');
    }).catch(function(err){ showMessage(err.message, 'warning'); });
}

window.editSub = function(index) {
    fetch('/get_subjects')
    .then(function(res){ return res.json(); })
    .then(function(data){
        var item = data[index];
        if (!item) { showMessage('Subject not found.', 'warning'); return; }
        editingIndex = index;
        document.getElementById('subject').value = item.subject;
        document.getElementById('cu').value = item.cu;
        document.getElementById('priority').value = item.priority;
        document.getElementById('exam').value = item.exam;
        btn.textContent = 'Save Changes';
        cancelBtn.style.display = 'inline-block';
        window.scrollTo(0,0);
    });
};
