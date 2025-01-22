const apiBaseUrl =
  "https://s5lu00mr08.execute-api.us-east-1.amazonaws.com/prod";

const sub = sessionStorage.getItem('sub');
//const sub = "c428e4e8-0001-7059-86d2-4c253a8a6994";
//const sub = "e408d428-a041-7069-ace8-579db3cbd3a7";
//const sub = "34d83408-40b1-707b-f80b-cbdc8e287b90";
const firstName = sessionStorage.getItem("first_name");
const user = sub;
console.log("Sub:", sub);

let selectedCategoryContainerColor = null;
let selectedTeamId = null; // Store the selected team ID
let loadingCounter = 0;

// Function to get the selected team ID
function getSelectedTeamId() {
  return selectedTeamId;
}

// Function to set the selected team ID when a team is clicked
function setSelectedTeamId(teamId) {
  selectedTeamId = teamId;
}

// Function to toggle the color picker visibility
function toggleColorPicker() {
  const colorPicker = document.getElementById("colorPicker");

  // Check the current display style
  const currentDisplay = window
    .getComputedStyle(colorPicker)
    .getPropertyValue("display");

  if (currentDisplay === "none") {
    // Show the color picker with !important
    colorPicker.style.setProperty("display", "flex", "important");
  } else {
    // Hide the color picker with !important
    colorPicker.style.setProperty("display", "none", "important");
  }
}

// Function to set the theme based on user preferences
function applyUserTheme() {
  // Check if the user prefers dark mode
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Select the black and blue buttons
  const blackButton = document.querySelector("[data-navbar-color='#1a1b18']");
  const blueButton = document.querySelector("[data-navbar-color='#7695ff']");

  if (prefersDarkMode && blackButton) {
    blackButton.click(); // Simulate a click on the black button
  } else if (blueButton) {
    blueButton.click(); // Simulate a click on the blue button
  }
}

// Call the function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", applyUserTheme);

// Select all color picker buttons
const colorButtons = document.querySelectorAll(".color-picker button");

// Add click event listener to each button
colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedNavbarColor = button.getAttribute("data-navbar-color");
    const selectedSidebarColor = button.getAttribute("data-sidebar-color");
    selectedCategoryContainerColor = button.getAttribute("data-category-color");

    const navbar = document.querySelector(".navbar");
    const sidebar = document.querySelector(".sidebar");
    const categoryCards = document.querySelectorAll(".category-card");

    // Set the background color directly for navbar and sidebar
    navbar.style.setProperty(
      "background-color",
      selectedNavbarColor,
      "important"
    );
    sidebar.style.setProperty(
      "background-color",
      selectedSidebarColor,
      "important"
    );

    // Set the background color for all category cards
    categoryCards.forEach((categoryCard) => {
      categoryCard.style.setProperty(
        "background-color",
        selectedCategoryContainerColor,
        "important"
      );
    });
  });
});

// Logout function
function logout() {
  // Construct the Cognito logout URL
  const logoutUrl =
    "https://us-east-1doxbvaqzz.auth.us-east-1.amazoncognito.com/logout?client_id=646mieltk0s1nidal6scivrlc0&logout_uri=https://taskmanager-led.s3.us-east-1.amazonaws.com/index.html";

  // Clear the session
  clearStorage();
  clearCookies();

  // Redirect to the Cognito logout URL
  window.location.href = logoutUrl;
}

// Handle joining a team
document.addEventListener("DOMContentLoaded", () => {
  const teamCodeInput = document.getElementById("teamCodeInput");
  const teamCodeError = document.getElementById("teamCodeError");

  // Handle form submission
  const joinTeamForm = document.getElementById("joinTeamForm");
  // Handle form submission for joining a team
  joinTeamForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const teamCode = teamCodeInput.value.trim();

    // Validate team code length
    if (teamCode.length !== 8) {
      teamCodeError.style.display = "block";
      return;
    }

    teamCodeError.style.display = "none";

    // Prepare the request payload
    const payload = {
      teamId: teamCode,
      userId: sub, // User's sub (from your frontend logic)
    };

    try {
      // Make the API call to join the team
      const response = await fetch(`${apiBaseUrl}/JoinTeam`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error joining team:", errorData.message);
        alert(errorData.message || "Failed to join the team.");
        return;
      }

      const data = await response.json();
      console.log("Successfully joined the team:", data.message);

      // Reload the teams to reflect the changes
      await loadTeams();

      // Reset the form
      teamCodeInput.value = "";

      // Close the modal
      const joinTeamModal = bootstrap.Modal.getInstance(
        document.getElementById("joinTeamModal")
      );
      joinTeamModal.hide();

      alert("Successfully joined the team!");
    } catch (error) {
      console.error("Error during API call to join team:", error);
      alert("An error occurred while trying to join the team. Please try again.");
    }
  });


  // Hide error message on input
  teamCodeInput.addEventListener("input", () => {
    if (teamCodeInput.value.trim().length === 8) {
      teamCodeError.style.display = "none";
    }
  });
});

