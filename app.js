// PĒÑDØ CBT PRO

const pages = document.querySelectorAll(".page");

// Show one page and hide the rest
function showPage(pageId){
    pages.forEach(page=>{
        page.style.display="none";
    });
    document.getElementById(pageId).style.display="block";
}

// Loader
window.onload=()=>{
    setTimeout(()=>{
        document.getElementById("loader").style.display="none";
        showPage("home");
    },1500);

    const darkMode = localStorage.getItem("pendo_darkmode") === "true";
    if(darkMode){
        document.body.classList.add("dark-mode");
        const toggle = document.getElementById("darkModeToggle");
        if(toggle) toggle.checked = true;
    }

    const sound = localStorage.getItem("pendo_sound") === "true";
    const soundToggle = document.getElementById("soundToggle");
    if(soundToggle) soundToggle.checked = sound;
};

// ===========================
// Student Registration
// ===========================
document.getElementById("registerBtn")?.addEventListener("click", async ()=>{
    const fullname = document.getElementById("regFullname").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    if(!fullname || !email || !password){
        alert("Fill all fields");
        return;
    }

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({fullname, email, password})
        });
        const data = await res.json();

        if(data.success){
            alert("Registration Successful — please login");
            showPage("login");
        } else {
            alert(data.message);
        }
    } catch(err){
        alert("Server error — try again");
    }
});

// ===========================
// Student Login (Real)
// ===========================
let currentStudent = null;

document.getElementById("loginBtn").addEventListener("click", async ()=>{
    let email=document.getElementById("loginEmail").value;
    let password=document.getElementById("loginPassword").value;

    if(email==="" || password===""){
        alert("Enter Email and Password");
        return;
    }

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({email, password})
        });
        const data = await res.json();

        if(data.success){
            currentStudent = { fullname: data.fullname, email: data.email };
            document.getElementById("profileName").textContent = data.fullname;
            document.getElementById("profileEmail").textContent = data.email;
            alert("Login Successful");
            showPage("dashboard");
        } else {
            alert(data.message);
        }
    } catch(err){
        alert("Server error — try again");
    }
});

// ===========================
// Admin Login (Real)
// ===========================
let isAdmin = false;

document.getElementById("adminLoginBtn")?.addEventListener("click", async ()=>{
    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;

    if(!username || !password){
        alert("Enter username and password");
        return;
    }

    try {
        const res = await fetch("/api/admin-login", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({username, password})
        });
        const data = await res.json();

        if(data.success){
            isAdmin = true;
            alert("Admin Login Successful");
            showPage("adminDashboard");
        } else {
            alert(data.message);
        }
    } catch(err){
        alert("Server error — try again");
    }
});

// ===========================
// Logout
// ===========================
function logout(){
    if(confirm("Logout?")){
        currentStudent = null;
        isAdmin = false;
        showPage("home");
    }
}

// ===========================
// Timer
// ===========================
let minutes=60;
let seconds=0;
let examQuestions = [];
let currentSubject = "";

function startTimer(){
    let timer=setInterval(()=>{
        if(seconds===0){
            if(minutes===0){
                clearInterval(timer);
                alert("Time Up!");
                submitExam();
                return;
            }
            minutes--;
            seconds=59;
        }else{
            seconds--;
        }
        document.getElementById("timer").innerHTML=
        `${minutes}:${seconds<10?"0":""}${seconds}`;
    },1000);
}

// ===========================
// Go to subject picker
// ===========================
document.getElementById("startExamBtn")?.addEventListener("click", ()=>{
    showPage("subjectSelect");
});

// ===========================
// Start Exam for chosen subject
// ===========================
async function startExam(subject){
    try {
        const res = await fetch(`/api/questions?subject=${encodeURIComponent(subject)}`);
        const data = await res.json();

        if(!data.success || data.questions.length === 0){
            alert("No questions available for " + subject + " yet");
            return;
        }

        examQuestions = data.questions;
        currentSubject = subject;
        document.getElementById("examSubjectTitle").textContent = subject + " Exam";
        renderQuestions();
        showPage("exam");
        minutes = 60; seconds = 0;
        startTimer();
    } catch(err){
        alert("Could not load questions");
    }
}

