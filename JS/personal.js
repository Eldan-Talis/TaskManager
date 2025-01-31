let selectedCategoryContainer = null; // Tracks the category container for task creation

const apiBaseUrl =
  "https://s5lu00mr08.execute-api.us-east-1.amazonaws.com/prod";

const sub = sessionStorage.getItem('sub');;
const firstName = sessionStorage.getItem("first_name");
const user = sub;
let isCategoryClicked = false;

document.addEventListener("DOMContentLoaded", async () => {
  const authUrl =
    `${config.domain}/login?` +
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
    await applyUserTheme();
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
});

function logout() {
  // Construct the Cognito logout URL
  const logoutUrl =
    "https://us-east-1doxbvaqzz.auth.us-east-1.amazoncognito.com/logout?client_id=646mieltk0s1nidal6scivrlc0&logout_uri=https://taskeld.s3.us-east-1.amazonaws.com/index.html";

  // Clear the session
  clearStorage();
  clearCookies();

  // Redirect to the Cognito logout URL
  window.location.href = logoutUrl;
}

// Helper functions to clear cookies and storage
function clearCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  });
}

function clearStorage() {
  sessionStorage.clear();
}

// Function to show the loading spinner
function showLoadingSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) {
    spinner.style.display = "flex";
  }
}

// Function to hide the loading spinner
function hideLoadingSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) {
    spinner.style.display = "none";
  }
}

