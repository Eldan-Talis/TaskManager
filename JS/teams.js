const apiBaseUrl =
  "https://s5lu00mr08.execute-api.us-east-1.amazonaws.com/prod";

const sub = sessionStorage.getItem('sub');
//const sub = "c428e4e8-0001-7059-86d2-4c253a8a6994";
//const sub = "e408d428-a041-7069-ace8-579db3cbd3a7";
//const sub = "34d83408-40b1-707b-f80b-cbdc8e287b90";
//const sub = "e4b8d4e8-d0a1-70c1-73b2-4e8ed0338fc5";
const firstName = sessionStorage.getItem("first_name");
const user = sub;
console.log("Sub:", sub);

let selectedTeamId = null; // Store the selected team ID
let loadingCounter = 0;

// Function to get the selected team ID
function getSelectedTeamId() {
  return selectedTeamId;
}

// Function to set the selected team ID when a team is clicked
function setSelectedTeamId(teamId) {
  showLoadingSpinner();
  selectedTeamId = teamId;
}

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
    // Load teams first
    await loadTeams();

  } catch (error) {
    console.error("Failed to load user data:", error);
  }
});

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

// Call the function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", applyUserTheme);

// Logout function
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
      // Reset the form
      teamCodeInput.value = "";
      
      // Close the modal
      const joinTeamModal = bootstrap.Modal.getInstance(
        document.getElementById("joinTeamModal")
      );

      joinTeamModal.hide();
      
      showLoadingSpinner();
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
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: errorData.message || "Failed to join the team.",
          confirmButtonText: 'OK'
        });
        return;
      }
      
      const data = await response.json();
      console.log("Successfully joined the team:", data.message);
      
      // Replace the standard alert with Swal.fire
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Successfully joined the team!',
        timer: 2000, // Optional: Auto-close after 2 seconds
        showConfirmButton: false // Optional: Hide the confirm button
      });

      // Reload the teams to reflect the changes
      await loadTeams();
      
    } catch (error) {
      console.error("Error during API call to join team:", error);
      alert(
        "An error occurred while trying to join the team. Please try again."
      );
    }
  });

  // Hide error message on input
  teamCodeInput.addEventListener("input", () => {
    if (teamCodeInput.value.trim().length === 8) {
      teamCodeError.style.display = "none";
    }
  });
});

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