// Load teams from the backend
async function loadTeams() {
  try {
    const endpoint = `${apiBaseUrl}/GetAllTeams`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user }), // Dynamically pass the user ID
    });

    let teams = [];

    if (response.status === 404) {
      // No teams found for the user
      console.warn("No teams found for the user.");

      // Create and append the friendly message container
      const friendlyMessageContainer = document.getElementById("teams-message");
      friendlyMessageContainer.innerHTML = "";

      // Set the message text with a line break using <br>
      friendlyMessageContainer.innerHTML =
        "You have no teams yet. &nbsp; Create a new team or join an existing one to get started.";

      return; // Exit the function as there's nothing more to do
    } else if (!response.ok) {
      throw new Error(`Failed to fetch team data: ${response.statusText}`);
    } else {
      teams = await response.json();
      // Ensure teams is an array
      if (!Array.isArray(teams)) {
        console.error("Expected teams to be an array:", teams);
        alert("Unexpected data format received from the server.");
        return;
      }
    }

    // Sort the teams alphabetically in a case-insensitive manner
    teams.sort((a, b) => {
      const nameA = a.teamName.toLowerCase();
      const nameB = b.teamName.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

    const teamsList = document.getElementById("teams-list");

    teamsList.innerHTML = ""; // Clear current list

    // Populate the list with sorted teams
    teams.forEach((team) => {
      const listItem = document.createElement("li");
      listItem.classList.add("list-group-item", "teams-link");
      const teamContainer = document.createElement("div");
      teamContainer.classList.add("d-flex", "align-items-center", "gap-2");

      const dotIcon = document.createElement("span");
      dotIcon.textContent = "•";
      dotIcon.classList.add("dot-icon");
      teamContainer.appendChild(dotIcon);

      const teamNameElement = document.createElement("span");
      teamNameElement.textContent = team.teamName;
      teamNameElement.classList.add("category-name", "flex-grow-1");
      teamContainer.appendChild(teamNameElement);

      listItem.appendChild(teamContainer);
      listItem.dataset.teamId = team.teamId; // Store the teamId

      // When the team is clicked, set the selected team ID and load categories
      listItem.addEventListener("click", () => {
        setSelectedTeamId(team.teamId); // Store the selected team ID

        // Create and append the friendly message container with 'X' icon
        const friendlyMessageContainer =
          document.getElementById("teams-message");
        friendlyMessageContainer.innerHTML = ""; // Clear previous content

        // Create a container div for the message and 'X' icon
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("team-container");

        // Team message
        const teamMessage = document.createElement("span");
        teamMessage.classList.add("team-message"); // Add a specific class for styling

        // Add the team name
        teamMessage.textContent = `Current Team: ${team.teamName} | Invite ID: `;

        // Make the Invite ID clickable
        const inviteIdLink = document.createElement("a");
        inviteIdLink.textContent = `${team.teamId}`;
        inviteIdLink.href = "#"; 
        inviteIdLink.classList.add("invite-id-link"); 
        inviteIdLink.title = "Click to copy Invite ID";

        // Add click event to copy the Invite ID to the clipboard
        inviteIdLink.addEventListener("click", (event) => {
          event.preventDefault(); // Prevent any default behavior of the anchor tag
          navigator.clipboard
            .writeText(team.teamId)
            .then(() => {
              Swal.fire({
                icon: "success",
                title: "Copied!",
                text: "Invite ID copied to clipboard!",
                timer: 1000, // Auto-close after 2 seconds
                showConfirmButton: false, // No confirmation button
              });
            })
            .catch(() => {
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Failed to copy Invite ID.",
                timer: 1000, // Auto-close after 2 seconds
                showConfirmButton: false, // No confirmation button
              });
            });
        });
        

        // Append the Invite ID link to the team message
        teamMessage.appendChild(inviteIdLink);

        // Append the team message to the container
        messageContainer.appendChild(teamMessage);

        // 'Open Door' icon/button
        const leaveTeamBtn = document.createElement("button");
        leaveTeamBtn.innerHTML = '<i class="bx bxs-exit"></i>';
        leaveTeamBtn.classList.add("leave-team-btn");
        leaveTeamBtn.title = "Leave Team";

        // Add event listener to 'Open Door' button
        leaveTeamBtn.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent triggering the parent click event
          promptLeaveTeam(team);
        });

        messageContainer.appendChild(leaveTeamBtn);

        friendlyMessageContainer.appendChild(messageContainer);

        // Add an <hr> under the team container
        const separator = document.createElement("hr");
        separator.classList.add("team-separator"); // Add a CSS class for styling
        friendlyMessageContainer.appendChild(separator);

        console.log(`Team selected: ${team.teamName} (ID: ${team.teamId})`);
        loadCategoriesForTeam(team.teamId); // Call function to load categories
      });

      teamsList.appendChild(listItem);
    });

    // Optionally, trigger click on the first team if exists
    if (teams.length > 0) {
      const firstTeamItem = teamsList.querySelector("li");
      firstTeamItem.click(); // Simulate a click on the first team
    }
  } catch (error) {
    console.error("Error loading teams:", error);
    alert("An error occurred while loading teams. Please try again later.");
  }
}

