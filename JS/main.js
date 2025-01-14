let selectedCategoryContainer = null; // Tracks the category container for task creation

const apiBaseUrl = "https://s5lu00mr08.execute-api.us-east-1.amazonaws.com/prod"

const user = "user123"

// Function to Add a Category Dynamically
function addCategory(categoryName) {
  const categoriesGrid = document.getElementById("categories-grid");

  // Avoid duplicate categories
  const existingCategory = Array.from(document.querySelectorAll(".category-card h4"))
    .some((header) => header.textContent === categoryName);

  if (existingCategory) {
    console.warn("Category already exists in UI:", categoryName);
    alert("This category already exists!");
    return;
  }

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

  // Add Task Button
  const addTaskIcon = document.createElement("button");
  addTaskIcon.innerHTML = "+";
  addTaskIcon.classList.add("btn", "btn-primary", "p-1");
  addTaskIcon.addEventListener("click", function () {
    openTaskModal(categoryCard);
  });

  // Delete Category Button
  const deleteCategoryIcon = document.createElement("button");
  deleteCategoryIcon.innerHTML = "×";
  deleteCategoryIcon.classList.add("btn", "text-danger", "p-1");
  deleteCategoryIcon.addEventListener("click", function () {
    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      categoriesGrid.removeChild(categoryCard);
    }
  });

  // Append Buttons to Container
  buttonContainer.appendChild(addTaskIcon);
  buttonContainer.appendChild(deleteCategoryIcon);

  // Append Elements to Card
  categoryCard.appendChild(buttonContainer);
  categoryCard.appendChild(categoryHeader);

  categoriesGrid.appendChild(categoryCard);

  // Update Sidebar
  addCategoryToSidebar(categoryName);
}


// Function to Add Category to Sidebar
function addCategoryToSidebar(categoryName) {
  const sidebarList = document.getElementById("category-list");

  // Create Sidebar Item
  const sidebarCategory = document.createElement("li");
  sidebarCategory.classList.add("list-group-item", "category-link", "d-flex", "align-items-center");

  // Add a dot icon using Unicode
  const dotIcon = document.createElement("span");
  dotIcon.textContent = "•"; // Unicode for a dot
  dotIcon.classList.add("dot-icon", "me-2"); // Add styling class
  sidebarCategory.appendChild(dotIcon);

  // Add category name
  const text = document.createTextNode(categoryName);
  sidebarCategory.appendChild(text);

  // Add Click Event to Navigate to Category
  sidebarCategory.addEventListener("click", function () {
    const categories = document.querySelectorAll(".category-card");
    for (let category of categories) {
      const header = category.querySelector("h4");
      if (header.textContent === categoryName) {
        categories.forEach((card) => card.classList.remove("highlight"));
        category.scrollIntoView({ behavior: "smooth", block: "start" });
        category.classList.add("highlight");
        setTimeout(() => category.classList.remove("highlight"), 1000);
        break;
      }
    }
  });

  // Add to Sidebar
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

  // Reset counters
  document.getElementById("taskCharCount").textContent = "20 characters remaining";
  document.getElementById("taskCharCount").style.color = "gray";
  document.getElementById("descriptionCharCount").textContent = "200 characters remaining";
  document.getElementById("descriptionCharCount").style.color = "gray";

  const taskModal = new bootstrap.Modal(
      document.getElementById("addTaskModal")
  );
  taskModal.show();
}