// Load teams from the backend
async function loadTeams() {
  try {
    const endpoint = `${apiBaseUrl}/GetAllTeams`;

    // Show the loading spinner before starting the API call
    showLoadingSpinner();

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

      // Create and append the friendly message container with 'X' icon
      const friendlyMessageContainer = document.getElementById("teams-message");
      friendlyMessageContainer.innerHTML = ""; // Clear previous content

      // Create a container div for the message and 'X' icon
      const messageContainer = document.createElement("div");
      messageContainer.classList.add("team-container");

      // Team message
      const teamMessage = document.createElement("span");
      teamMessage.classList.add("team-message"); // Add a specific class for styling

      // Add the team name using innerHTML to interpret HTML entities
      teamMessage.innerHTML =
        "You have no teams yet.&nbsp; Create a new team or join an existing one to get started.";

      // Append the message to the container
      messageContainer.appendChild(teamMessage);

      // Append the container to the friendlyMessageContainer
      friendlyMessageContainer.appendChild(messageContainer);

      // Add an <hr> under the team container
      const separator = document.createElement("hr");
      separator.classList.add("team-separator"); // Add a CSS class for styling
      friendlyMessageContainer.appendChild(separator);

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

    // Variable to keep track of the currently active team
    let activeTeamItem = null;

    // Populate the list with sorted teams
    teams.forEach((team) => {
      const listItem = document.createElement("li");
      listItem.classList.add("list-group-item", "teams-link");
      listItem.dataset.teamId = team.teamId; // Store the teamId

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

      // **Add Dropdown Container**
      const userDropdown = document.createElement("div");
      userDropdown.classList.add("user-dropdown");
      userDropdown.style.display = "none"; // Hidden by default
      userDropdown.style.marginTop = "10px"; // Space above the dropdown
      userDropdown.style.paddingLeft = "20px"; // Indent the dropdown
      userDropdown.style.backgroundColor = "rgba(255, 255, 255, 0.1)"; // Slight background
      userDropdown.style.borderRadius = "5px"; // Rounded corners
      userDropdown.style.padding = "10px"; // Padding inside the dropdown

      listItem.appendChild(userDropdown); // Append the dropdown to the list item

      // When the team is clicked, set the selected team ID and load categories
      listItem.addEventListener("click", async () => {
        setSelectedTeamId(team.teamId); // Store the selected team ID

        // Manage Active Class
        if (activeTeamItem) {
          activeTeamItem.classList.remove("active");
          // Hide its dropdown
          const activeDropdown = activeTeamItem.querySelector(".user-dropdown");
          if (activeDropdown) {
            activeDropdown.style.display = "none";
          }
        }
        listItem.classList.add("active");
        activeTeamItem = listItem;

        // Fetch and display user names in the dropdown
        await populateUserDropdown(team.teamId, userDropdown);

        // Toggle dropdown visibility
        userDropdown.style.display =
          userDropdown.style.display === "none" ? "block" : "none";

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
                timer: 1000, // Auto-close after 1 second
                showConfirmButton: false, // No confirmation button
              });
            })
            .catch(() => {
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Failed to copy Invite ID.",
                timer: 1000, // Auto-close after 1 second
                showConfirmButton: false, // No confirmation button
              });
            });
        });

        // Append the Invite ID link to the team message
        teamMessage.appendChild(inviteIdLink);

        // Append the team message to the container
        messageContainer.appendChild(teamMessage);

        // 'Leave Team' button with icon and text
        const leaveTeamBtn = document.createElement("button");
        leaveTeamBtn.classList.add("leave-team-btn");
        leaveTeamBtn.title = "Leave Team";
        leaveTeamBtn.setAttribute("aria-label", "Leave Team");

        // Create a container within the button to arrange icon and text vertically
        const leaveButtonContent = document.createElement("div");
        leaveButtonContent.classList.add("leave-button-content");

        // Create the icon element
        const leaveIcon = document.createElement("i");
        leaveIcon.classList.add("bx", "bxs-exit"); // Ensure you're using the correct Boxicons classes

        // Create the text element
        const leaveText = document.createElement("span");
        leaveText.textContent = "Leave";
        leaveText.classList.add("leave-team-text");

        // Append icon and text to the content container
        leaveButtonContent.appendChild(leaveIcon);
        leaveButtonContent.appendChild(leaveText);

        // Append the content container to the button
        leaveTeamBtn.appendChild(leaveButtonContent);

        // Add event listener to the button
        leaveTeamBtn.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent triggering parent events
          promptLeaveTeam(team);
        });

        // Append the button to the message container
        messageContainer.appendChild(leaveTeamBtn);

        // Append the container to the friendlyMessageContainer
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