// Call the function to load the teams when the page is loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Load teams first
  await loadTeams();

  // Once teams are loaded, trigger the click event on the first item
  const teamsList = document.getElementById("teams-list");
  const teams = teamsList.querySelectorAll("li");

  if (teams.length > 0) {
    const firstTeamItem = teams[0];
    firstTeamItem.click(); // Simulate a click on the first team
  }
});

// Handle creating a new category
document.addEventListener("DOMContentLoaded", () => {
  const categoryNameInput = document.getElementById("categoryNameInput");
  const cateCharCount = document.getElementById("cateCharCount");

  // Update character count dynamically as the user types in the input field
  categoryNameInput.addEventListener("input", () => {
    const remaining = 20 - categoryNameInput.value.length;
    cateCharCount.textContent = `${remaining} characters remaining`;
  });

  // Handle the form submission for creating a new category
  const addCategoryForm = document.getElementById("addCategoryForm");

  addCategoryForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    const categoryName = categoryNameInput.value.trim();

    if (!categoryName) {
      alert("Category name cannot be empty.");
      return;
    }

    console.log("Category name captured:", categoryName); // Debugging output

    const teamId = getSelectedTeamId(); // Ensure a team is selected

    if (!teamId) {
      alert("Please select a team first.");
      return;
    }

    // Add the category to the backend
    const response = await addCategoryToBackend(teamId, categoryName);

    if (response) {
      // If the category was added successfully, close the modal
      const addCategoryModal = bootstrap.Modal.getInstance(
        document.getElementById("addCategoryModal")
      );
      addCategoryModal.hide();

      // Reset the input field and character count when the modal is closed
      categoryNameInput.value = ""; // Reset input
      cateCharCount.textContent = "20 characters remaining"; // Reset character count

      // Optionally, you could update the category list or refresh it
      loadCategoriesForTeam(teamId);
    }
  });

  // Reset the input and character count when the modal is closed
  const addCategoryModalElement = document.getElementById("addCategoryModal");
  addCategoryModalElement.addEventListener("hidden.bs.modal", () => {
    categoryNameInput.value = ""; // Reset input when modal is closed
    cateCharCount.textContent = "20 characters remaining"; // Reset character count
  });
});