document.getElementById("addTaskForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const taskName = document.getElementById("taskNameInput").value.trim();
  const taskDescription = document
    .getElementById("taskDescriptionInput")
    .value.trim();
  const taskDate = document.getElementById("taskDateInput").value;

  const taskNameMaxLength = 20;
  const taskDescriptionMaxLength = 200;

  if (!taskName) {
    alert("Task Name is required!");
    return;
  }

  try {
    if (selectedTaskDiv) {
      // Edit existing task
      selectedTaskDiv.querySelector("h5").textContent = taskName;
      selectedTaskDiv.querySelector("p").textContent =
        taskDescription || "No description provided.";
      if (taskDate) {
        const taskDateElement = selectedTaskDiv.querySelector(".task-date");
        if (taskDateElement) {
          taskDateElement.textContent = `Due: ${taskDate}`;
        } else {
          const newDateElement = document.createElement("span");
          newDateElement.textContent = `Due: ${taskDate}`;
          newDateElement.classList.add("task-date", "text-muted", "small");
          selectedTaskDiv.appendChild(newDateElement);
        }
      }
    } else {
      // Add new task using backend API
      const addedTask = await addTaskToBackend(
        selectedCategoryContainer.querySelector("h4").textContent, // Category name
        taskName,
        taskDescription || "No description provided.",
        taskDate || null
      );

      if (addedTask) {
        const categoryName = selectedCategoryContainer.querySelector("h4").textContent;
        await refreshCategoryTasks(selectedCategoryContainer, categoryName);
      } else {
        console.warn("addTaskToBackend did not return a valid task.");
      }
    }

    // Close the modal and reset the form
    const taskModal = bootstrap.Modal.getInstance(
      document.getElementById("addTaskModal")
    );
    taskModal.hide();

    selectedTaskDiv = null;
    document.getElementById("addTaskForm").reset();
    document.getElementById("taskCharCount").textContent = `${taskNameMaxLength} characters remaining`;
    document.getElementById("taskCharCount").style.color = "gray";
    document.getElementById("descriptionCharCount").textContent = `${taskDescriptionMaxLength} characters remaining`;
    document.getElementById("descriptionCharCount").style.color = "gray";
  } catch (error) {
    console.error("Error during task submission:", error);
    alert("An error occurred while processing the task.");
  }
});



document.getElementById("add-category-btn").addEventListener("click", () => {
  selectedTaskDiv = null; // Clear editing state
  document.getElementById("addTaskModalLabel").textContent = "Add Task"; // Reset modal title
  document.querySelector("#addTaskForm button[type='submit']").textContent =
    "Add Task"; // Reset button text
  document.getElementById("addTaskForm").reset(); // Clear the form fields
});

function addTaskToCategory(categoryContainer, name, description = "No description provided.", date = null) {
  // Check if the task already exists in the category
  const existingTasks = Array.from(categoryContainer.querySelectorAll(".task h5")).map(
    (taskTitle) => taskTitle.textContent
  );

  if (existingTasks.includes(name)) {
    alert(`A task named "${name}" already exists in this category.`);
    return;
  }

  let taskList = categoryContainer.querySelector(".task-list");
  if (!taskList) {
    taskList = document.createElement("div");
    taskList.classList.add("task-list");
    categoryContainer.appendChild(taskList);
  }

  // Create Task Container
  const taskDiv = document.createElement("div");
  taskDiv.classList.add("task", "position-relative", "p-2", "mb-2", "rounded");

  // Task Info Section
  const taskInfo = document.createElement("div");

  // Task Title
  const taskTitle = document.createElement("h5");
  taskTitle.textContent = name;
  taskInfo.appendChild(taskTitle);

  // Task Description
  const taskDesc = document.createElement("p");
  taskDesc.textContent = description;
  taskInfo.appendChild(taskDesc);

  // Task Date
  if (date) {
    const taskDate = document.createElement("span");
    taskDate.textContent = "Due: " + date;
    taskDate.classList.add("task-date", "text-muted", "small");
    taskInfo.appendChild(taskDate);
  }

  // Task Actions (Icons)
  const iconsContainer = createTaskIcons(taskDiv, name, description, date);

  // Append Info and Actions to Task Div
  taskDiv.appendChild(taskInfo);
  taskDiv.appendChild(iconsContainer);

  // Add Task to the List
  taskList.appendChild(taskDiv);

  // Add Click Event to Show Task Details
  taskDiv.addEventListener("click", () => showTaskDetails(taskDiv));
}

/**
 * Creates and returns the icons container with event listeners.
 */
