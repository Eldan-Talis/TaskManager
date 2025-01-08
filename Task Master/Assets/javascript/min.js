document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("task-modal");
    const modalTitle = document.getElementById("modal-title");
    const taskForm = document.getElementById("task-form");
    const closeModal = document.querySelector(".close-btn");

    // מיפוי סטטוסים לצבעי לוחות
    const statusToBoardClass = {
        "backlog": "red",
        "in-progress": "yellow",
        "review": "green",
        "done": "blue"
    };

    // פונקציה לעדכון מספר המשימות בלוח
    const updateTaskCount = (boardClass) => {
        const boardHeader = document.querySelector(`.board.${boardClass} header h4`);
        const taskList = document.querySelector(`.board.${boardClass} .board-content ul`);
        if (boardHeader && taskList) {
            const taskCount = taskList.querySelectorAll("li").length;
            boardHeader.querySelector("span").textContent = `(${taskCount})`;
        }
    };

    // עדכון מספר המשימות בכל הלוחות
    const updateAllTaskCounts = () => {
        Object.values(statusToBoardClass).forEach((boardClass) => {
            updateTaskCount(boardClass);
        });
    };

    // פתיחת חלונית ליצירת משימה חדשה
    document.getElementById("new-task-btn").addEventListener("click", (e) => {
        e.preventDefault();
        modalTitle.textContent = "Create Task";
        taskForm.reset();
        modal.style.display = "block";
    });

    // שמירת המשימה החדשה
    taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        // קריאת הנתונים מהטופס
        const title = document.getElementById("task-title").value;
        const assignee = document.getElementById("task-assignee").value; // למי המשימה מיועדת
        const description = document.getElementById("task-description").value;
        const deadline = document.getElementById("task-deadline").value; // הדדליין
        const status = document.getElementById("task-status").value;
        // בדיקת נתונים ריקים
        if (!title || !assignee || !description || !deadline) {
            alert("All fields are required!");
            return;
        }
        // קביעת הלוח על פי סטטוס
        const boardClass = statusToBoardClass[status];
        if (!boardClass) {
            console.error(`No board class mapped for status "${status}"`);
            return;
        }

        // יצירת ה-HTML למשימה חדשה עם כל הפרטים
        const newTask = document.createElement("li");
        newTask.classList.add("el");
        newTask.innerHTML = `
            <div class="task ${boardClass}">
                <header>
                    <h3>${title}</h3>
                    <span class="icon flaticon-link"></span>
                </header>
                <div class="task-content">
                    <p><strong>Assigned to:</strong> ${assignee}</p>
                    <p><strong>Description:</strong> ${description}</p>
                    <p><strong>Deadline:</strong> <span style="color:#e67e22;">${deadline}</span></p>
                    <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
                </div>
            </div>`;

        // הוספת המשימה ללוח המתאים
        const targetBoard = document.querySelector(`.board.${boardClass} .board-content ul`);
        if (targetBoard) {
            targetBoard.appendChild(newTask);
            console.log("Task added to the board successfully.");
        } else {
            console.error(`Board with class "${boardClass}" not found!`);
        }

        // עדכון מספר המשימות בלוח
        updateTaskCount(boardClass);

        // סגירת החלונית וניקוי הטופס
        modal.style.display = "none";
        taskForm.reset();
    });

    // סגירת החלונית בלחיצה על כפתור ה-X
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // סגירת החלונית בלחיצה מחוץ לחלונית
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // עדכון מספר המשימות בעת טעינת העמוד
    updateAllTaskCounts();
});
