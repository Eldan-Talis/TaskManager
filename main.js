let selectedCategoryContainer = null; // Tracks the category container for task creation

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
    addTaskIcon.innerHTML = "+"; // Plus icon
    addTaskIcon.classList.add("btn", "btn-primary", "p-1");

    // Event Listener to Open Task Modal
    addTaskIcon.addEventListener("click", function () {
        openTaskModal(categoryCard); // Pass the category card to the task modal
    });

    // Delete Category Button (Red X Icon)
    const deleteCategoryIcon = document.createElement("button");
    deleteCategoryIcon.innerHTML = "×"; // X icon
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

    // Add to Sidebar (Categories are added to the list, below the button)
    sidebarList.appendChild(sidebarCategory);
}



// Function to Remove Category from Sidebar
function removeCategoryFromSidebar(categoryName) {
    const sidebarList = document.getElementById("category-list");
    const sidebarCategories = sidebarList.getElementsByClassName("category-link");

    for (let i = 0; i < sidebarCategories.length; i++) {
        if (sidebarCategories[i].textContent === categoryName) {
            sidebarList.removeChild(sidebarCategories[i]);
            break;
        }
    }
}



// Function to Open the Task Modal
function openTaskModal(categoryContainer) {
    selectedCategoryContainer = categoryContainer; // Set the selected category container
    const taskModal = new bootstrap.Modal(document.getElementById("addTaskModal"));
    taskModal.show();
}

// Function to Handle Task Form Submission
document.getElementById("addTaskForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form refresh

    const taskNameInput = document.getElementById("taskNameInput");
    const taskDescriptionInput = document.getElementById("taskDescriptionInput");
    const taskDateInput = document.getElementById("taskDateInput");

    const taskName = taskNameInput.value.trim();
    const taskDescription = taskDescriptionInput.value.trim();
    const taskDate = taskDateInput.value;

    if (taskName) {
        addTaskToCategory(selectedCategoryContainer, taskName, taskDescription, taskDate);

        // Clear input fields
        taskNameInput.value = "";
        taskDescriptionInput.value = "";
        taskDateInput.value = "";

        // Close the modal programmatically
        const taskModal = bootstrap.Modal.getInstance(document.getElementById("addTaskModal"));
        taskModal.hide();
    } else {
        alert("Task Name is required!");
    }
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

    taskList.appendChild(taskDiv);
}

// Set the minimum date for the task date input to today's date
document.getElementById("taskDateInput").addEventListener("focus", function () {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(today.getDate()).padStart(2, "0");
    const minDate = `${year}-${month}-${day}`;
    this.setAttribute("min", minDate);
});
