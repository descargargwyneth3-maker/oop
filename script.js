/* =================================
   STUDENT HUB - JAVASCRIPT
================================= */

/* HAMBURGER MENU */

function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("overlay").classList.toggle("active");
}

/* NAVIGATION */

function showSection(id, button) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.add("hidden");
    });

    const section = document.getElementById(id);

section.classList.remove("hidden");

section.style.animation = "none";
void section.offsetWidth;
section.style.animation = "slideUp .5s ease";
	
    document.querySelectorAll(".sidebar button:not(.close-menu)")
        .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");

    if (id === "attendance") {
        studentHub.renderAttendanceHistory();
    }
}

/* LOCAL STORAGE */

function loadData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/* SAMPLE STUDENT RECORDS
   Replace these with actual student records.
*/

const students = [
    {
        name: "Eunice R. Aguinaldo",
        id: "ISU-2026-0001",
        barcode: "25-0275"
    },
    {
        name: "Gwyneth G. Descargar",
        id: "ISU-2026-0002",
        barcode: "25-0190"
    }
]; 

/* STUDENT HUB OBJECT */

const studentHub = {

    projects: loadData("hubProjects"),
    tasks: loadData("hubTasks"),
    announcements: loadData("hubAnnouncements"),
    attendance: loadData("hubAttendance"),

    scanner: null,
    scanning: false,
    lastScan: "",

    /* HTML TEXT SAFETY */

    escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    },

    /* FIND STUDENT */

    findStudent(value) {
        const search = value.trim().toLowerCase();

        return students.find(student =>
            student.name.toLowerCase() === search ||
            student.id.toLowerCase() === search ||
            student.barcode.toLowerCase() === search
        );
    },

    /* SEARCH STUDENT */

    searchStudent() {
        const value = document.getElementById("studentSearch").value;

        if (!value.trim()) {
            alert("Please enter a Student Name or ID.");
            return;
        }

        const student = this.findStudent(value);

        if (student) {
            this.showStudent(student);
        } else {
            document.getElementById("attendanceResult").innerHTML =
                "<div class='result-card'>Student record not found.</div>";
        }
    },

    /* DISPLAY STUDENT */

    showStudent(student) {
        const result = document.getElementById("attendanceResult");

        const name = this.escapeHTML(student.name);
        const id = this.escapeHTML(student.id);

        result.innerHTML = `
            <div class="result-card">
                <h3>Student Record Found ✓</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Student ID:</strong> ${id}</p>

                <button class="action-green"
                    id="markPresentBtn">
                    ✓ Mark as Present
                </button>
            </div>
        `;

        document.getElementById("markPresentBtn").onclick = () => {
            this.markAttendance(student.id);
        };
    }, 
				/* MARK ATTENDANCE */

    markAttendance(studentID) {
        const student = students.find(s => s.id === studentID);

        if (!student) return;

        const now = new Date();
        const date = now.toLocaleDateString();

        const exists = this.attendance.some(record =>
            record.id === studentID && record.date === date
        );

        if (exists) {
            alert("Attendance already recorded today.");
            return;
        }

        this.attendance.push({
            name: student.name,
            id: student.id,
            date: date,
            time: now.toLocaleTimeString(),
            status: "Present"
        });

        saveData("hubAttendance", this.attendance);

        alert("Attendance successfully recorded!");

        this.renderAttendanceHistory();
        this.updateDashboard();
    },

    /* START BARCODE SCANNER */

    async startScanner() {
        if (this.scanning) return;

        if (typeof Html5Qrcode === "undefined") {
            alert("Scanner library not loaded. Check your internet connection.");
            return;
        }

        const reader = document.getElementById("reader");
        const startBtn = document.getElementById("startScanBtn");
        const stopBtn = document.getElementById("stopScanBtn");

        reader.classList.remove("hidden");

        document.getElementById("scanResult").style.display = "none";

        const formats = [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR
        ];

        this.scanner = new Html5Qrcode("reader", {
            formatsToSupport: formats,
            verbose: false
        });

        try {
            await this.scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: {
                        width: 320,
                        height: 120
                    }
                },

                decodedText => {
                    if (decodedText === this.lastScan) return;

                    this.lastScan = decodedText;
                    this.handleBarcode(decodedText);
                },

                () => {}
            );

            this.scanning = true;

            startBtn.disabled = true;
            stopBtn.disabled = false;

        } catch (error) {
            this.scanner = null;
            reader.classList.add("hidden");

            alert("Camera unavailable. Please allow camera permission and use HTTPS or localhost."); 
				console.error(error);
        }
    },

    /* HANDLE BARCODE */

    handleBarcode(decodedText) {
        const result = document.getElementById("scanResult");

        result.style.display = "block";

        result.innerHTML = `
            <strong>Barcode Detected!</strong>
            <p>Barcode Value: ${this.escapeHTML(decodedText)}</p>
        `;

        const student = this.findStudent(decodedText);

        if (student) {
            this.showStudent(student);

            result.innerHTML += `
                <p class="status">✓ Student successfully identified!</p>
            `;
        } else {
            document.getElementById("attendanceResult").innerHTML = `
                <div class="result-card">
                    <h3>Student Not Found</h3>
                    <p>The barcode was scanned, but it does not match a registered student.</p>
                    <p>Scanned value: ${this.escapeHTML(decodedText)}</p>
                </div>
            `;
        }
    },

    /* STOP BARCODE SCANNER */

    async stopScanner() {
        if (!this.scanner || !this.scanning) return;

        try {
            await this.scanner.stop();
            this.scanner.clear();
        } catch (error) {
            console.error(error);
        }

        this.scanner = null;
        this.scanning = false;
        this.lastScan = "";

        document.getElementById("reader").classList.add("hidden");
        document.getElementById("startScanBtn").disabled = false;
        document.getElementById("stopScanBtn").disabled = true;
    },

    /* ATTENDANCE HISTORY */

    renderAttendanceHistory() {
        const list = document.getElementById("attendanceHistory");

        if (this.attendance.length === 0) {
            list.innerHTML = "<p>No attendance records yet.</p>";
            return;
        }

        list.innerHTML = [...this.attendance].reverse().map(record => `
            <div class="project">
                <strong>${this.escapeHTML(record.name)}</strong>
                <p>ID: ${this.escapeHTML(record.id)}</p>
                <p>Date: ${this.escapeHTML(record.date)}</p>
                <p>Time: ${this.escapeHTML(record.time)}</p>
                <span class="status">${this.escapeHTML(record.status)}</span>
            </div>
        `).join("");
    }, 
				/* ADD PROJECT */

    addProject() {
        const name = document.getElementById("projectName").value.trim();
        const subject = document.getElementById("subjectName").value.trim();
        const deadline = document.getElementById("deadline").value;

        if (!name || !subject || !deadline) {
            alert("Please complete all project fields.");
            return;
        }

        this.projects.push({ name, subject, deadline });

        saveData("hubProjects", this.projects);

        document.getElementById("projectName").value = "";
        document.getElementById("subjectName").value = "";
        document.getElementById("deadline").value = "";

        this.renderProjects();
        this.updateDashboard();
    },

    /* DISPLAY PROJECTS */

    renderProjects() {
        const list = document.getElementById("projectList");

        if (this.projects.length === 0) {
            list.innerHTML = "<p>No projects added yet.</p>";
            return;
        }

        list.innerHTML = this.projects.map((project, index) => `
            <div class="project">
                <strong>${this.escapeHTML(project.name)}</strong>
                <p>Subject: ${this.escapeHTML(project.subject)}</p>
                <p>Deadline: ${this.escapeHTML(project.deadline)}</p>
                <button class="delete-btn"
                    onclick="studentHub.deleteProject(${index})">
                    Delete
                </button>
            </div>
        `).join("");
    },

    deleteProject(index) {
        if (!confirm("Delete this project?")) return;

        this.projects.splice(index, 1);
        saveData("hubProjects", this.projects);

        this.renderProjects();
        this.updateDashboard();
    },

    /* ADD ANNOUNCEMENT */

    addAnnouncement() {
        const value = document.getElementById("newAnnouncement").value.trim();

        if (!value) {
            alert("Please write an announcement.");
            return;
        }

        this.announcements.push({
            text: value,
            date: new Date().toLocaleDateString()
        });

        saveData("hubAnnouncements", this.announcements);

        document.getElementById("newAnnouncement").value = "";

        this.renderAnnouncements();
        this.updateDashboard();
    },

    /* DISPLAY ANNOUNCEMENTS */

    renderAnnouncements() {
        const list = document.getElementById("announcementList");

        if (this.announcements.length === 0) {
            list.innerHTML = "<p>No announcements yet.</p>";
            return;
        }

        list.innerHTML = this.announcements.map((item, index) => `
            <div class="note">
                <strong>📢 ${this.escapeHTML(item.text)}</strong>
                <p>Date: ${this.escapeHTML(item.date)}</p>
                <button class="delete-btn"
                    onclick="studentHub.deleteAnnouncement(${index})">
                    Delete
                </button>
            </div>
        `).join("");
    }, deleteAnnouncement(index) {
        if (!confirm("Delete this announcement?")) return;

        this.announcements.splice(index, 1);
        saveData("hubAnnouncements", this.announcements);

        this.renderAnnouncements();
        this.updateDashboard();
    },

    /* ADD TASK */

    addTask() {
        const value = document.getElementById("newTask").value.trim();

        if (!value) {
            alert("Please enter a task.");
            return;
        }

        this.tasks.push({
            name: value,
            done: false
        });

        saveData("hubTasks", this.tasks);

        document.getElementById("newTask").value = "";

        this.renderTasks();
        this.updateDashboard();
    },

    /* DISPLAY TASKS */

    renderTasks() {
        const list = document.getElementById("taskList");

        if (this.tasks.length === 0) {
            list.innerHTML = "<p>No tasks added yet.</p>";
            return;
        }

        list.innerHTML = this.tasks.map((task, index) => `
            <div class="task ${task.done ? "done" : ""}">
                <label>
                    <input type="checkbox"
                        ${task.done ? "checked" : ""}
                        onchange="studentHub.toggleTask(${index})">

                    <strong>${this.escapeHTML(task.name)}</strong>
                </label>

                <button class="delete-btn"
                    onclick="studentHub.deleteTask(${index})">
                    Delete
                </button>
            </div>
        `).join("");
    },

    toggleTask(index) {
        this.tasks[index].done = !this.tasks[index].done;

        saveData("hubTasks", this.tasks);

        this.renderTasks();
        this.updateDashboard();
    },

    deleteTask(index) {
        if (!confirm("Delete this task?")) return;

        this.tasks.splice(index, 1);

        saveData("hubTasks", this.tasks);

        this.renderTasks();
        this.updateDashboard();
    },

    /* DASHBOARD COUNTERS */

    updateDashboard() {
        document.getElementById("attendanceStatus").textContent =
            this.attendance.length;

        document.getElementById("projectCount").textContent =
            this.projects.length;

        document.getElementById("taskCount").textContent =
            this.tasks.filter(task => !task.done).length;

        document.getElementById("noteCount").textContent =
            this.announcements.length;
    }
}; 
				/* INITIALIZE */

studentHub.renderProjects();
studentHub.renderAnnouncements();
studentHub.renderTasks();
studentHub.renderAttendanceHistory();
studentHub.updateDashboard(); 

