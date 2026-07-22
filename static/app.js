var addButton = document.getElementById('addBtn');
var cancelButton = document.getElementById('cancelBtn');
var planButton = document.getElementById('planBtn');
var resetButton = document.getElementById('resetBtn');
var messageBox = document.getElementById('messageBox');
var editIndex = null;

var icons = {
    add: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="currentColor"/></svg>',
    edit: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21v-3.75L14.81 5.44a2 2 0 012.83 0l2.92 2.92a2 2 0 010 2.83L8.75 21H3z" fill="currentColor"/></svg>',
    del: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plan: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18M8 3v4M16 3v4M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" fill="currentColor"/></svg>',
    reset: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a9 9 0 11-3.2-6.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function setAddLabel(text) {
    addButton.innerHTML = icons.add + '<span>' + text + '</span>';
}

function setCancelLabel(text) {
    cancelButton.innerHTML = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>' + text + '</span>';
}

// Theme toggle removed - keep single theme
setAddLabel('Add Subject');
setCancelLabel('Cancel Edit');
loadSubjects();

addButton.addEventListener('click', function() {
    var data = getFormData();
    var errors = validateForm(data);
    if (errors.length) {
        showMessage(errors.join(' '), 'warning');
        return;
    }
    if (editIndex === null) {
        saveSubject('/add_subject', data, 'Subject added.');
    } else {
        saveSubject('/edit_subject', {index: editIndex, subject: data.subject, cu: data.cu, priority: data.priority, exam: data.exam}, 'Subject updated.');
    }
});

cancelButton.addEventListener('click', resetForm);

planButton.addEventListener('click', function() {
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

resetButton.addEventListener('click', function() {
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
    editIndex = null;
    document.getElementById('subject').value = '';
    document.getElementById('cu').value = '';
    document.getElementById('priority').value = 'High';
    document.getElementById('exam').value = '';
    setAddLabel('Add Subject');
    setCancelLabel('Cancel Edit');
    cancelButton.style.display = 'none';
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
        var nextExam = null;
        var nextDays = null;
        if (!data.length) {
            list.innerHTML = '<p class="empty">No subjects yet.</p>';
        }
        data.forEach(function(item, index) {
            if (item.priority === 'High') highCount++;
            var daysUntil = getDaysUntil(item.exam);
            if (daysUntil !== null && (nextDays === null || daysUntil < nextDays)) {
                nextDays = daysUntil;
                nextExam = item.exam;
            }
            var examText = daysUntil === null ? 'No exam date' : (daysUntil < 0 ? 'Past due ' + Math.abs(daysUntil) + ' day(s)' : 'In ' + daysUntil + ' day(s)');
            list.innerHTML += '<div class="card"><div class="card-head"><strong>' + item.subject + '</strong><span class="tag ' + item.priority.toLowerCase() + '">' + item.priority + '</span></div>' +
                '<div>CU: ' + item.cu + '</div><div>Exam: ' + (item.exam || 'Not set') + '</div><div class="small-text">' + examText + '</div>' +
                '<div class="card-actions"><button class="secondary" onclick="editSub(' + index + ')">' + icons.edit + ' Edit</button><button class="deleteBtn" onclick="delSub(' + index + ')">' + icons.del + ' Delete</button></div></div>';
        });
        document.getElementById('totalSubjects').innerText = data.length;
        document.getElementById('highSubjects').innerText = highCount;
        document.getElementById('nearestExam').innerText = nextExam ? (nextDays >= 0 ? nextExam + ' (' + nextDays + ' day' + (nextDays === 1 ? '' : 's') + ')' : nextExam + ' (past due)') : 'None';
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
        editIndex = index;
        document.getElementById('subject').value = item.subject;
        document.getElementById('cu').value = item.cu;
        document.getElementById('priority').value = item.priority;
        document.getElementById('exam').value = item.exam;
        setAddLabel('Save Changes');
        cancelButton.style.display = 'inline-block';
        window.scrollTo(0,0);
    });
};