// Function to Add a Category Dynamically
function addCategory(categoryName) {
  const categoriesGrid = document.getElementById("categories-grid");

  // Avoid duplicate categories
  const existingCategory = Array.from(
    document.querySelectorAll(".category-card h4")
  ).some((header) => header.textContent === categoryName);

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
    // SweetAlert2 confirmation dialog
    Swal.fire({
      title: `Are you sure?`,
      text: `Do you really want to delete the category "${categoryName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await deleteCategoryFromBackend(categoryName);

        if (success) {
          // Remove category from the UI
          categoriesGrid.removeChild(categoryCard);
          removeCategoryFromSidebar(categoryName);
          Swal.fire(
            "Deleted!",
            `The category "${categoryName}" has been deleted.`,
            "success"
          );
        } else {
          Swal.fire(
            "Error!",
            "Something went wrong while deleting the category.",
            "error"
          );
        }
      }
    });
  });

  // Append Buttons to Container
  buttonContainer.appendChild(addTaskIcon);
  buttonContainer.appendChild(deleteCategoryIcon);

  // Append Elements to Card
  categoryCard.appendChild(buttonContainer);
  categoryCard.appendChild(categoryHeader);

  // **Add a Task List Container**
  const taskList = document.createElement("div");
  taskList.classList.add("task-list"); // You can style this as needed
  categoryCard.appendChild(taskList);

  categoriesGrid.appendChild(categoryCard);

  // Update Sidebar
  addCategoryToSidebar(categoryName);
}

// Function to Add Category to Sidebar
function addCategoryToSidebar(categoryName) {
  const sidebarList = document.getElementById("category-list");

  // Create Sidebar Item
  const sidebarCategory = document.createElement("li");
  sidebarCategory.classList.add("list-group-item", "category-link");

  // Create a container for the dot and category name
  const categoryContainer = document.createElement("div");
  categoryContainer.classList.add("d-flex", "align-items-center", "gap-2");

  // Add a dot icon using Unicode
  const dotIcon = document.createElement("span");
  dotIcon.textContent = "•"; // Unicode for a dot
  dotIcon.classList.add("dot-icon");
  categoryContainer.appendChild(dotIcon);

  // Add category name
  const categoryNameElement = document.createElement("span");
  categoryNameElement.textContent = categoryName;
  categoryNameElement.classList.add("category-name", "flex-grow-1");
  categoryContainer.appendChild(categoryNameElement);

  // Append the container to the sidebar category
  sidebarCategory.appendChild(categoryContainer);

  // Add dropdown container for tasks
  const taskList = document.createElement("ul");
  taskList.classList.add("task-list", "list-group", "d-none"); // Hidden by default
  sidebarCategory.appendChild(taskList);

  // Fetch tasks for the category when it is clicked
  categoryContainer.addEventListener("click", async function () {
    // Clear existing tasks
    taskList.innerHTML = "";

    isCategoryClicked = true;

    // Fetch tasks for the category
    try {
      showLoadingSpinner();
      const tasks = await fetchTasksForCategory(user, categoryName);

      // Add tasks to the dropdown
      tasks.forEach((task) => {
        const taskItem = document.createElement("li");
        taskItem.classList.add("list-group-item", "task-item");

        // Add a dash mark before the task name
        const smallDotIcon = document.createElement("span");
        smallDotIcon.textContent = "• "; // Unicode dash mark
        smallDotIcon.classList.add("small-dot-icon");
        taskItem.appendChild(smallDotIcon);

        // Add the task name
        const taskNameText = document.createTextNode(task.taskName); // Use taskName for display
        taskItem.appendChild(taskNameText);

        // Add click event to open task modal
        taskItem.addEventListener("click", function () {
          showTaskDetailsSidebar({
            taskName: task.taskName,
            description: task.description,
            dueDate: task.dueDate,
            categoryName: categoryName, // Pass the category name for context
          });
        });

        taskList.appendChild(taskItem);
      });

      // Show a message if there are no tasks
      if (tasks.length === 0) {
        const noTasksItem = document.createElement("li");
        noTasksItem.classList.add("list-group-item", "non-task");
        noTasksItem.textContent = "No tasks available.";
        taskList.appendChild(noTasksItem);
      }
    } catch (error) {
      console.error(
        `Failed to fetch tasks for category "${categoryName}":`,
        error
      );
      alert("Unable to fetch tasks. Please try again later.");
    }finally {
      // Hide the loading spinner after the API call completes
      hideLoadingSpinner();
    }

    // Toggle dropdown visibility
    taskList.classList.toggle("d-none");
  });

  sidebarList.appendChild(sidebarCategory);
}

// Function to toggle the color picker visibility and navbar height
function toggleColorPicker() {
  const colorPicker = document.getElementById("colorPicker");
  const navbar = document.querySelector(".navbar");
  const sidebar = document.querySelector(".sidebar");

  // Check the current display style
  const currentDisplay = window.getComputedStyle(colorPicker).getPropertyValue("display");

  if (currentDisplay === "none") {
      // Show the color picker
      colorPicker.style.setProperty("display", "flex", "important");
      // Add the 'expanded' class to the navbar
      sidebar.classList.add("sidebar-extented");
      navbar.classList.add("expanded");
  } else {
      // Hide the color picker
      colorPicker.style.setProperty("display", "none", "important");
      // Remove the 'expanded' class from the navbar
      sidebar.classList.remove("sidebar-extented");
      navbar.classList.remove("expanded");
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

// Function to Remove Category from Sidebar
function removeCategoryFromSidebar(categoryName) {
  const sidebarList = document.getElementById("category-list");
  const sidebarCategories = Array.from(
    sidebarList.getElementsByClassName("category-link")
  );

  // Normalize category names for comparison
  const categoryItem = sidebarCategories.find(
    (item) =>
      item.textContent.replace("•", "").trim().toLowerCase() ===
      categoryName.toLowerCase()
  );

  if (categoryItem) {
    sidebarList.removeChild(categoryItem);
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
  document.querySelector("#addTaskForm button[type='submit']").textContent =
    "Add Task";

  // Clear the input fields
  document.getElementById("addTaskForm").reset();

  // Reset counters
  document.getElementById("taskCharCount").textContent =
    "20 characters remaining";
  document.getElementById("taskCharCount").style.color = "gray";
  document.getElementById("descriptionCharCount").textContent =
    "200 characters remaining";
  document.getElementById("descriptionCharCount").style.color = "gray";

  // Show the modal
  const taskModal = new bootstrap.Modal(
    document.getElementById("addTaskModal")
  );
  taskModal.show();
}

document
  .getElementById("addTaskForm")
  .addEventListener("submit", async function (e) {
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
      alert(
        "No category selected. Please open the task modal from a valid category."
      );
      console.error("No category container selected.");
      return;
    }

    try {

      // Close the modal and reset the form
      const taskModal = bootstrap.Modal.getInstance(
        document.getElementById("addTaskModal")
      );
      taskModal.hide();

      const categoryName =
        selectedCategoryContainer.querySelector("h4").textContent;

      if (selectedTaskDiv) {
        // Editing an existing task
        const currentTaskName = selectedTaskDiv.querySelector("h5").textContent;

        const success = await updateTaskInBackend(
          categoryName,
          currentTaskName,
          taskName, // New task name
          taskDescription || "No description provided.",
          taskDate || null
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

      selectedTaskDiv = null; // Clear the editing state
      document.getElementById("addTaskForm").reset();
      document.getElementById(
        "taskCharCount"
      ).textContent = `${taskNameMaxLength} characters remaining`;
      document.getElementById("taskCharCount").style.color = "gray";
      document.getElementById(
        "descriptionCharCount"
      ).textContent = `${taskDescriptionMaxLength} characters remaining`;
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

function addTaskToCategory(
  categoryContainer,
  name,
  description = "No description provided.",
  date = null,
  status = "In Progress"
) {
  // Check if the task already exists in the category
  const existingTasks = Array.from(
    categoryContainer.querySelectorAll(".task h5")
  ).map((taskTitle) => taskTitle.textContent);

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
  // 1) Sanitize the description
  // 2) Replace newlines with <br>
  const sanitizedDescription = description
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  // hereeeeeeee
  const taskDesc = document.createElement("p");
  // Use `innerHTML` because we’re inserting <br> tags
  taskDesc.innerHTML = sanitizedDescription;
  taskInfo.appendChild(taskDesc);

  // Append the task info to the task container
  taskDiv.appendChild(taskInfo);

  // ...

  // Task Date
  if (date) {
    const taskDate = document.createElement("span");
    taskDate.textContent = "Due: " + date;
    taskDate.classList.add("task-date", "text-muted", "small");
    taskInfo.appendChild(taskDate);
  }

  // Task Actions (Icons)
  const iconsContainer = createTaskIcons(taskDiv, name, description, date);
  // Disable actions for "Late" tasks
  if (status === "Late") {
    taskDiv.classList.add("task-late");

    // Disable the check button
    const checkIcon = iconsContainer.querySelector(".fa-check");
    if (checkIcon) {
      checkIcon.style.pointerEvents = "none"; // Disable click events
      checkIcon.style.opacity = "0.5"; // Dim the icon
      checkIcon.title = "Cannot mark as done for a late task";
    }

    // Disable the edit button
    const editIcon = iconsContainer.querySelector(".fa-edit");
    if (editIcon) {
      editIcon.style.pointerEvents = "none"; // Disable click events
      editIcon.style.opacity = "0.5"; // Dim the icon
      editIcon.title = "Cannot edit a late task";
    }
  }

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
    const newStatus = taskDiv.classList.contains("task-done")
      ? "In Progress"
      : "Completed";

    // Update task status in the backend
    const categoryName = taskDiv
      .closest(".category-card")
      .querySelector("h4").textContent;
    updateTaskStatus(categoryName, name, newStatus); // Send request to update status

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

  // SweetAlert2 confirmation dialog
  Swal.fire({
    title: `Are you sure?`,
    text: `Do you really want to delete the task "${taskName}" from category "${categoryName}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteTaskFromBackend(categoryName, taskName).then((success) => {
        if (success) {
          // Remove task from the UI
          taskDiv.remove();
          Swal.fire(
            "Deleted!",
            `The task "${taskName}" has been deleted.`,
            "success"
          );
        } else {
          Swal.fire(
            "Error!",
            "Something went wrong while deleting the task.",
            "error"
          );
        }
      });
    }
  });
}

