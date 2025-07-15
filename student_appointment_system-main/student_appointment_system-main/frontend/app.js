let role = null;
let userId = null;

function selectRole(selected) {
  role = selected;
  document.getElementById('roleLabel').textContent = selected;
  document.getElementById('selectedRole').textContent = "Selected: " + selected;
}

async function register() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const endpoint = role === 'student' ? 'students' : 'professors';

  const res = await fetch(`http://localhost:5000/api/${endpoint}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  alert("Registered! Now login.");
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const endpoint = role === 'student' ? 'students' : 'professors';

  const res = await fetch(`http://localhost:5000/api/${endpoint}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data[role] && data[role]._id) {
    userId = data[role]._id;
    alert(`Logged in as ${data[role].name}`);

    if (role === 'student') {
      document.getElementById("studentPanel").style.display = "block";
      loadProfessors();
    } else {
      document.getElementById("professorPanel").style.display = "block";
      loadProfessorAppointments();
    }
  } else {
    alert("Login failed.");
  }
}

async function loadProfessors() {
  const res = await fetch("http://localhost:5000/api/professors");
  const professors = await res.json();
  const list = document.getElementById("professorList");
  list.innerHTML = professors
    .map(p => `<div class="card">ID: ${p._id}<br>Name: ${p.name}</div>`)
    .join("");
}

async function bookAppointment() {
  const professorId = document.getElementById("professorId").value.trim();
  const time = document.getElementById("appointmentTime").value;

  const res = await fetch("http://localhost:5000/api/appointments/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: userId,
      professorId,
      time: new Date(time).toISOString()
    }),
  });

  const data = await res.json();
  alert(data.message || "Booking failed.");
  loadStudentAppointments();
}

async function loadStudentAppointments() {
  const res = await fetch(`http://localhost:5000/api/students/${userId}/appointments`);
  const data = await res.json();

  const list = document.getElementById("studentAppointments");
  list.innerHTML = data.map(a =>
    `<div class="card">Professor: ${a.professor.name}<br>Time: ${new Date(a.time).toLocaleString()}<br>Status: ${a.status || 'pending'}</div>`
  ).join("");
}

async function loadProfessorAppointments() {
  const res = await fetch(`http://localhost:5000/api/professors/${userId}/appointments`);
  const data = await res.json();

  const list = document.getElementById("professorAppointments");
  list.innerHTML = data.map(a =>
    `<div class="card">
      Student: ${a.student.name}<br>
      Time: ${new Date(a.time).toLocaleString()}<br>
      Status: ${a.status || 'pending'}<br>
      <button onclick="updateStatus('${a._id}', 'accepted')">Accept</button>
      <button onclick="updateStatus('${a._id}', 'rejected')">Reject</button>
    </div>`
  ).join("");
}

async function updateStatus(id, status) {
  await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  alert("Updated!");
  loadProfessorAppointments();
}