function renderQuestions(){
    const area = document.getElementById("questionArea");
    area.innerHTML = "";

    examQuestions.forEach((q, index)=>{
        const block = document.createElement("div");
        block.className = "question-block";
        block.innerHTML = `
            <p><strong>Q${index+1}:</strong> ${q.question}</p>
            <label><input type="radio" name="q${q.id}" value="A"> ${q.option_a}</label><br>
            <label><input type="radio" name="q${q.id}" value="B"> ${q.option_b}</label><br>
            <label><input type="radio" name="q${q.id}" value="C"> ${q.option_c}</label><br>
            <label><input type="radio" name="q${q.id}" value="D"> ${q.option_d}</label>
        `;
        area.appendChild(block);
    });
}

// ===========================
// Submit Exam — grade + save result
// ===========================
async function submitExam(){
    let score = 0;

    examQuestions.forEach(q=>{
        const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
        if(selected && selected.value === q.answer){
            score++;
        }
    });

    document.getElementById("score").innerHTML = `${score}/${examQuestions.length}`;

    if(currentStudent){
        try {
            await fetch("/api/results/submit", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({
                    student_email: currentStudent.email,
                    score,
                    total: examQuestions.length
                })
            });
        } catch(err){
            console.log("Could not save result");
        }
    }

    showPage("result");
}

document.getElementById("submitExamBtn")?.addEventListener("click", ()=>{
    if(confirm("Submit exam now?")){
        submitExam();
    }
});

// ===========================
// Leaderboard
// ===========================
document.querySelector('button[onclick="showPage(\'leaderboard\')"]')?.addEventListener("click", loadLeaderboard);

async function loadLeaderboard(){
    try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        const list = document.getElementById("leaderboardList");

        if(!data.success || data.leaderboard.length === 0){
            list.innerHTML = "No Record";
            return;
        }

        list.innerHTML = data.leaderboard.map((entry, i)=>`
            <div class="leaderboard-row">
                <span>#${i+1}</span>
                <span>${entry.fullname || entry.student_email}</span>
                <span>${entry.score}/${entry.total}</span>
            </div>
        `).join("");
    } catch(err){
        document.getElementById("leaderboardList").innerHTML = "Could not load leaderboard";
    }
}

// ===========================
// Profile: My Results
// ===========================
document.querySelector('button[onclick="showPage(\'profile\')"]')?.addEventListener("click", loadMyResults);

async function loadMyResults(){
    if(!currentStudent) return;

    try {
        const res = await fetch(`/api/results/${encodeURIComponent(currentStudent.email)}`);
        const data = await res.json();
        const list = document.getElementById("myResultsList");

        if(!data.success || data.results.length === 0){
            list.innerHTML = "No results yet";
            return;
        }

        list.innerHTML = data.results.map(r=>`
            <div class="result-row">
                <span>${r.score}/${r.total}</span>
                <span>${new Date(r.created_at).toLocaleDateString()}</span>
            </div>
        `).join("");
    } catch(err){
        document.getElementById("myResultsList").innerHTML = "Could not load results";
    }
}

// ===========================
// Admin: Add Single Question
// ===========================
document.getElementById("addQuestionBtn")?.addEventListener("click", async ()=>{
    const subject = document.getElementById("qSubject").value;
    const question = document.getElementById("qText").value;
    const option_a = document.getElementById("qOptionA").value;
    const option_b = document.getElementById("qOptionB").value;
    const option_c = document.getElementById("qOptionC").value;
    const option_d = document.getElementById("qOptionD").value;
    const answer = document.getElementById("qAnswer").value;

    if(!subject || !question || !option_a || !option_b || !option_c || !option_d || !answer){
        alert("Fill all fields");
        return;
    }

    try {
        const res = await fetch("/api/questions/add", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({subject, question, option_a, option_b, option_c, option_d, answer})
        });
        const data = await res.json();
        alert(data.message);

        if(data.success){
            document.getElementById("qSubject").value = "";
            document.getElementById("qText").value = "";
            document.getElementById("qOptionA").value = "";
            document.getElementById("qOptionB").value = "";
            document.getElementById("qOptionC").value = "";
            document.getElementById("qOptionD").value = "";
            document.getElementById("qAnswer").value = "";
        }
    } catch(err){
        alert("Server error — try again");
    }
});

