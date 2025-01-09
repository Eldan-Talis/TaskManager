let selectedCategoryContainer = null; // Tracks the category container for task creation

// Function to handle Add Category Form Submission
document
  .getElementById("addCategoryForm")
  .addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form refresh

    const categoryNameInput = document.getElementById("categoryNameInput");
    const categoryName = categoryNameInput.value.trim();

    if (categoryName) {
      addCategory(categoryName); // Add category to the grid
      categoryNameInput.value = ""; // Clear input field

      // Close the modal programmatically
      const addCategoryModal = bootstrap.Modal.getInstance(
        document.getElementById("addCategoryModal")
      );
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
  buttonContainer.classList.add(
    "position-absolute",
    "top-0",
    "end-0",
    "m-2",
    "d-flex",
    "gap-1"
  );

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
    if (
      confirm(`Are you sure you want to delete the category "${categoryName}"?`)
    ) {
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
        categories.forEach((card) => card.classList.remove("highlight"));

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
  selectedTaskDiv = null; // Clear editing state for a new task
  selectedCategoryContainer = categoryContainer; // Set the selected category container
  document.getElementById("addTaskModalLabel").textContent = "Add Task"; // Reset title
  document.querySelector("#addTaskForm button[type='submit']").textContent =
    "Add Task"; // Reset button text
  document.getElementById("addTaskForm").reset(); // Clear input fields
  const taskModal = new bootstrap.Modal(
    document.getElementById("addTaskModal")
  );
  taskModal.show();
}

document.getElementById("addTaskForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const taskName = document.getElementById("taskNameInput").value.trim();
  const taskDescription = document
    .getElementById("taskDescriptionInput")
    .value.trim();
  const taskDate = document.getElementById("taskDateInput").value;

  if (taskName) {
    if (selectedTaskDiv) {
      // Edit existing task
      selectedTaskDiv.querySelector("h5").textContent = taskName;
      selectedTaskDiv.querySelector("p").textContent =
        taskDescription || "No description provided.";
      if (taskDate) {
        const taskDateElement = selectedTaskDiv.querySelector(".task-date");
        if (taskDateElement) {
          taskDateElement.textContent = `TDD: ${taskDate}`;
        } else {
          const newDateElement = document.createElement("span");
          newDateElement.textContent = `TDD: ${taskDate}`;
          newDateElement.classList.add("task-date", "text-muted", "small");
          selectedTaskDiv.appendChild(newDateElement);
        }
      }
    } else {
      // Add new task
      addTaskToCategory(
        selectedCategoryContainer,
        taskName,
        taskDescription,
        taskDate
      );
    }

    // Reset form and variables
    selectedTaskDiv = null;
    document.getElementById("addTaskForm").reset();

    // Close the modal
    const taskModal = bootstrap.Modal.getInstance(
      document.getElementById("addTaskModal")
    );
    taskModal.hide();
  } else {
    alert("Task Name is required!");
  }
});

document.getElementById("add-category-btn").addEventListener("click", () => {
  selectedTaskDiv = null; // Clear editing state
  document.getElementById("addTaskModalLabel").textContent = "Add Task"; // Reset modal title
  document.querySelector("#addTaskForm button[type='submit']").textContent =
    "Add Task"; // Reset button text
  document.getElementById("addTaskForm").reset(); // Clear the form fields
});