function createTaskIcons(taskDiv, name, description, date) {
  const iconsContainer = document.createElement("div");
  iconsContainer.style.position = "absolute";
  iconsContainer.style.top = "10px";
  iconsContainer.style.right = "10px";
  iconsContainer.style.display = "flex";
  iconsContainer.style.gap = "5px";

  // Check Icon
  const checkIcon = document.createElement("i");
  checkIcon.classList.add("fas", "fa-check", "text-success", "cursor-pointer");
  checkIcon.title = "Mark as Done";

  checkIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleTaskDoneState(taskDiv, checkIcon);
  });
  iconsContainer.appendChild(checkIcon);

  // Edit Icon
  const editIcon = document.createElement("i");
  editIcon.classList.add("fas", "fa-edit", "text-secondary", "cursor-pointer");
  editIcon.title = "Edit Task";

  editIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    editTask(taskDiv, name, description, date);
  });
  iconsContainer.appendChild(editIcon);

  // Delete Icon
  const deleteIcon = document.createElement("i");
  deleteIcon.classList.add("fas", "fa-trash", "text-danger", "cursor-pointer");
  deleteIcon.title = "Delete Task";

  deleteIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteTask(taskDiv);
  });
  iconsContainer.appendChild(deleteIcon);

  return iconsContainer;
}

/**
 * Toggles the task's "done" state.
 */
function toggleTaskDoneState(taskDiv, checkIcon) {
  if (taskDiv.classList.contains("task-done")) {
    taskDiv.classList.remove("task-done");
    checkIcon.classList.replace("fa-undo", "fa-check");
    checkIcon.classList.replace("text-secondary", "text-success");
    checkIcon.title = "Mark as Done";
  } else {
    taskDiv.classList.add("task-done");
    checkIcon.classList.replace("fa-check", "fa-undo");
    checkIcon.classList.replace("text-success", "text-secondary");
    checkIcon.title = "Mark as Not Done";
  }
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
  // Check if the task is marked as done
  if (taskDiv.classList.contains("task-done")) {
      alert("You cannot edit a task that is marked as done!");
      return; // Exit the function
  }

  // Set task to edit
  selectedTaskDiv = taskDiv; // Store the task being edited

  // Get existing task details
  const taskTitle = taskDiv.querySelector("h5").textContent;
  const taskDesc = taskDiv.querySelector("p").textContent;
  const taskDate =
      taskDiv.querySelector(".task-date")?.textContent.replace("TDD: ", "") || "";

  // Populate the modal fields
  const taskNameInput = document.getElementById("taskNameInput");
  const taskDescriptionInput = document.getElementById("taskDescriptionInput");

  taskNameInput.value = taskTitle;
  taskDescriptionInput.value = taskDesc;
  document.getElementById("taskDateInput").value = taskDate;

  // Update counters based on existing values
  const taskCharCount = document.getElementById("taskCharCount");
  const descriptionCharCount = document.getElementById("descriptionCharCount");

  taskCharCount.textContent = `${20 - taskTitle.length} characters remaining`;
  taskCharCount.style.color = taskTitle.length > 15 ? "red" : "gray";

  descriptionCharCount.textContent = `${200 - taskDesc.length} characters remaining`;
  descriptionCharCount.style.color = taskDesc.length > 180 ? "red" : "gray";

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

//color picker for background ----------------------------------------

// Select all color picker buttons
const colorButtons = document.querySelectorAll(".color-picker button");

// Add click event listener to each button
colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
      const selectedNavbarColor = button.getAttribute("data-navbar-color");
      const selectedSidebarColor = button.getAttribute("data-sidebar-color");
      const selectedCategoryContainerColor = button.getAttribute("data-category-color");
      
      const navbar = document.querySelector(".navbar");
      const sidebar = document.querySelector(".sidebar");
      const categoryCards = document.querySelectorAll(".category-card");

      // Set the background color directly for navbar and sidebar
      navbar.style.setProperty("background-color", selectedNavbarColor, "important");
      sidebar.style.setProperty("background-color", selectedSidebarColor, "important");

      // Set the background color for all category cards
      categoryCards.forEach((categoryCard) => {
          categoryCard.style.setProperty("background-color", selectedCategoryContainerColor, "important");
      });
  });
});