// Handle creating a new team
document.addEventListener("DOMContentLoaded", () => {
  const teamNameInput = document.getElementById("teamNameInput");
  const teamCharCount = document.getElementById("teamCharCount");

  // Update character count dynamically
  teamNameInput.addEventListener("input", () => {
    const remaining = 20 - teamNameInput.value.length;
    teamCharCount.textContent = `${remaining} characters remaining`;
  });

  // Handle New Team Form submission
  const newTeamForm = document.getElementById("newTeamForm");
  newTeamForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    const teamName = teamNameInput.value.trim(); // Get trimmed input value

    console.log("Team name captured:", teamName); // Debugging output

    // Check if the team name is empty
    if (!teamName) {
      alert("Team name cannot be empty.");
      return;
    }

    /// Prepare the body for the request
    const requestBody = {
      TeamName: teamName,
      sub, // User's sub (userId)
    };

    console.log("Request body being sent:", JSON.stringify(requestBody)); // Log the request body

    try {
      // Make API call to Lambda function to create a new team
      const response = await fetch(`${apiBaseUrl}/CreateTeam`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody), // Directly pass the stringified object
      });
      console.log("API Response Status:", response.status); // Debugging log for response status

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create team.");
      }

      const data = await response.json();
      console.log("Team created successfully:", data);

      loadTeams();

      // Reset the form
      teamNameInput.value = "";
      teamCharCount.textContent = "20 characters remaining";

      // Close the modal
      const newTeamModal = bootstrap.Modal.getInstance(
        document.getElementById("newTeamModal")
      );
      newTeamModal.hide();
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team. Please try again.");
    }
  });
});

// Function to add a category to the backend
async function addCategory(categoryName) {
  const teamId = getSelectedTeamId(); // Get the selected teamId

  if (!teamId) {
    alert("Please select a team first.");
    return;
  }

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

  const response = await addCategoryToBackend(teamId, categoryName); // Pass teamId to the API call

  if (response) {
    // Call to render category in the UI after successfully adding
    addCategoryToUI(categoryName);
  }
}

