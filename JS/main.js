let selectedCategoryContainer = null; // Tracks the category container for task creation

const apiBaseUrl = "https://s5lu00mr08.execute-api.us-east-1.amazonaws.com/prod"

const sub = sessionStorage.getItem('sub');
const firstName = sessionStorage.getItem('firstName');
const user = sub
console.log('Sub:', sub);


document.addEventListener("DOMContentLoaded", async () => {
  const authUrl = `${config.domain}/login?` +
      // response_type=code +
      "response_type=token" +
      `&client_id=${config.clientId}` +
      `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
      "&scope=openid+aws.cognito.signin.user.admin";
  if (!sub) {
      console.error("User ID (sub) is missing. Redirecting to login.");
      // Redirect to login if the sub is not available
      window.location.href = authUrl;
      return;
  }

  try {
      await fetchAllCategories(); // Fetch all categories for the user
  } catch (error) {
      console.error("Failed to load user data:", error);
  }
});


function login() {
  const authUrl = `${config.domain}/login?` +
      // response_type=code +
      "response_type=token" +
      `&client_id=${config.clientId}` +
      `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
      "&scope=openid+aws.cognito.signin.user.admin";
  window.location.href = authUrl;
}

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
  deleteCategoryIcon.addEventListener("click", async function () {
    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      const success = await deleteCategoryFromBackend(categoryName);
  
      if (success) {
        // Remove category from the UI
        categoriesGrid.removeChild(categoryCard);
        removeCategoryFromSidebar(categoryName);
        console.log(`Category "${categoryName}" removed from UI.`);
      }
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
  const sidebarCategories = Array.from(sidebarList.getElementsByClassName("category-link"));

  // Normalize category names for comparison
  const categoryItem = sidebarCategories.find(item =>
    item.textContent.replace("•", "").trim().toLowerCase() === categoryName.toLowerCase()
  );

  if (categoryItem) {
    sidebarList.removeChild(categoryItem);
    console.log(`Removed category "${categoryName}" from the sidebar.`);
  } else {
    console.warn(`Category "${categoryName}" not found in the sidebar.`);
  }
}


// Function to Open the Task Modal
function openTaskModal(categoryContainer) {
  selectedTaskDiv = null; // Clear editing state for a new task
  selectedCategoryContainer = categoryContainer; // Set the selected category container

  // Reset modal title and button text
  document.getElementById("addTaskModalLabel").textContent = "Add Task";
  document.querySelector("#addTaskForm button[type='submit']").textContent = "Add Task";

  // Clear the input fields
  document.getElementById("addTaskForm").reset();

  // Reset counters
  document.getElementById("taskCharCount").textContent = "20 characters remaining";
  document.getElementById("taskCharCount").style.color = "gray";
  document.getElementById("descriptionCharCount").textContent = "200 characters remaining";
  document.getElementById("descriptionCharCount").style.color = "gray";

  // Show the modal
  const taskModal = new bootstrap.Modal(document.getElementById("addTaskModal"));
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

  // Ensure selectedCategoryContainer is set
  if (!selectedCategoryContainer) {
    alert("No category selected. Please open the task modal from a valid category.");
    console.error("No category container selected.");
    return;
  }

  try {
    const categoryName = selectedCategoryContainer.querySelector("h4").textContent;

    if (selectedTaskDiv) {
      // Editing an existing task
      const currentTaskName = selectedTaskDiv.querySelector("h5").textContent;

      const success = await updateTaskInBackend(
        categoryName,
        currentTaskName,
        taskName, // New task name
        taskDescription || "No description provided.",
        taskDate || null,
      );

      if (success) {
        await refreshCategoryTasks(selectedCategoryContainer, categoryName);
      } else {
        console.warn("Failed to update the task in the backend.");
      }
    } else {
      // Adding a new task
      const addedTask = await addTaskToBackend(
        categoryName,
        taskName,
        taskDescription || "No description provided.",
        taskDate || null
      );

      if (addedTask) {
        await refreshCategoryTasks(selectedCategoryContainer, categoryName);
      } else {
        console.warn("Failed to add the task to the backend.");
      }
    }

    // Close the modal and reset the form
    const taskModal = bootstrap.Modal.getInstance(
      document.getElementById("addTaskModal")
    );
    taskModal.hide();

    selectedTaskDiv = null; // Clear the editing state
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

function addTaskToCategory(categoryContainer, name, description = "No description provided.", date = null, status = "In Progress") {
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

  // Check if task is completed, apply done state
  if (status === "Completed") {
    taskDiv.classList.add("task-done");
    const checkIcon = iconsContainer.querySelector(".fa-check");
    checkIcon.classList.replace("fa-check", "fa-undo");
    checkIcon.classList.replace("text-success", "text-secondary");
    checkIcon.title = "Mark as Not Done";
  }

  // Add Click Event to Show Task Details
  taskDiv.addEventListener("click", () => showTaskDetails(taskDiv));
}

function toggleColorPicker() {
  const colorPicker = document.getElementById("colorPicker");
  
  // Check the current display style
  const currentDisplay = window.getComputedStyle(colorPicker).getPropertyValue("display");

  if (currentDisplay === "none") {
    // Show the color picker with !important
    colorPicker.style.setProperty("display", "flex", "important");
  } else {
    // Hide the color picker with !important
    colorPicker.style.setProperty("display", "none", "important");
  }
}

// Function to set the user's name and display a greeting
document.addEventListener("DOMContentLoaded", function () {
  // Function to set the user's name and display a greeting
  function greetUser() {
    const userName = firstName; // Replace this with logic to fetch the actual user's name
    const greetingText = document.getElementById("greetingText");

    if (greetingText) {
      if (userName) {
        greetingText.textContent = `Hello ${userName}`;
      } else {
        greetingText.textContent = "Hello Guest";
      }
    } else {
      console.error("Greeting text element not found!");
    }
  }

  // Call the greetUser function
  greetUser();
});


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

    // Get current task status from UI
    const newStatus = taskDiv.classList.contains("task-done") ? "In Progress" : "Completed";

    // Update task status in the backend
    const categoryName = taskDiv.closest(".category-card").querySelector("h4").textContent;
    updateTaskStatus(categoryName, name, newStatus);  // Send request to update status

    // Toggle task done state in UI
    toggleTaskDoneState(taskDiv, checkIcon, newStatus);
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
function toggleTaskDoneState(taskDiv, checkIcon, newStatus) {
  if (newStatus === "Completed") {
    taskDiv.classList.add("task-done");
    checkIcon.classList.replace("fa-check", "fa-undo");
    checkIcon.classList.replace("text-success", "text-secondary");
    checkIcon.title = "Mark as Not Done";
  } else {
    taskDiv.classList.remove("task-done");
    checkIcon.classList.replace("fa-undo", "fa-check");
    checkIcon.classList.replace("text-secondary", "text-success");
    checkIcon.title = "Mark as Done";
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
  const categoryCard = taskDiv.closest(".category-card"); // Get the category container
  const categoryName = categoryCard.querySelector("h4").textContent; // Get category name
  const taskName = taskDiv.querySelector("h5").textContent; // Get task name

  if (confirm(`Are you sure you want to delete the task "${taskName}"?`)) {
    deleteTaskFromBackend(categoryName, taskName).then((success) => {
      if (success) {
        // Remove task from the UI
        taskDiv.remove();
        console.log(`Task "${taskName}" removed from category "${categoryName}".`);
      }
    });
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

  // Get the category container
  selectedCategoryContainer = taskDiv.closest(".category-card"); // Set the category container

  // Get existing task details
  const taskTitle = taskDiv.querySelector("h5").textContent;
  const taskDesc = taskDiv.querySelector("p").textContent;
  const taskDate =
    taskDiv.querySelector(".task-date")?.textContent.replace("Due: ", "") || "";

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
  const blackButton = document.querySelector("[data-navbar-color='#1a1b18']");
  const blueButton = document.querySelector("[data-navbar-color='#7695ff']");

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

      if (searchValue === "" || categoryText.includes(searchValue)) {
          item.classList.remove("hidden");
          item.style.display = "flex"; // Ensure it uses flex display for visible items
      } else {
          item.classList.add("hidden");
          item.style.display = "none"; // Force hiding
      }
  });
});


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
          taskDetails.dueDate,
          taskDetails.status // Pass status here
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

      // Synchronize with the backend for sorting
      await fetchAllCategories();

      // Scroll to the newly added category
      const newCategoryCard = Array.from(document.querySelectorAll(".category-card")).find(
        (card) => card.querySelector("h4").textContent === categoryName
      );

      if (newCategoryCard) {
        newCategoryCard.scrollIntoView({ behavior: "smooth", block: "center" });
        newCategoryCard.classList.add("highlight"); // Optionally add a highlight effect
        setTimeout(() => newCategoryCard.classList.remove("highlight"), 2000); // Remove highlight after 2 seconds
      }


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

async function deleteCategoryFromBackend(categoryName) {
  try {
    const response = await fetch(`${apiBaseUrl}/DeleteCategory`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user,
        categoryName: categoryName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error deleting category:", errorData.error);
      alert(errorData.error || "Failed to delete category.");
      return false;
    }

    const data = await response.json();
    console.log("Category deleted successfully:", data.message);
    return true;
  } catch (error) {
    console.error("Error during API call to delete category:", error);
    alert("An error occurred while deleting the category. Please try again.");
    return false;
  }
}

async function deleteTaskFromBackend(categoryName, taskName) {
  try {
    const response = await fetch(`${apiBaseUrl}/DeleteTask`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user,
        categoryName: categoryName,
        taskName: taskName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error deleting task:", errorData.error);
      alert(errorData.error || "Failed to delete task.");
      return false;
    }

    const data = await response.json();
    console.log("Task deleted successfully:", data.message);
    return true;
  } catch (error) {
    console.error("Error during API call to delete task:", error);
    alert("An error occurred while deleting the task. Please try again.");
    return false;
  }
}

async function updateTaskInBackend(categoryName, currentTaskName, newTaskName, description, dueDate) {
  try {
    const payload = {
      UserId: user,
      categoryName: categoryName, // Backend expects "categoryName"
      currentTaskName: currentTaskName,
      newTaskName: newTaskName, // Ensure this is included to update the task name
      description: description,
      dueDate: dueDate || null,
    };

    console.log("Updating task with payload:", payload);

    const response = await fetch(`${apiBaseUrl}/UpdateTask`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error updating task:", errorData.error);
      alert(errorData.error || "Failed to update task.");
      return false;
    }

    const data = await response.json();
    console.log("Task updated successfully:", data.message);
    return true;
  } catch (error) {
    console.error("Error during API call to update task:", error);
    alert("An error occurred while updating the task. Please try again.");
    return false;
  }
}

// Function to update task status when the checkIcon is clicked
async function updateTaskStatus(categoryName, taskName, newStatus) {
  try {
    // Ensure all required parameters are sent in the payload
    const payload = {
      userId: user,  // Assuming `user` is your logged-in user ID
      category: categoryName,  // Ensure category is being passed
      taskName: taskName,  // Ensure taskName is being passed
      status: newStatus  // Ensure status is being passed
    };

    console.log("Payload being sent:", payload);  // Debug the payload

    // Send the PUT request to update the task status
    const response = await fetch(`${apiBaseUrl}/updateTaskStatus`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error updating task status:", errorData.error);
      alert(errorData.error || "Failed to update task status.");
      return;
    }

    const data = await response.json();
    console.log("Task status updated successfully:", data.message);

    // Update the task status in the UI after success
    const taskElement = document.querySelector(`#task-${taskName}`);
    if (taskElement) {
      taskElement.querySelector('.status').textContent = newStatus;
    }
  } catch (error) {
    console.error("Error during API call to update task status:", error);
    alert("An error occurred while updating the task status.");
  }
}