function addTaskToCategory(categoryContainer, name, description, date) {
  let taskList = categoryContainer.querySelector(".task-list");
  if (!taskList) {
    taskList = document.createElement("div");
    taskList.classList.add("task-list");
    categoryContainer.appendChild(taskList);
  }

  const taskDiv = document.createElement("div");
  taskDiv.classList.add("task", "position-relative", "p-2", "mb-2", "rounded");

  const taskInfo = document.createElement("div");

  const taskTitle = document.createElement("h5");
  taskTitle.textContent = name;
  taskInfo.appendChild(taskTitle);

  const taskDesc = document.createElement("p");
  taskDesc.textContent = description || "No description provided.";
  taskInfo.appendChild(taskDesc);

  if (date) {
    const taskDate = document.createElement("span");
    taskDate.textContent = "TDD: " + date;
    taskDate.classList.add("task-date", "text-muted", "small");
    taskInfo.appendChild(taskDate);
  }

  // Icons Container
  const iconsContainer = document.createElement("div");
  iconsContainer.style.position = "absolute";
  iconsContainer.style.top = "10px";
  iconsContainer.style.right = "10px";
  iconsContainer.style.display = "flex";
  iconsContainer.style.gap = "5px";

  // Add Check Icon
  const checkIcon = document.createElement("i");
  checkIcon.classList.add("fas", "fa-check", "text-success", "cursor-pointer");
  checkIcon.style.cursor = "pointer";
  checkIcon.title = "Mark as Done";

  // Event Listener for Check Icon
  checkIcon.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent event from bubbling to parent
    if (taskDiv.classList.contains("task-done")) {
      // Unmark Task as Done
      taskDiv.classList.remove("task-done");
      checkIcon.classList.replace("fa-undo", "fa-check");
      checkIcon.classList.replace("text-secondary", "text-success");
      checkIcon.title = "Mark as Done";
    } else {
      // Mark Task as Done
      taskDiv.classList.add("task-done");
      checkIcon.classList.replace("fa-check", "fa-undo");
      checkIcon.classList.replace("text-success", "text-secondary");
      checkIcon.title = "Mark as Not Done";
    }
  });

  iconsContainer.appendChild(checkIcon);

  // Add Edit Icon
  const editIcon = document.createElement("i");
  editIcon.classList.add("fas", "fa-edit", "text-secondary", "cursor-pointer");
  editIcon.style.cursor = "pointer";
  editIcon.title = "Edit Task";
  editIcon.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent event from bubbling to parent
    editTask(taskDiv);
  });
  iconsContainer.appendChild(editIcon);

  // Add Delete Icon
  const deleteIcon = document.createElement("i");
  deleteIcon.classList.add("fas", "fa-trash", "text-danger", "cursor-pointer");
  deleteIcon.style.cursor = "pointer";
  deleteIcon.title = "Delete Task";
  deleteIcon.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent event from bubbling to parent
    deleteTask(taskDiv);
  });
  iconsContainer.appendChild(deleteIcon);

  // Append task info and icons
  taskDiv.appendChild(taskInfo);
  taskDiv.appendChild(iconsContainer);

  taskList.appendChild(taskDiv);

  // Add click event to show task details
  taskDiv.addEventListener("click", () => showTaskDetails(taskDiv));
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

// Function to Delete a Task
function deleteTask(taskDiv) {
  if (confirm("Are you sure you want to delete this task?")) {
    taskDiv.remove();
  }
}

// Function to Edit a Task
function editTask(taskDiv) {
  // Set task to edit
  selectedTaskDiv = taskDiv; // Store the task being edited

  // Get existing task details
  const taskTitle = taskDiv.querySelector("h5").textContent;
  const taskDesc = taskDiv.querySelector("p").textContent;
  const taskDate =
    taskDiv.querySelector(".task-date")?.textContent.replace("TDD: ", "") || "";

  // Populate the modal fields
  document.getElementById("taskNameInput").value = taskTitle;
  document.getElementById("taskDescriptionInput").value = taskDesc;
  document.getElementById("taskDateInput").value = taskDate;

  // Update the modal title and button text
  document.getElementById("addTaskModalLabel").textContent = "Edit Task";
  document.querySelector("#addTaskForm button[type='submit']").textContent =
    "Save Changes";

  // Show the modal
  const taskModal = new bootstrap.Modal(
    document.getElementById("addTaskModal")
  );
  taskModal.show();
}

// Function to Show Task Details
function showTaskDetails(taskDiv) {
  const taskTitle = taskDiv.querySelector("h5").textContent;
  const taskDescription = taskDiv.querySelector("p").textContent;
  const taskDateSpan = taskDiv.querySelector(".task-date");
  const taskDate = taskDateSpan
    ? taskDateSpan.textContent.replace("TDD: ", "")
    : "No due date provided.";

  // Get the category name
  const categoryCard = taskDiv.closest(".category-card"); // Find the closest category card
  const categoryName = categoryCard.querySelector("h4").textContent; // Get the category name

  // Update the modal content
  document.getElementById(
    "taskDetailsModalLabel"
  ).textContent = `Category: ${categoryName}`; // Change modal title
  document.getElementById("taskDetailTitle").textContent = taskTitle;
  document.getElementById("taskDetailDescription").textContent =
    taskDescription;
  document.getElementById(
    "taskDetailDate"
  ).textContent = `Due Date: ${taskDate}`;

  // Show the modal
  const taskDetailsModal = new bootstrap.Modal(
    document.getElementById("taskDetailsModal")
  );
  taskDetailsModal.show();
}