// Function to Edit a Task
function editTask(taskDiv) {
  // Check if the task is marked as done
  if (taskDiv.classList.contains("task-done")) {
    alert("You cannot edit a task that is marked as done!");
    return;
  }

  // Set the task div as the currently edited task
  selectedTaskDiv = taskDiv;

  // Get the category container
  selectedCategoryContainer = taskDiv.closest(".category-card");

  // Grab the existing task title
  const taskTitle = taskDiv.querySelector("h5").textContent;
  
  // *** NEW PART *** 
  // Because you replaced newlines with <br> in `addTaskToCategory`,
  // the <p> tag currently contains HTML with <br> tags. We use .innerHTML:
  const rawHtmlDescription = taskDiv.querySelector("p").innerHTML || "";

  // Convert <br> back to \n, and unescape any HTML-escaped characters
  const originalDescription = rawHtmlDescription
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // If there's a date:
  const taskDateSpan = taskDiv.querySelector(".task-date");
  const taskDate = taskDateSpan
    ? taskDateSpan.textContent.replace("Due: ", "")
    : "";

  // Populate your modal fields
  const taskNameInput = document.getElementById("taskNameInput");
  const taskDescriptionInput = document.getElementById("taskDescriptionInput");
  const taskDateInput = document.getElementById("taskDateInput");

  taskNameInput.value = taskTitle;
  taskDescriptionInput.value = originalDescription; // Now has newline chars
  taskDateInput.value = taskDate;

  // Update counters based on existing values
  const taskCharCount = document.getElementById("taskCharCount");
  const descriptionCharCount = document.getElementById("descriptionCharCount");

  // Update Task Name counter
  taskCharCount.textContent = `${20 - taskTitle.length} characters remaining`;
  taskCharCount.style.color = taskTitle.length > 15 ? "red" : "gray";

  // Update Description counter
  descriptionCharCount.textContent = `${
    200 - originalDescription.length
  } characters remaining`;
  descriptionCharCount.style.color =
    originalDescription.length > 180 ? "red" : "gray";

  // Update the modal title and the submit button text
  document.getElementById("addTaskModalLabel").textContent = "Edit Task";
  document.querySelector("#addTaskForm button[type='submit']").textContent =
    "Save Changes";

  // Finally, show the modal
  const taskModal = new bootstrap.Modal(document.getElementById("addTaskModal"));
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
  const categoryCard = taskDiv.closest(".category-card");
  const categoryName = categoryCard.querySelector("h4").textContent;

  // Reference the elements in the modal
  const modalTitle = document.getElementById("taskDetailsModalLabel");
  const modalTaskTitle = document.getElementById("taskDetailTitle");
  const modalTaskDescription = document.getElementById("taskDetailDescription");
  const modalTaskDate = document.getElementById("taskDetailDate");

  // Convert newlines to <br>, and also sanitize for safety
  const sanitizedDescription = taskDescription
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  // Update modal content
  modalTitle.textContent = `Category: ${categoryName}`;
  modalTaskTitle.textContent = taskTitle;
  // Use innerHTML because we’re inserting <br> tags
  modalTaskDescription.innerHTML = sanitizedDescription;
  modalTaskDate.textContent = `Due Date: ${taskDate}`;

  // Show the modal
  const taskDetailsModal = new bootstrap.Modal(
    document.getElementById("taskDetailsModal")
  );
  taskDetailsModal.show();
}