// Function to fetch and populate user names in the dropdown
async function populateUserDropdown(teamId, dropdownElement) {
  try {
    const response = await fetch(`${apiBaseUrl}/GetTeamUserFullNames`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ team_id: teamId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching user names:", errorData.error);
      dropdownElement.innerHTML =
        "<p style='color: red;'>Failed to load team members.</p>";
      return;
    }

    const userNames = await response.json(); // Assuming the response is a JSON array

    if (!Array.isArray(userNames)) {
      console.error("Expected userNames to be an array:", userNames);
      dropdownElement.innerHTML =
        "<p style='color: red;'>Unexpected data format received.</p>";
      return;
    }

    if (userNames.length === 0) {
      dropdownElement.innerHTML = "<p>No members in this team.</p>";
      return;
    }

    // Clear existing content
    dropdownElement.innerHTML = "";

    // Create a list to display user names
    const userList = document.createElement("ul");
    userList.style.listStyle = "none";
    userList.style.padding = "0";
    userList.style.margin = "0";

    userNames.forEach((name) => {
      const userItem = document.createElement("li");
      userItem.textContent = name;
      userItem.style.padding = "5px 0";
      userItem.style.borderBottom = "1px solid rgba(255, 255, 255, 0.2)";
      userItem.style.color = "white"; // Ensure text is visible against the background

      // Remove the border for the last item
      if (name === userNames[userNames.length - 1]) {
        userItem.style.borderBottom = "none";
      }

      userList.appendChild(userItem);
    });

    dropdownElement.appendChild(userList);
  } catch (error) {
    console.error("Error during API call to fetch user names:", error);
    dropdownElement.innerHTML =
      "<p style='color: red;'>An error occurred while loading team members.</p>";
  }
}


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
      showLoadingSpinner();
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
    showLoadingSpinner();
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

    showLoadingSpinner();

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
  finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
  }
}

// Function to display category on the UI
// JS/teams.js