// Function to add a category to the backend
async function addCategoryToBackend(teamId, categoryName) {
  try {
    const response = await fetch(`${apiBaseUrl}/AddTeamCategory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamId: teamId, // Pass the teamId
        categoryName: categoryName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error adding category:", data.error);
      alert(data.error || "Failed to add category.");
      return false;
    }

    console.log("Category added successfully:", data.message);
    return true;
  } catch (error) {
    console.error("Error during API call to add category:", error);
    alert("An error occurred while adding the category. Please try again.");
    return false;
  }
}

// Function to load categories for a team
async function loadCategoriesForTeam(teamId) {
  try {
    const endpoint = `${apiBaseUrl}/GetTeamCategories`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamId: teamId }), // Ensure teamId is in the body
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch categories for team: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Assuming the categories might be returned as an object
    let categories = data.categories;

    // Check if categories is an object and convert it to an array of category objects
    if (typeof categories === "object" && !Array.isArray(categories)) {
      categories = Object.keys(categories).map((key) => ({
        categoryName: key,
        categoryDetails: categories[key],
      }));
    }

    const categoriesGrid = document.getElementById("categories-grid");
    categoriesGrid.innerHTML = ""; // Clear previous categories

    // Now categories should be an array, you can use forEach
    categories.forEach((category) => {
      // Display each category
      const categoryCard = addCategoryToUI(category.categoryName);

      // Fetch and display tasks for each category
      refreshCategoryTasks(categoryCard, category.categoryName);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

// Function to display category on the UI
function addCategoryToUI(categoryName) {
  const categoriesGrid = document.getElementById("categories-grid");

  const categoryCard = document.createElement("div");
  categoryCard.classList.add("category-card", "position-relative");
  categoryCard.style.setProperty(
    "background-color",
    selectedCategoryContainerColor,
    "important"
  );

  const categoryHeader = document.createElement("h4");
  categoryHeader.textContent = categoryName;

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
        console.log("Category to delete:", categoryName);
        const success = await deleteCategoryFromBackend(
          selectedTeamId,
          categoryName
        );

        if (success) {
          // Remove category from the UI
          categoriesGrid.removeChild(categoryCard);
          console.log(`Category "${categoryName}" removed from UI.`);
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

  buttonContainer.appendChild(addTaskIcon);
  buttonContainer.appendChild(deleteCategoryIcon);
  categoryCard.appendChild(buttonContainer);
  categoryCard.appendChild(categoryHeader);
  categoriesGrid.appendChild(categoryCard);

  return categoryCard; // Return the created category card
}

// Function to delete a category from the backend
async function deleteCategoryFromBackend(teamId, categoryName) {
  try {
    console.log("Payload sent to backend:", {
      teamId: teamId,
      categoryName: categoryName,
    });

    const response = await fetch(`${apiBaseUrl}/DeleteTeamCategory`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamId: teamId,
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

// Function to open the task modal
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

// Handle adding or editing a task
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
          selectedTeamId,
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

// Handle clicking the add category button
document.getElementById("add-category-btn").addEventListener("click", () => {
  selectedTaskDiv = null; // Clear editing state
  document.getElementById("addTaskModalLabel").textContent = "Add Task"; // Reset modal title
  document.querySelector("#addTaskForm button[type='submit']").textContent =
    "Add Task"; // Reset button text
  document.getElementById("addTaskForm").reset(); // Clear the form fields
});

// Function to add a task to the backend
async function addTaskToBackend(
  teamId,
  categoryName,
  taskName,
  description,
  dueDate,
  status = "In Progress"
) {
  const apiEndpoint = `${apiBaseUrl}/AddTeamTask`; // Update with your API Gateway endpoint

  const payload = {
    teamId: teamId,
    categoryName: categoryName,
    taskName: taskName,
    description: description || "No description provided",
    dueDate: dueDate || null,
    status: status,
  };

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error adding task:", errorData.error);
      alert(errorData.error || "Failed to add task.");
      return null;
    }

    const data = await response.json();
    console.log("Task added successfully:", data.message);
    return data; // Return the added task details
  } catch (error) {
    console.error("Error during API call to add task:", error);
    alert("An error occurred while adding the task. Please try again.");
    return null;
  }
}

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

// Function to add a task to the UI
// Function to add a task to the UI
function addTaskToCategory(categoryContainer, task) {
  const status = task.status || "In Progress"; // Extract status from task object

  // Check if the task already exists in the category
  const existingTasks = Array.from(
    categoryContainer.querySelectorAll(".task h5")
  ).map((taskTitle) => taskTitle.textContent);

  if (existingTasks.includes(task.taskName)) {
    alert(`A task named "${task.taskName}" already exists in this category.`);
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
  taskDiv.classList.add(
    "task",
    "position-relative",
    "p-2",
    "mb-2",
    "rounded",
    "border"
  );

  // Add categoryName as a data attribute
  const categoryName = categoryContainer.querySelector("h4").textContent;
  taskDiv.dataset.categoryName = categoryName;

  // Task Info Section
  const taskInfo = document.createElement("div");

  // Task Title
  const taskTitle = document.createElement("h5");
  taskTitle.textContent = task.taskName;
  taskInfo.appendChild(taskTitle);

  // Task Description
  const taskDesc = document.createElement("p");
  taskDesc.textContent = task.description || "No description provided.";
  taskInfo.appendChild(taskDesc);

  // Task Date
  if (task.dueDate) {
    const taskDate = document.createElement("span");
    taskDate.textContent = "Due: " + task.dueDate;
    taskDate.classList.add("task-date", "text-muted", "small");
    taskInfo.appendChild(taskDate);
  }

  // Add Actions to the Task
  const actions = createTaskActions(task, taskDiv, categoryContainer);

  // Apply Status-based Styling and Actions
  if (status === "Completed") {
    taskDiv.classList.add("task-done");
    const checkIcon = actions.querySelector(".fa-check");
    if (checkIcon) {
      checkIcon.classList.replace("fa-check", "fa-undo");
      checkIcon.classList.replace("text-success", "text-secondary");
      checkIcon.title = "Mark as Not Done";
    }
  } else if (status === "Late") {
    taskDiv.classList.add("task-late");

    const disableIcons = ["fa-check", "fa-edit"];
    disableIcons.forEach((iconClass) => {
      const icon = actions.querySelector(`.${iconClass}`);
      if (icon) {
        icon.style.pointerEvents = "none";
        icon.style.opacity = "0.5";
        icon.title = `Cannot perform this action on a late task`;
      }
    });
  }

  // Append Info and Actions to Task Div
  taskDiv.appendChild(taskInfo);
  taskDiv.appendChild(actions);

  // Add Task to the List
  taskList.appendChild(taskDiv);

  // Add Click Event to Show Task Details
  taskDiv.addEventListener("click", () => showTaskDetails(taskDiv));
}

// Function to create task action icons
function createTaskActions(task, taskDiv, categoryContainer) {
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
    const categoryName = taskDiv.dataset.categoryName;
    updateTaskStatus(categoryName, task.taskName, newStatus); // Send request to update status

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
    editTask(taskDiv, task);
  });
  iconsContainer.appendChild(editIcon);

  // Delete Icon
  const deleteIcon = document.createElement("i");
  deleteIcon.classList.add("fas", "fa-trash", "text-danger", "cursor-pointer");
  deleteIcon.title = "Delete Task";

  deleteIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteTask(taskDiv); // Pass the correct DOM element (taskDiv)
  });
  iconsContainer.appendChild(deleteIcon);

  return iconsContainer;
}

// Dynamic Search for Category
document
  .getElementById("categorySearch")
  .addEventListener("input", function () {
    const searchValue = this.value.trim().toLowerCase();

    // Select only category items (e.g., those with the class `.category-link`)
    const categoryItems = document.querySelectorAll("#teams-list .teams-link");

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

// Function to delete a task
function deleteTask(taskDivOrTaskObject) {
  let categoryName, taskName;

  if (taskDivOrTaskObject instanceof HTMLElement) {
    categoryName = taskDivOrTaskObject.dataset.categoryName;
    taskName = taskDivOrTaskObject.querySelector("h5").textContent;
    console.log("Deleting Task via DOM Element:", { categoryName, taskName });
  } else if (
    typeof taskDivOrTaskObject === "object" &&
    taskDivOrTaskObject.taskName
  ) {
    // If you must handle task objects, ensure they include categoryName
    categoryName = taskDivOrTaskObject.categoryName;
    taskName = taskDivOrTaskObject.taskName;
    console.log("Deleting Task via Task Object:", { categoryName, taskName });
  } else {
    console.error("Invalid input passed to deleteTask:", taskDivOrTaskObject);
    return;
  }

  if (!categoryName || !taskName) {
    console.error("Missing categoryName or taskName:", {
      categoryName,
      taskName,
    });
    return;
  }

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
      deleteTaskFromBackend(selectedTeamId, categoryName, taskName).then(
        (success) => {
          if (success) {
            // If it was a DOM element, remove it from the UI
            if (taskDivOrTaskObject instanceof HTMLElement) {
              taskDivOrTaskObject.remove();
            }
            console.log(
              `Task "${taskName}" removed from category "${categoryName}".`
            );
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
        }
      );
    }
  });
}

// Function to delete a task from the backend
async function deleteTaskFromBackend(teamId, categoryName, taskName) {
  if (!teamId) {
    console.error("selectedTeamId is undefined or null.");
    alert("No team selected. Please select a team before deleting tasks.");
    return false;
  }

  const apiEndpoint = `${apiBaseUrl}/DeleteTeamTask`; // Replace with your API endpoint

  const payload = {
    teamId: teamId,
    categoryName: categoryName,
    taskName: taskName,
  };

  console.log("Payload being sent to API:", payload);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST", // Assuming the API accepts POST requests
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Send payload as JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error deleting task:", errorData.error);
      alert(errorData.error || "Failed to delete task.");
      return false;
    }

    const data = await response.json();
    console.log("Task deleted successfully:", data.message);
    return true; // Indicate success
  } catch (error) {
    console.error("Error during API call to delete task:", error);
    alert("An error occurred while deleting the task. Please try again.");
    return false; // Indicate failure
  }
}

// Function to refresh tasks for a category
async function refreshCategoryTasks(categoryContainer, categoryName) {
  try {
    const tasks = await fetchTasksForCategory(selectedTeamId, categoryName);

    let taskList = categoryContainer.querySelector(".task-list");
    if (!taskList) {
      taskList = document.createElement("div");
      taskList.classList.add("task-list");
      categoryContainer.appendChild(taskList);
    }

    // Clear existing tasks
    taskList.innerHTML = "";

    if (tasks.length === 0) {
      // Handle case when there are no tasks for the category
      const noTasksMessage = document.createElement("p");
      noTasksMessage.textContent = "No tasks available for this category.";
      noTasksMessage.classList.add("text-muted");
      taskList.appendChild(noTasksMessage);
      return;
    }

    // Iterate over tasks and add them to the category
    tasks.forEach((task) => {
      addTaskToCategory(categoryContainer, task);
    });
  } catch (error) {
    console.error(
      `Failed to refresh tasks for category "${categoryName}":`,
      error
    );
    alert("Unable to refresh tasks. Please try again later.");
  }
}

// Function to fetch tasks for a category from the backend
async function fetchTasksForCategory(teamID, categoryName) {
  try {
    const encodedTeamID = encodeURIComponent(teamID);
    const encodedCategoryName = encodeURIComponent(categoryName);

    const response = await fetch(
      `${apiBaseUrl}/GetAllTeamTasks?teamId=${encodedTeamID}&categoryName=${encodedCategoryName}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Handle the case where the category or tasks don't exist
        return [];
      }
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();

    if (
      data.tasks &&
      typeof data.tasks === "object" &&
      !Array.isArray(data.tasks)
    ) {
      return Object.entries(data.tasks).map(([taskName, taskDetails]) => ({
        taskName,
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

// Function to show task details in a modal
function showTaskDetails(taskDiv) {
  const taskTitle = taskDiv.querySelector("h5").textContent;
  const taskDescription = taskDiv.querySelector("p").textContent;
  const taskDateSpan = taskDiv.querySelector(".task-date");
  const taskDate = taskDateSpan
    ? taskDateSpan.textContent.replace("Due: ", "")
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

// Function to toggle task completion state
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

// Function to update task status in the backend
async function updateTaskStatus(categoryName, taskName, newStatus) {
  if (!selectedTeamId) {
    console.error("selectedTeamId is undefined or null.");
    alert("No team selected. Please select a team before updating tasks.");
    return false;
  }

  const apiEndpoint = `${apiBaseUrl}/UpdateTeamTaskStatus`; // Replace with your API endpoint

  const payload = {
    teamId: selectedTeamId,
    categoryName: categoryName,
    taskName: taskName,
    status: newStatus,
  };

  console.log("Payload being sent to API for status update:", payload);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST", // Assuming the API accepts POST requests
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Send payload as JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error updating task status:", errorData.error);
      alert(errorData.error || "Failed to update task status.");
      return false;
    }

    const data = await response.json();
    console.log("Task status updated successfully:", data.message);
    return true;
  } catch (error) {
    console.error("Error during API call to update task status:", error);
    alert(
      "An error occurred while updating the task status. Please try again."
    );
    return false;
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

  descriptionCharCount.textContent = `${
    200 - taskDesc.length
  } characters remaining`;
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

async function updateTaskInBackend(
  categoryName,
  currentTaskName,
  newTaskName,
  description,
  dueDate
) {
  try {
    const payload = {
      TeamID: selectedTeamId, // Changed from UserId to TeamID
      categoryName: categoryName,
      currentTaskName: currentTaskName,
      newTaskName: newTaskName, // Ensure this is included to update the task name
      description: description,
      dueDate: dueDate || null,
    };

    console.log("Updating task with payload:", payload);

    const response = await fetch(`${apiBaseUrl}/UpdateTeamTask`, {
      method: "PUT", // Changed to PUT as per REST conventions
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

async function leaveTeamFromBackend(teamId) {
  if (!teamId) {
    console.error("Team ID is required to delete a team.");
    alert("Invalid team ID. Please try again.");
    return false;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/LeaveTeam`, {
      method: "POST", // Ensure this matches your API Gateway setup
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user,    // Assuming 'user' is the userId (from frontend code)
        teamId: teamId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error deleting team:", errorData.error);
      alert(errorData.error || "Failed to delete the team. Please try again.");
      return false;
    }

    const data = await response.json();
    console.log("Team deleted successfully:", data.message);
    return data.teamDeleted; // Returns true if team was deleted, else false
  } catch (error) {
    console.error("Error during API call to delete team:", error);
    alert("An error occurred while deleting the team. Please try again.");
    return false;
  }
}


// Function to remove the deleted team from the UI
function removeTeamFromUI(teamId) {
  const teamsList = document.getElementById('teams-list');
  const teamItem = teamsList.querySelector(`li[data-team-id="${teamId}"]`);
  if (teamItem) {
    teamsList.removeChild(teamItem);
  }

  // Clear the team message if the deleted team was selected
  const selectedTeamId = getSelectedTeamId();
  if (selectedTeamId === teamId) {
    setSelectedTeamId(null);
    document.getElementById('teams-message').innerHTML = 'You have no teams yet. &nbsp; Create a new team or join an existing one to get started.';
    document.getElementById('categories-grid').innerHTML = ""; // Clear categories
  }
}



function promptLeaveTeam(team) {
  Swal.fire({
    title: 'Are you sure?',
    text: `Do you really want to delete the team "${team.teamName}"? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Proceed to delete the team
      const success = await leaveTeamFromBackend(team.teamId);

      if (success) {
        // Remove the team from the UI
        removeTeamFromUI(team.teamId);
        Swal.fire(
          'Deleted!',
          `The team "${team.teamName}" has been deleted.`,
          'success'
        );
      } else {
        Swal.fire(
          'Error!',
          'Something went wrong while deleting the team.',
          'error'
        );
      }
    }
  });
}