// ===========================
// Admin: Publish/Import CSV Questions
// CSV format: subject,question,option_a,option_b,option_c,option_d,answer
// ===========================
document.getElementById("csvFileInput")?.addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = async (event)=>{
        const text = event.target.result;
        const lines = text.split("\n").filter(l => l.trim() !== "");
        const headers = lines[0].split(",").map(h=>h.trim());

        const rows = lines.slice(1).map(line=>{
            const values = line.split(",").map(v=>v.trim());
            const row = {};
            headers.forEach((h, i)=> row[h] = values[i]);
            return row;
        });

        try {
            const res = await fetch("/api/questions/import", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({rows})
            });
            const data = await res.json();
            alert(data.message);
        } catch(err){
            alert("Import failed — try again");
        }
    };
    reader.readAsText(file);
});

// ===========================
// Admin: Load & Manage Questions
// ===========================
document.querySelector('button[onclick="showPage(\'manageQuestions\')"]')?.addEventListener("click", loadAllQuestions);

async function loadAllQuestions(){
    try {
        const res = await fetch("/api/questions/all");
        const data = await res.json();
        const list = document.getElementById("questionsList");

        if(!data.success || data.questions.length === 0){
            list.innerHTML = "No questions yet";
            return;
        }

        list.innerHTML = data.questions.map(q=>`
            <div class="question-row">
                <span>[${q.subject}] ${q.question}</span>
                <button onclick="deleteQuestion(${q.id})">Delete</button>
            </div>
        `).join("");
    } catch(err){
        document.getElementById("questionsList").innerHTML = "Could not load questions";
    }
}

async function deleteQuestion(id){
    if(!confirm("Delete this question?")) return;

    try {
        const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
        const data = await res.json();
        alert(data.message);
        loadAllQuestions();
    } catch(err){
        alert("Could not delete");
    }
}

// ===========================
// Admin: All Results
// ===========================
document.querySelector('button[onclick="showPage(\'adminResults\')"]')?.addEventListener("click", loadAdminResults);

async function loadAdminResults(){
    try {
        const res = await fetch("/api/results/all");
        const data = await res.json();
        const list = document.getElementById("adminResultsList");

        if(!data.success || data.results.length === 0){
            list.innerHTML = "No results yet";
            return;
        }

        list.innerHTML = data.results.map(r=>`
            <div class="result-row">
                <span>${r.fullname || r.student_email}</span>
                <span>${r.score}/${r.total}</span>
                <span>${new Date(r.created_at).toLocaleDateString()}</span>
            </div>
        `).join("");
    } catch(err){
        document.getElementById("adminResultsList").innerHTML = "Could not load results";
    }
}

// ===========================
// Settings
// ===========================
function toggleSound(){
    const enabled = document.getElementById("soundToggle").checked;
    localStorage.setItem("pendo_sound", enabled);
}

function toggleDarkMode(){
    const enabled = document.getElementById("darkModeToggle").checked;
    document.body.classList.toggle("dark-mode", enabled);
    localStorage.setItem("pendo_darkmode", enabled);
}

// ===========================
// Anti Cheat
// ===========================
document.addEventListener("contextmenu",e=>{
    e.preventDefault();
});

document.addEventListener("keydown",(e)=>{
    if(
        e.key==="F12" ||
        (e.ctrlKey && e.shiftKey && e.key==="I") ||
        (e.ctrlKey && e.key==="u") ||
        (e.ctrlKey && e.key==="c") ||
        (e.ctrlKey && e.key==="v")
    ){
        e.preventDefault();
    }
});

let warning=0;

document.addEventListener("visibilitychange",()=>{
    if(document.hidden && document.getElementById("exam").style.display === "block"){
        warning++;
        alert("Warning "+warning+"/3\nDo not leave the exam tab.");

        if(warning>=2){
            alert("Exam Submitted Automatically");
            submitExam();
        }
    }
});