// Function to display category on the UI
function addCategoryToUI(categoryName) {
  const categoriesGrid = document.getElementById("categories-grid");

  const categoryCard = document.createElement("div");
  categoryCard.classList.add("category-card", "position-relative");

  // Fetch the saved theme
  const savedTheme = loadUserTheme(); // Ensure loadUserTheme is accessible here, possibly via theme.js
  const categoryColor = savedTheme ? savedTheme.categoryColor : null;

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

// Set the minimum date for the task date input to today's date
document.getElementById("taskDateInput").addEventListener("focus", function () {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(today.getDate()).padStart(2, "0");
  const minDate = `${year}-${month}-${day}`;
  this.setAttribute("min", minDate);
});

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

  showLoadingSpinner();

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
  finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
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
  let safeDescription = (task.description || "No description provided.")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  const taskDesc = document.createElement("p");
  taskDesc.innerHTML = safeDescription;
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

  showLoadingSpinner();

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
  finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
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

  // Because you used `taskDesc.innerHTML = ...` in `addTaskToCategory`,
  // the <p> contains sanitized HTML (with <br> tags). Grab it via .innerHTML:
  const rawHtmlDescription = taskDiv.querySelector("p").innerHTML || "";

  // If there's a date element
  const taskDateSpan = taskDiv.querySelector(".task-date");
  const taskDate = taskDateSpan
    ? taskDateSpan.textContent.replace("Due: ", "")
    : "No due date provided.";

  // Get the category name
  const categoryCard = taskDiv.closest(".category-card");
  const categoryName = categoryCard.querySelector("h4").textContent;

  // Update the modal
  // - Set the modal title
  document.getElementById(
    "taskDetailsModalLabel"
  ).textContent = `Category: ${categoryName}`;
  // - Task title can be text, since it’s plain text
  document.getElementById("taskDetailTitle").textContent = taskTitle;
  // - Insert the description HTML directly (already sanitized when added)
  document.getElementById("taskDetailDescription").innerHTML =
    rawHtmlDescription;
  // - Due date as plain text
  document.getElementById(
    "taskDetailDate"
  ).textContent = `Due Date: ${taskDate}`;

  // Finally, show the modal
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

    showLoadingSpinner();

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
  finally {
    // Hide the loading spinner after the API call completes
    hideLoadingSpinner();
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
    showLoadingSpinner();
    const response = await fetch(`${apiBaseUrl}/LeaveTeam`, {
      method: "POST", // Ensure this matches your API Gateway setup
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user, // Assuming 'user' is the userId (from frontend code)
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
    return true; // Returns true if team was deleted, else false
  } catch (error) {
    console.error("Error during API call to delete team:", error);
    alert("An error occurred while deleting the team. Please try again.");
    return false;
  }finally {
    // Hide the loading spinner after the API call completes
    loadTeams();
  }
}

// Function to remove the deleted team from the UI
function removeTeamFromUI(teamId) {
  const teamsList = document.getElementById("teams-list");
  const teamItem = teamsList.querySelector(`li[data-team-id="${teamId}"]`);
  if (teamItem) {
    teamsList.removeChild(teamItem);
  }

  // Clear the team message if the deleted team was selected
  const selectedTeamId = getSelectedTeamId();
  if (selectedTeamId === teamId) {
    setSelectedTeamId(null);
    document.getElementById("teams-message").innerHTML =
      "You have no teams yet. &nbsp; Create a new team or join an existing one to get started.";
    document.getElementById("categories-grid").innerHTML = ""; // Clear categories
  }
}

function promptLeaveTeam(team) {
  Swal.fire({
    title: "Are you sure?",
    text: `Do you really want to leave the team "${team.teamName}"? This action cannot be undone.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, leave it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
  }).then(async (result) => {
    if (result.isConfirmed) {
      const success = await leaveTeamFromBackend(team.teamId);

      if (success) {
        removeTeamFromUI(team.teamId);
        Swal.fire(
          "Left!",
          `You have successfully left the team "${team.teamName}".`,
          "success"
        );
      } else {
        Swal.fire(
          "Error!",
          "Something went wrong while leaving the team.",
          "error"
        );
      }
    }
  });
}


//speechToText for category

document.addEventListener("DOMContentLoaded", () => {
  const speechButton = document.getElementById("speechCategoryName");
  const categoryNameInput = document.getElementById("categoryNameInput");
  const cateCharCount = document.getElementById("cateCharCount");

  if (!speechButton || !categoryNameInput || !cateCharCount) {
    console.error("Required elements for category speech-to-text are missing.");
    return;
  }

  speechButton.addEventListener("click", function () {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech-to-Text is not supported in this browser.");
      return;
    }

    const maxLength = 20; // Maximum character limit for category name
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US"; // Set the language
    recognition.interimResults = false; // Only final results

    recognition.start();

    recognition.onstart = function () {
      console.log("Speech recognition started for category input...");
    };

    recognition.onresult = function (event) {
      let transcript = event.results[0][0].transcript;

      // Truncate the transcript if it exceeds the max length
      if (transcript.length > maxLength) {
        transcript = transcript.substring(0, maxLength);
      }

      // Update the input field with recognized text
      categoryNameInput.value = transcript;

      // Update character count dynamically
      const remaining = maxLength - transcript.length;
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
});

// Helper function for Speech-to-Text for tasks
function addSpeechToText(buttonId, inputId, charCountId, maxLength) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.addEventListener("click", () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech-to-Text is not supported in this browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.start();

    recognition.onstart = () => console.log("Speech recognition started...");
    recognition.onresult = (event) => {
      let transcript = event.results[0][0].transcript;

      // Truncate to max length
      transcript = transcript.substring(0, maxLength);

      const inputField = document.getElementById(inputId);
      inputField.value = transcript;

      // Update character counter
      const remaining = maxLength - transcript.length;
      const charCount = document.getElementById(charCountId);
      if (charCount) {
        charCount.textContent = `${remaining} characters remaining`;
        charCount.style.color = remaining < 0 ? "red" : "gray";
      }

      console.log("Recognized text:", transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      alert("Speech recognition failed. Please try again.");
    };

    recognition.onend = () => console.log("Speech recognition ended.");
  });
}

// Initialize Speech-to-Text for all relevant inputs
addSpeechToText("speechButton", "categoryNameInput", "cateCharCount", 20);
addSpeechToText("speechTaskName", "taskNameInput", "taskCharCount", 20);
addSpeechToText(
  "speechTaskDescription",
  "taskDescriptionInput",
  "descriptionCharCount",
  200
);
