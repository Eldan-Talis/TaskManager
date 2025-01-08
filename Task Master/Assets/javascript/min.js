document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("task-modal");
    const modalTitle = document.getElementById("modal-title");
    const taskForm = document.getElementById("task-form");
    const closeModal = document.querySelector(".close-btn");

    // ����� ������� ����� �����
    const statusToBoardClass = {
        "backlog": "red",
        "in-progress": "yellow",
        "review": "green",
        "done": "blue"
    };

    // ������� ������ ���� ������� ����
    const updateTaskCount = (boardClass) => {
        const boardHeader = document.querySelector(`.board.${boardClass} header h4`);
        const taskList = document.querySelector(`.board.${boardClass} .board-content ul`);
        if (boardHeader && taskList) {
            const taskCount = taskList.querySelectorAll("li").length;
            boardHeader.querySelector("span").textContent = `(${taskCount})`;
        }
    };

    // ����� ���� ������� ��� ������
    const updateAllTaskCounts = () => {
        Object.values(statusToBoardClass).forEach((boardClass) => {
            updateTaskCount(boardClass);
        });
    };

    // ����� ������ ������ ����� ����
    document.getElementById("new-task-btn").addEventListener("click", (e) => {
        e.preventDefault();
        modalTitle.textContent = "Create Task";
        taskForm.reset();
        modal.style.display = "block";
    });

    // ����� ������ �����
    taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        // ����� ������� ������
        const title = document.getElementById("task-title").value;
        const assignee = document.getElementById("task-assignee").value; // ��� ������ ������
        const description = document.getElementById("task-description").value;
        const deadline = document.getElementById("task-deadline").value; // �������
        const status = document.getElementById("task-status").value;
        // ����� ������ �����
        if (!title || !assignee || !description || !deadline) {
            alert("All fields are required!");
            return;
        }
        // ����� ���� �� �� �����
        const boardClass = statusToBoardClass[status];
        if (!boardClass) {
            console.error(`No board class mapped for status "${status}"`);
            return;
        }

        // ����� �-HTML ������ ���� �� �� ������
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

        // ����� ������ ���� ������
        const targetBoard = document.querySelector(`.board.${boardClass} .board-content ul`);
        if (targetBoard) {
            targetBoard.appendChild(newTask);
            console.log("Task added to the board successfully.");
        } else {
            console.error(`Board with class "${boardClass}" not found!`);
        }

        // ����� ���� ������� ����
        updateTaskCount(boardClass);

        // ����� ������� ������ �����
        modal.style.display = "none";
        taskForm.reset();
    });

    // ����� ������� ������ �� ����� �-X
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // ����� ������� ������ ���� �������
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // ����� ���� ������� ��� ����� �����
    updateAllTaskCounts();
});
