let selectedCategoryContainer = null; // Tracks the category container for task creation
let taskBeingEdited = null; // Tracks the task currently being edited

// Function to handle Add Category Form Submission
document.getElementById("addCategoryForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form refresh

    const categoryNameInput = document.getElementById("categoryNameInput");
    const categoryName = categoryNameInput.value.trim();

    if (categoryName) {
        addCategory(categoryName); // Add category to the grid
        categoryNameInput.value = ""; // Clear input field

        // Close the modal programmatically
        const addCategoryModal = bootstrap.Modal.getInstance(document.getElementById("addCategoryModal"));
        addCategoryModal.hide();
    } else {
        alert("Category Name is required!");
    }
});

// Function to Add a Category Dynamically
function addCategory(categoryName) {
    const categoriesGrid = document.getElementById("categories-grid");
    const sidebarList = document.getElementById("category-list");

    // Create Category Card
    const categoryCard = document.createElement("div");
    categoryCard.classList.add("category-card", "position-relative");

    // Category Header
    const categoryHeader = document.createElement("h4");
    categoryHeader.textContent = categoryName;

    // Buttons Container
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("position-absolute", "top-0", "end-0", "m-2", "d-flex", "gap-1");

    // Add Task Button (Plus Icon)
    const addTaskIcon = document.createElement("button");
    addTaskIcon.innerHTML = "+";
    addTaskIcon.classList.add("btn", "btn-primary", "p-1");

    // Event Listener to Open Task Modal
    addTaskIcon.addEventListener("click", function () {
        taskBeingEdited = null; // Ensure we're not editing
        openTaskModal(categoryCard);
    });

    // Delete Category Button (Red X Icon)
    const deleteCategoryIcon = document.createElement("button");
    deleteCategoryIcon.innerHTML = "×";
    deleteCategoryIcon.classList.add("btn", "text-danger", "p-1");

    // Event Listener to Delete the Category
    deleteCategoryIcon.addEventListener("click", function () {
        if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
            categoriesGrid.removeChild(categoryCard);
            removeCategoryFromSidebar(categoryName); // Remove from sidebar
        }
    });

    // Append buttons to the container
    buttonContainer.appendChild(addTaskIcon);
    buttonContainer.appendChild(deleteCategoryIcon);

    // Append elements to the card
    categoryCard.appendChild(buttonContainer);
    categoryCard.appendChild(categoryHeader);

    categoriesGrid.appendChild(categoryCard);

    // Add the category to the sidebar
    addCategoryToSidebar(categoryName);
}

// Function to Add Category to Sidebar
function addCategoryToSidebar(categoryName) {
    const sidebarList = document.getElementById("category-list");

    // Create Sidebar Item
    const sidebarCategory = document.createElement("li");
    sidebarCategory.textContent = categoryName;
    sidebarCategory.classList.add("list-group-item", "category-link");

    // Add Click Event to Navigate to Category
    sidebarCategory.addEventListener("click", function () {
        const categories = document.querySelectorAll(".category-card");
        for (let category of categories) {
            const header = category.querySelector("h4");
            if (header.textContent === categoryName) {
                // Remove highlight from all cards
                categories.forEach(card => card.classList.remove("highlight"));

                // Scroll to the category card
                category.scrollIntoView({ behavior: "smooth", block: "start" });

                // Add highlight class to the clicked category card
                category.classList.add("highlight");

                // Remove highlight after a delay
                setTimeout(() => {
                    category.classList.remove("highlight");
                }, 1000);

                break;
            }
        }
    });

    // Add to Sidebar
    sidebarList.appendChild(sidebarCategory);
}

// Function to Open the Task Modal
function openTaskModal(categoryContainer) {
    selectedCategoryContainer = categoryContainer; // Set the selected category container
    const taskModal = new bootstrap.Modal(document.getElementById("addTaskModal"));
    taskModal.show();
}

// Handle Task Form Submission
document.getElementById("addTaskForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form refresh

    const taskNameInput = document.getElementById("taskNameInput");
    const taskDescriptionInput = document.getElementById("taskDescriptionInput");
    const taskDateInput = document.getElementById("taskDateInput");

    const taskName = taskNameInput.value.trim();
    const taskDescription = taskDescriptionInput.value.trim();
    const taskDate = taskDateInput.value;

    if (!taskName) {
        alert("Task Name is required!");
        return;
    }

    if (taskBeingEdited) {
        // Update existing task
        const taskTitle = taskBeingEdited.querySelector("h5");
        const taskDesc = taskBeingEdited.querySelector("p");
        const taskDateSpan = taskBeingEdited.querySelector(".task-date");

        taskTitle.textContent = taskName;
        taskDesc.textContent = taskDescription || "No description provided.";
        if (taskDate) {
            if (!taskDateSpan) {
                const newTaskDate = document.createElement("span");
                newTaskDate.classList.add("task-date", "position-absolute", "top-0", "end-0", "me-2", "mt-2");
                taskBeingEdited.appendChild(newTaskDate);
            }
            taskBeingEdited.querySelector(".task-date").textContent = "TDD: " + taskDate;
        } else if (taskDateSpan) {
            taskBeingEdited.removeChild(taskDateSpan);
        }

        taskBeingEdited = null; // Clear the editing reference
    } else {
        // Create new task
        addTaskToCategory(selectedCategoryContainer, taskName, taskDescription, taskDate);
    }

    // Clear input fields
    taskNameInput.value = "";
    taskDescriptionInput.value = "";
    taskDateInput.value = "";

    // Close the modal
    const taskModal = bootstrap.Modal.getInstance(document.getElementById("addTaskModal"));
    taskModal.hide();
});