document.addEventListener("DOMContentLoaded", () => {
  // Check if the user prefers dark mode
  const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Select the black and blue buttons
  const blackButton = document.querySelector("[data-navbar-color='#181C14']");
  const blueButton = document.querySelector("[data-navbar-color='#7695FF']");

  if (prefersDarkMode && blackButton) {
      blackButton.click(); // Simulate a click on the black button
  } else if (blueButton) {
      blueButton.click(); // Simulate a click on the blue button
  }
});

// Updates the character counter for the Category Name input field in real-time.
document.getElementById("categoryNameInput").addEventListener("input", function () {
  const maxLength = 20;
  const remaining = maxLength - this.value.length;

  const cateCharCount = document.getElementById("cateCharCount");
  cateCharCount.textContent = `${remaining} characters remaining`;

  if (remaining < 1) {
    cateCharCount.style.setProperty("color", "red", "important");
 // Highlight if exceeding limit (shouldn't happen due to `maxlength`)
  } else {
    cateCharCount.style.color = "gray"; // Reset color
  }
});

// Updates the character counter for the Task Name input field in real-time.
document.getElementById("taskNameInput").addEventListener("input", function () {
  const maxLength = 20; // Character limit for Task Name
  const remaining = maxLength - this.value.length; // Calculate remaining characters

  const taskCharCount = document.getElementById("taskCharCount");
  taskCharCount.textContent = `${remaining} characters remaining`;

  // Change text color if nearing or exceeding the limit
  if (remaining < 5) {
    taskCharCount.style.setProperty("color", "red", "important");
  } else {
    taskCharCount.style.color = "gray"; // Default color
  }
});

// Updates the character counter for the Task Description input field in real-time.
document.getElementById("taskDescriptionInput").addEventListener("input", function () {
  const maxLength = 200; // Character limit for Task Description
  const remaining = maxLength - this.value.length; // Calculate remaining characters

  const descriptionCharCount = document.getElementById("descriptionCharCount");
  descriptionCharCount.textContent = `${remaining} characters remaining`;

  // Change text color if nearing or exceeding the limit
  if (remaining < 20) {
    descriptionCharCount.style.setProperty("color", "red", "important"); // Highlight in red
  } else {
    descriptionCharCount.style.setProperty("color", "gray", "important"); // Default color
  }
});

// Dynamic Search for Category
document.getElementById("categorySearch").addEventListener("input", function () {
  const searchValue = this.value.trim().toLowerCase();
  const categoryItems = document.querySelectorAll("#category-list .list-group-item");

  categoryItems.forEach((item) => {
      const categoryText = item.textContent.replace("•", "").trim().toLowerCase();
      console.log("Raw Text:", item.textContent, "| Processed Text:", categoryText, "| Search Value:", searchValue);

      if (searchValue === "" || categoryText.includes(searchValue)) {
          item.classList.remove("hidden");
          item.style.display = "flex"; // Ensure it uses flex display for visible items
          console.log(`Showing item: ${categoryText}`);
      } else {
          item.classList.add("hidden");
          item.style.display = "none"; // Force hiding
          console.log(`Hiding item: ${categoryText}`);
      }
  });
});

function displayCategories(categories) {
  const categoriesGrid = document.getElementById("categories-grid");
  const sidebarList = document.getElementById("category-list");

  // Clear any existing categories
  categoriesGrid.innerHTML = "";
  sidebarList.innerHTML = "";

  // Loop through the categories and add them
  categories.forEach((categoryName) => {
    // Add to categories grid
    addCategory(categoryName);

  });
}


