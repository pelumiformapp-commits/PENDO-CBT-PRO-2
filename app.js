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

};

// ===========================
// Student Login (Temporary)
// ===========================

document.getElementById("loginBtn").addEventListener("click",()=>{

    let email=document.getElementById("loginEmail").value;
    let password=document.getElementById("loginPassword").value;

    if(email==="" || password===""){

        alert("Enter Email and Password");

        return;

    }

    alert("Login Successful");

    showPage("dashboard");

});

// ===========================
// Logout
// ===========================

function logout(){

    if(confirm("Logout?")){

        showPage("home");

    }

}

// ===========================
// Timer
// ===========================

let minutes=60;
let seconds=0;

function startTimer(){

    let timer=setInterval(()=>{

        if(seconds===0){

            if(minutes===0){

                clearInterval(timer);

                alert("Time Up!");

                showPage("result");

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
// Start Exam
// ===========================

document.querySelector("#dashboard button")
.addEventListener("click",()=>{

    showPage("exam");

    startTimer();

});

// ===========================
// Anti Cheat
// ===========================

// Disable right click
document.addEventListener("contextmenu",e=>{

    e.preventDefault();

});

// Disable F12 & Inspect
document.addEventListener("keydown",(e)=>{

    if(
        e.key==="F12" ||
        (e.ctrlKey && e.shiftKey && e.key==="I") ||
        (e.ctrlKey && e.key==="u")
    ){

        e.preventDefault();

    }

});

// Detect tab switch
let warning=0;

document.addEventListener("visibilitychange",()=>{

    if(document.hidden){

        warning++;

        alert("Warning "+warning+"/3\nDo not leave the exam tab.");

        if(warning>=3){

            alert("Exam Submitted Automatically");

            showPage("result");

        }

    }

});