// Function to Add a Task to a Category
function addTaskToCategory(categoryContainer, name, description, date) {
    let taskList = categoryContainer.querySelector(".task-list");
    if (!taskList) {
        taskList = document.createElement("div");
        taskList.classList.add("task-list");
        categoryContainer.appendChild(taskList);
    }

    const taskDiv = document.createElement("div");
    taskDiv.classList.add("task", "position-relative");

    const taskTitle = document.createElement("h5");
    taskTitle.textContent = name;
    taskDiv.appendChild(taskTitle);

    const taskDesc = document.createElement("p");
    taskDesc.textContent = description || "No description provided.";
    taskDiv.appendChild(taskDesc);

    if (date) {
        const taskDate = document.createElement("span");
        taskDate.textContent = "TDD: " + date;
        taskDate.classList.add("task-date", "position-absolute", "top-0", "end-0", "me-2", "mt-2");
        taskDiv.appendChild(taskDate);
    }

    // Add Edit Button
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("btn", "btn-secondary", "me-2");
    editButton.addEventListener("click", () => editTask(taskDiv));
    taskDiv.appendChild(editButton);

    // Add Delete Button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-danger");
    deleteButton.addEventListener("click", () => deleteTask(taskDiv));
    taskDiv.appendChild(deleteButton);

    taskList.appendChild(taskDiv);
}

// Function to Delete a Task
function deleteTask(taskDiv) {
    if (confirm("Are you sure you want to delete this task?")) {
        taskDiv.remove();
    }
}
// Function to Edit a Task
function editTask(taskDiv) {
    // שמירה של המשימה לעריכה
    taskBeingEdited = taskDiv;

    // קבלת הערכים של המשימה הקיימת
    const taskTitle = taskDiv.querySelector("h5");
    const taskDesc = taskDiv.querySelector("p");
    const taskDate = taskDiv.querySelector(".task-date");

    // מילוי המודל עם הפרטים הקיימים
    document.getElementById("taskNameInput").value = taskTitle.textContent;
    document.getElementById("taskDescriptionInput").value = taskDesc.textContent;
    document.getElementById("taskDateInput").value = taskDate ? taskDate.textContent.replace("TDD: ", "") : "";

    // פתיחת המודל
    const taskModal = new bootstrap.Modal(document.getElementById("addTaskModal"));
    taskModal.show();
}
// Function to Show Task Details
function showTaskDetails(taskDiv) {
    const taskTitle = taskDiv.querySelector("h5").textContent;
    const taskDescription = taskDiv.querySelector("p").textContent;
    const taskDateSpan = taskDiv.querySelector(".task-date");
    const taskDate = taskDateSpan ? taskDateSpan.textContent.replace("TDD: ", "") : "No due date provided.";

    // Update the modal content
    document.getElementById("taskDetailsModalLabel").textContent = taskTitle; // Change modal title
    document.getElementById("taskDetailTitle").textContent = taskTitle;
    document.getElementById("taskDetailDescription").textContent = taskDescription;
    document.getElementById("taskDetailDate").textContent = `Due Date: ${taskDate}`;

    // Show the modal
    const taskDetailsModal = new bootstrap.Modal(document.getElementById("taskDetailsModal"));
    taskDetailsModal.show();
}
function addTaskToCategory(categoryContainer, name, description, date) {
    let taskList = categoryContainer.querySelector(".task-list");
    if (!taskList) {
        taskList = document.createElement("div");
        taskList.classList.add("task-list");
        categoryContainer.appendChild(taskList);
    }

    const taskDiv = document.createElement("div");
    taskDiv.classList.add("task", "position-relative");

    const taskTitle = document.createElement("h5");
    taskTitle.textContent = name;
    taskDiv.appendChild(taskTitle);

    const taskDesc = document.createElement("p");
    taskDesc.textContent = description || "No description provided.";
    taskDiv.appendChild(taskDesc);

    if (date) {
        const taskDate = document.createElement("span");
        taskDate.textContent = "TDD: " + date;
        taskDate.classList.add("task-date", "position-absolute", "top-0", "end-0", "me-2", "mt-2");
        taskDiv.appendChild(taskDate);
    }

    // Add click event to show task details
    taskDiv.addEventListener("click", () => showTaskDetails(taskDiv));

    // Add Edit Button
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("btn", "btn-secondary", "me-2");
    editButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent opening details modal
        editTask(taskDiv);
    });
    taskDiv.appendChild(editButton);

    // Add Delete Button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-danger");
    deleteButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent opening details modal
        deleteTask(taskDiv);
    });
    taskDiv.appendChild(deleteButton);

    taskList.appendChild(taskDiv);
}