//get all categories ---------------------
async function fetchAllCategories() {
  try {
    const url = `${apiBaseUrl}/GetAllCategories?userId=${user}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const data = await response.json();
    const categories = data.categories || {};

    // Display categories and their tasks
    displayCategoriesWithTasks(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    alert("Unable to fetch categories. Please try again later.");
  }
}

function displayCategoriesWithTasks(categories) {
  const categoriesGrid = document.getElementById("categories-grid");
  const sidebarList = document.getElementById("category-list");

  // Clear any existing categories
  categoriesGrid.innerHTML = "";
  sidebarList.innerHTML = "";

  // Loop through the categories and display them
  Object.entries(categories).forEach(([categoryName, tasks]) => {
    // Add category to the grid and sidebar
    addCategory(categoryName);

    // Add tasks for the category
    const categoryCard = Array.from(document.querySelectorAll(".category-card"))
      .find((card) => card.querySelector("h4").textContent === categoryName);

    if (categoryCard && tasks) {
      Object.entries(tasks).forEach(([taskName, taskDetails]) => {
        addTaskToCategory(
          categoryCard,
          taskName,
          taskDetails.description,
          taskDetails.dueDate
        );
      });
    }
  });
}

// Function to handle Add Category Form Submission
document
.getElementById("addCategoryForm")
.addEventListener("submit", async function (e) {
  e.preventDefault(); // Prevent form refresh

  // Set the character limit
  const maxLength = 20;

  const categoryNameInput = document.getElementById("categoryNameInput");
  const categoryName = categoryNameInput.value.trim();

  if (!categoryName) {
    alert("Category Name is required!");
    return;
  }

  try {
    // Make API call to add the category
    const response = await fetch(`${apiBaseUrl}/AddCategory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user,
        categoryName: categoryName,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Close the modal programmatically
      const addCategoryModal = bootstrap.Modal.getInstance(
        document.getElementById("addCategoryModal")
      );
      addCategoryModal.hide();

      // Add category to the UI
      addCategory(categoryName);

      // Clear input field
      categoryNameInput.value = "";

      // Reset the character counter
      const cateCharCount = document.getElementById("cateCharCount");
      cateCharCount.textContent = `${maxLength} characters remaining`;
      cateCharCount.style.color = "gray";

    } else {
      alert(data.error || "Failed to add category.");
      console.error("Backend Error:", data.error);
    }
  } catch (error) {
    alert("An error occurred while adding the category. Please try again.");
    console.error("Error:", error);
  }
});

  
  

  







document.addEventListener("DOMContentLoaded", () => {
  fetchAllCategories();
});

async function addTaskToBackend(categoryName, taskName, description, dueDate) {
  try {
    const response = await fetch(`${apiBaseUrl}/AddTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user,
        categoryName,
        taskName,
        description,
        dueDate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from backend:", errorData.error);
      return null;
    }

    const data = await response.json();
    return data.task; // Ensure this matches the backend's response structure
  } catch (error) {
    console.error("Error during API call to add task:", error);
    return null;
  }
}



async function fetchTasksForCategory(userId, categoryName) {
  try {
    const response = await fetch(`${apiBaseUrl}/GetAllTasks?userId=${userId}&categoryName=${categoryName}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform tasks from object to array if necessary
    if (data.tasks && typeof data.tasks === "object" && !Array.isArray(data.tasks)) {
      return Object.entries(data.tasks).map(([taskName, taskDetails]) => ({
        taskName, // Add taskName to each task object
        ...taskDetails,
      }));
    }

    return data.tasks || [];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    alert("Unable to fetch tasks. Please try again later.");
    return [];
  }
}


async function refreshCategoryTasks(categoryContainer, categoryName) {
  try {
    const tasks = await fetchTasksForCategory(user, categoryName);

    let taskList = categoryContainer.querySelector(".task-list");
    if (!taskList) {
      taskList = document.createElement("div");
      taskList.classList.add("task-list");
      categoryContainer.appendChild(taskList);
    }

    taskList.innerHTML = ""; // Clear existing tasks

    tasks.forEach((task) => {
      addTaskToCategory(categoryContainer, task.taskName, task.description, task.dueDate);
    });

  } catch (error) {
    console.error(`Failed to refresh tasks for category "${categoryName}":`, error);
    alert("Unable to refresh tasks. Please try again later.");
  }
}