//color picker for background ----------------------------------------

// Call the function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", applyUserTheme);

// Updates the character counter for the Category Name input field in real-time.
document
  .getElementById("categoryNameInput")
  .addEventListener("input", function () {
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
document
  .getElementById("taskDescriptionInput")
  .addEventListener("input", function () {
    const maxLength = 200; // Character limit for Task Description
    const remaining = maxLength - this.value.length; // Calculate remaining characters

    const descriptionCharCount = document.getElementById(
      "descriptionCharCount"
    );
    descriptionCharCount.textContent = `${remaining} characters remaining`;

    // Change text color if nearing or exceeding the limit
    if (remaining < 20) {
      descriptionCharCount.style.setProperty("color", "red", "important"); // Highlight in red
    } else {
      descriptionCharCount.style.setProperty("color", "gray", "important"); // Default color
    }
  });

// Dynamic Search for Category
document
  .getElementById("categorySearch")
  .addEventListener("input", function () {
    const searchValue = this.value.trim().toLowerCase();

    // Select only category items (e.g., those with the class `.category-link`)
    const categoryItems = document.querySelectorAll(
      "#category-list .category-link"
    );

    categoryItems.forEach((categoryItem) => {
      const categoryText = categoryItem
        .querySelector(".category-name")
        .textContent.trim()
        .toLowerCase();

      if (searchValue === "" || categoryText.includes(searchValue)) {
        categoryItem.style.display = "flex"; // Show matching categories
      } else {
        categoryItem.style.display = "none"; // Hide non-matching categories
      }
    });
  });

//get all categories ---------------------
async function fetchAllCategories() {
  try {
    const url = `${apiBaseUrl}/GetAllCategories?userId=${user}`;

    showLoadingSpinner();

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
  finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
  }
}

function displayCategoriesWithTasks(categories) {
  const categoriesGrid = document.getElementById("categories-grid");
  const sidebarList = document.getElementById("category-list");

  // Clear any existing categories
  categoriesGrid.innerHTML = "";
  sidebarList.innerHTML = "";

  // Loop through each category and its tasks
  Object.entries(categories).forEach(([categoryName, tasks]) => {
    // Add category to the grid and sidebar
    addCategory(categoryName);

    // Find the corresponding category card in the grid
    const categoryCard = Array.from(
      document.querySelectorAll(".category-card")
    ).find((card) => card.querySelector("h4").textContent === categoryName);

    if (!categoryCard) {
      console.error(`Category card for "${categoryName}" not found.`);
      return;
    }

    // Select the task list within the category card
    const taskList = categoryCard.querySelector(".task-list");
    if (!taskList) {
      console.error(`Task list for category "${categoryName}" not found.`);
      return;
    }

    // Check if there are no tasks
    if (Object.keys(tasks).length === 0) {
      // Create and append the "No tasks available" message
      const noTasksMessage = document.createElement("p");
      noTasksMessage.textContent = "No tasks available for this category.";
      noTasksMessage.classList.add("text-muted");
      taskList.appendChild(noTasksMessage);
    }

    // If tasks exist, iterate and add them to the category
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

      // Close the modal programmatically
      const addCategoryModal = bootstrap.Modal.getInstance(
        document.getElementById("addCategoryModal")
      );
      addCategoryModal.hide();
      showLoadingSpinner();
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

        // Synchronize with the backend for sorting
        await fetchAllCategories();

        // Clear input field
        categoryNameInput.value = "";

        // Reset the character counter
        const cateCharCount = document.getElementById("cateCharCount");
        cateCharCount.textContent = `${maxLength} characters remaining`;
        cateCharCount.style.color = "gray";
      } else {
        Swal.fire({
          icon: "error",
          title: "Whoops",
          text: data.error || "Failed to add category.",
        });
      }
    } catch (error) {
      alert("An error occurred while adding the category. Please try again.");
      console.error("Error:", error);
    } finally {
      // Hide the loading spinner after the API call completes
      hideLoadingSpinner();
    }
  });

async function addTaskToBackend(categoryName, taskName, description, dueDate) {
  try {
    showLoadingSpinner();
    const response = await fetch(`${apiBaseUrl}/AddTask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      Swal.fire({
        icon: "error",
        title: "Whoops",
        text: errorData.error || "Failed to add the task.",
      });
      return null;
    }

    const data = await response.json();
    return data.task;
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "API Call Error",
      text: "An error occurred while adding the task. Please try again.",
    });
    console.error("Error during API call to add task:", error);
    return null;
  } finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
  }
}

async function fetchTasksForCategory(userId, categoryName) {
  try {
    const response = await fetch(
      `${apiBaseUrl}/GetAllTasks?userId=${userId}&categoryName=${categoryName}`,
      {
        method: "GET",
      }
    );

    if (!response.ok && !isCategoryClicked) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform tasks from object to array if necessary
    if (
      data.tasks &&
      typeof data.tasks === "object" &&
      !Array.isArray(data.tasks)
    ) {
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
      addTaskToCategory(
        categoryContainer,
        task.taskName,
        task.description,
        task.dueDate,
        task.status // Pass status here
      );
    });
  } catch (error) {
    console.error(
      `Failed to refresh tasks for category "${categoryName}":`,
      error
    );
    alert("Unable to refresh tasks. Please try again later.");
  }
}

async function deleteCategoryFromBackend(categoryName) {
  try {
    showLoadingSpinner();
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
    return true;
  } catch (error) {
    console.error("Error during API call to delete category:", error);
    alert("An error occurred while deleting the category. Please try again.");
    return false;
  } finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
  }
}

async function deleteTaskFromBackend(categoryName, taskName) {
  try {
    showLoadingSpinner();
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

    // Close all dropdowns when a task is deleted
    const taskLists = document.querySelectorAll(".task-item, .non-task");
    taskLists.forEach((taskList) => {
      taskList.classList.add("d-none"); // Hide each task list or non-task element
    });

    return true;
  } catch (error) {
    console.error("Error during API call to delete task:", error);
    alert("An error occurred while deleting the task. Please try again.");
    return false;
  } finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
  }
}

async function updateTaskInBackend(
  categoryName,
  currentTaskName,
  newTaskName,
  description,
  dueDate
) {
  try {
    showLoadingSpinner();
    const payload = {
      UserId: user,
      categoryName: categoryName, // Backend expects "categoryName"
      currentTaskName: currentTaskName,
      newTaskName: newTaskName, // Ensure this is included to update the task name
      description: description,
      dueDate: dueDate || null,
    };


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
    return true;
  } catch (error) {
    console.error("Error during API call to update task:", error);
    alert("An error occurred while updating the task. Please try again.");
    return false;
  } finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
  }
}

// Function to update task status when the checkIcon is clicked
async function updateTaskStatus(categoryName, taskName, newStatus) {
  try {
    // Ensure all required parameters are sent in the payload
    const payload = {
      userId: user, // Assuming `user` is your logged-in user ID
      category: categoryName, // Ensure category is being passed
      taskName: taskName, // Ensure taskName is being passed
      status: newStatus, // Ensure status is being passed
    };


    // Send the PUT request to update the task status
    const response = await fetch(`${apiBaseUrl}/updateTaskStatus`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
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

    // Update the task status in the UI after success
    const taskElement = document.querySelector(`#task-${taskName}`);
    if (taskElement) {
      taskElement.querySelector(".status").textContent = newStatus;
    }
  } catch (error) {
    console.error("Error during API call to update task status:", error);
    alert("An error occurred while updating the task status.");
  }
}

function showTaskDetailsSidebar(task) {
  const { taskName, description, dueDate, categoryName } = task;

  // Update the modal content
  document.getElementById(
    "taskDetailsModalLabel"
  ).textContent = `Category: ${categoryName}`; // Change modal title
  document.getElementById("taskDetailTitle").textContent = taskName;
  document.getElementById("taskDetailDescription").textContent =
    description || "No description available.";
  document.getElementById("taskDetailDate").textContent = `Due Date: ${
    dueDate || "No due date provided."
  }`;

  // Show the modal
  const taskDetailsModal = new bootstrap.Modal(
    document.getElementById("taskDetailsModal")
  );
  taskDetailsModal.show();
}

//speechToText

// Helper function for Speech-to-Text
function addSpeechToText(buttonId, inputId, charCountId, maxLength) {
  document.getElementById(buttonId).addEventListener("click", function () {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech-to-Text is not supported in this browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US"; // Set language
    recognition.interimResults = false; // Only final results

    recognition.start();

    recognition.onstart = function () {
      console.log("Speech recognition started...");
    };

    recognition.onresult = function (event) {
      let transcript = event.results[0][0].transcript;

      // Truncate the transcript if it exceeds the max length
      if (transcript.length > maxLength) {
        transcript = transcript.substring(0, maxLength);
      }

      const inputField = document.getElementById(inputId);

      // Update the input field with recognized speech
      inputField.value = transcript;

      // Update character counter
      const remaining = maxLength - transcript.length;
      const charCount = document.getElementById(charCountId);
      charCount.textContent = `${remaining} characters remaining`;
      charCount.style.color = remaining < 0 ? "red" : "gray";

    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      alert("An error occurred during speech recognition. Please try again.");
    };

    recognition.onend = function () {
      console.log("Speech recognition ended.");
    };
  });
}

// Add Speech-to-Text for Task Name and Task Description
addSpeechToText("speechTaskName", "taskNameInput", "taskCharCount", 20);
addSpeechToText(
  "speechTaskDescription",
  "taskDescriptionInput",
  "descriptionCharCount",
  200
);

// Speech-to-Text for category name input
document.getElementById("speechButton").addEventListener("click", function () {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech-to-Text is not supported in this browser.");
    return;
  }

  const maxLength = 20; // Character limit for the input field
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US"; // Set language
  recognition.interimResults = false; // Only final results

  recognition.start();

  recognition.onstart = function () {
    console.log("Speech recognition started...");
  };

  recognition.onresult = function (event) {
    let transcript = event.results[0][0].transcript;

    // Truncate the transcript if it exceeds the max length
    if (transcript.length > maxLength) {
      transcript = transcript.substring(0, maxLength);
    }

    const categoryNameInput = document.getElementById("categoryNameInput");

    // Update the input field with recognized speech
    categoryNameInput.value = transcript;

    // Update character counter
    const remaining = maxLength - transcript.length;
    const cateCharCount = document.getElementById("cateCharCount");
    cateCharCount.textContent = `${remaining} characters remaining`;
    cateCharCount.style.color = remaining < 0 ? "red" : "gray";

    console.log("Recognized text (truncated):", transcript);
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
    alert("An error occurred during speech recognition. Please try again.");
  };

  recognition.onend = function () {
    console.log("Speech recognition ended.");
  };
});


/**
 * Triggered when the TaskELD Logo is clicked.
 * Fetches Cognito users, populates the modal, then shows it.
 */
function openUserManagementForm() {
  fetchUserData()
    .then(users => {
      // Populate the modal with the user data
      populateUserManagementModal(users);

      hideLoadingSpinner();

      // Show the Bootstrap modal
      const userModal = new bootstrap.Modal(
        document.getElementById("userManagementModal")
      );
      userModal.show();
    })
    .catch(error => {
      console.error("Error fetching user data:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Load Users",
        text: "Unable to retrieve user data at this time."
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("taskeldLogo");
  
  if (userIsAdmin()) {
    // Make logo clickable
    logo.style.cursor = "pointer";
    logo.addEventListener("click", openUserManagementForm);
  } else {
    logo.style.cursor = "default";
  }
});


function userIsAdmin() {
  const groupsRaw = sessionStorage.getItem('groups');
  if (!groupsRaw) return false;
  try {
    const groups = JSON.parse(groupsRaw);
    return groups.includes("Admins");
  } catch (err) {
    console.error("Failed to parse user groups from storage:", err);
    return false;
  }
}

/**
 * Fetches all Cognito users from your backend
 * which internally calls the "GetAllCognitoUsers" Lambda.
 */
async function fetchUserData() {
  showLoadingSpinner();
  // This endpoint should invoke your Lambda that returns { "users": [...] }
  const response = await fetch(`${apiBaseUrl}/GetAllCognitoUsers`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  const data = await response.json();
  // Expecting data to look like: { "users": [{ sub, email, first_name, last_name }, ...] }
  return data.users; 
}

/**
 * Builds an HTML table (or any UI) of user info (sub, email, etc.),
 * plus a "Delete" button that calls deleteUser(sub).
 */
function populateUserManagementModal(usersArray) {
  const container = document.getElementById("userManagementContent");
  container.innerHTML = ""; // Clear old data

  if (!Array.isArray(usersArray) || usersArray.length === 0) {
    container.innerHTML = "<p>No users found.</p>";
    return;
  }

  // Create a table
  const table = document.createElement("table");
  table.classList.add("table", "table-striped", "table-hover");

  // Table header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>sub</th>
      <th>Email</th>
      <th>First Name</th>
      <th>Last Name</th>
      <th>Action</th>
    </tr>
  `;
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement("tbody");
  usersArray.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.sub || ""}</td>
      <td>${user.email || ""}</td>
      <td>${user.first_name || ""}</td>
      <td>${user.last_name || ""}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.sub}')">
          Delete
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // Finally, attach the table to the container
  container.appendChild(table);
}

/**
 * Deletes the user from Cognito. This calls your backend,
 * which in turn calls Cognito's AdminDeleteUser or similar.
 */
async function deleteUser(sub) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the user from Cognito.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete user"
  });

  if (!result.isConfirmed) {
    return; // user canceled
  }

  try {
    showLoadingSpinner();
    const response = await fetch(`${apiBaseUrl}/DeleteCognitoUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sub: sub })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete user");
    }

    Swal.fire("Deleted!", "User has been deleted from Cognito.", "success");

    // Refresh the table to show updated list
    const updatedUsers = await fetchUserData();
    populateUserManagementModal(updatedUsers);

  } catch (error) {
    console.error("Error deleting user:", error);
    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: error.message || "Could not delete user."
    });
  } finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
  }
}


