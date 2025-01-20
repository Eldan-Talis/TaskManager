const apiBaseUrl = "https://s5lu00mr08.execute-api.us-east-1.amazonaws.com/prod"

const sub = sessionStorage.getItem('sub');
//sub = "e408d428-a041-7069-ace8-579db3cbd3a7"
const firstName = sessionStorage.getItem('first_name');
const user = sub
console.log('Sub:', sub);
let selectedCategoryContainerColor = null;
let selectedTeamId = null; // Store the selected team ID

// Function to get the selected team ID
function getSelectedTeamId() {
  return selectedTeamId;
}

// Function to set the selected team ID when a team is clicked
function setSelectedTeamId(teamId) {
  selectedTeamId = teamId;
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

  //color picker for background ----------------------------------------

// Function to set the theme based on user preferences
function applyUserTheme() {
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
      navbar.style.setProperty("background-color", selectedNavbarColor, "important");
      sidebar.style.setProperty("background-color", selectedSidebarColor, "important");

      // Set the background color for all category cards
      categoryCards.forEach((categoryCard) => {
          categoryCard.style.setProperty("background-color", selectedCategoryContainerColor, "important");
      });
  });
});

  function logout() {
    // Construct the Cognito logout URL
    const logoutUrl = "https://us-east-1doxbvaqzz.auth.us-east-1.amazoncognito.com/logout?client_id=646mieltk0s1nidal6scivrlc0&logout_uri=https://taskmanager-led.s3.us-east-1.amazonaws.com/index.html";
    
    // Clear the session
    clearStorage();
    clearCookies();
  
    // Redirect to the Cognito logout URL
    window.location.href = logoutUrl;
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const teamCodeInput = document.getElementById("teamCodeInput");
    const teamCodeError = document.getElementById("teamCodeError");
  
    // Handle form submission
    const joinTeamForm = document.getElementById("joinTeamForm");
    joinTeamForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const teamCode = teamCodeInput.value.trim();
  
      // Validate team code length
      if (teamCode.length !== 8) {
        teamCodeError.style.display = "block";
      } else {
        teamCodeError.style.display = "none";
        console.log(`Joining team with code: ${teamCode}`);
        // Add logic here to verify the team code and join the team.
        // For example, send the code to the backend to validate.
  
        // Reset the form
        teamCodeInput.value = "";
  
        // Close the modal
        const joinTeamModal = bootstrap.Modal.getInstance(
          document.getElementById("joinTeamModal")
        );
        joinTeamModal.hide();
      }
    });
  
    // Hide error message on input
    teamCodeInput.addEventListener("input", () => {
      if (teamCodeInput.value.trim().length === 8) {
        teamCodeError.style.display = "none";
      }
    });
  });
  
  async function loadTeams() {
    try {
      const endpoint = `${apiBaseUrl}/GetAllTeams`;
  
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user }), // Dynamically pass the user ID
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch team data: ${response.statusText}`);
      }
  
      const teams = await response.json();
      const teamsList = document.getElementById('teams-list');
  
      teamsList.innerHTML = ''; // Clear current list
  
      // Populate the list with fetched teams
      teams.forEach((team) => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'teams-link');
        const teamContainer = document.createElement('div');
        teamContainer.classList.add('d-flex', 'align-items-center', 'gap-2');
  
        const dotIcon = document.createElement('span');
        dotIcon.textContent = '•';
        dotIcon.classList.add('dot-icon');
        teamContainer.appendChild(dotIcon);
  
        const teamNameElement = document.createElement('span');
        teamNameElement.textContent = team.teamName;
        teamNameElement.classList.add('category-name', 'flex-grow-1');
        teamContainer.appendChild(teamNameElement);
  
        listItem.appendChild(teamContainer);
        listItem.dataset.teamId = team.teamId; // Store the teamId
  
        // When the team is clicked, set the selected team ID and load categories
        listItem.addEventListener('click', () => {
          setSelectedTeamId(team.teamId); // Store the selected team ID
          console.log(`Team selected: ${team.teamName} (ID: ${team.teamId})`);
          loadCategoriesForTeam(team.teamId);  // Call function to load categories
        });
  
        teamsList.appendChild(listItem);
      });
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }  
  
  // Call the function to load the teams when the page is loaded
  document.addEventListener('DOMContentLoaded', async () => {
    // Load teams first
    await loadTeams();
  
    // Once teams are loaded, trigger the click event on the first item
    const teamsList = document.getElementById('teams-list');
    const teams = teamsList.querySelectorAll('li');
  
    if (teams.length > 0) {
      const firstTeamItem = teams[0];
      firstTeamItem.click();  // Simulate a click on the first team
    }
  });

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
      event.preventDefault();  // Prevent default form submission behavior
  
      const categoryName = categoryNameInput.value.trim();
  
      if (!categoryName) {
        alert("Category name cannot be empty.");
        return;
      }
  
      console.log("Category name captured:", categoryName);  // Debugging output
  
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
        categoryNameInput.value = "";  // Reset input
        cateCharCount.textContent = "20 characters remaining";  // Reset character count
  
        // Optionally, you could update the category list or refresh it
        loadCategoriesForTeam(teamId);
      }
    });
  
    // Reset the input and character count when the modal is closed
    const addCategoryModalElement = document.getElementById("addCategoryModal");
    addCategoryModalElement.addEventListener("hidden.bs.modal", () => {
      categoryNameInput.value = "";  // Reset input when modal is closed
      cateCharCount.textContent = "20 characters remaining";  // Reset character count
    });
  });  
  
  
  
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

async function addCategory(categoryName) {
  const teamId = getSelectedTeamId(); // Get the selected teamId

  if (!teamId) {
    alert("Please select a team first.");
    return;
  }

  const categoriesGrid = document.getElementById("categories-grid");

  // Avoid duplicate categories
  const existingCategory = Array.from(document.querySelectorAll(".category-card h4"))
    .some((header) => header.textContent === categoryName);

  if (existingCategory) {
    console.warn("Category already exists in UI:", categoryName);
    alert("This category already exists!");
    return;
  }

  const response = await addCategoryToBackend(teamId, categoryName);  // Pass teamId to the API call

  if (response) {
    // Call to render category in the UI after successfully adding
    addCategoryToUI(categoryName);
  }
}


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

async function loadCategoriesForTeam(teamId) {
  try {
    const endpoint = `${apiBaseUrl}/GetTeamCategories`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamId: teamId }), // Ensure teamId is in the body
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories for team: ${response.statusText}`);
    }

    const data = await response.json();

    // Assuming the categories might be returned as an object
    let categories = data.categories;

    // Check if categories is an object and convert it to an array of category objects
    if (typeof categories === 'object' && !Array.isArray(categories)) {
      categories = Object.keys(categories).map(key => ({
        categoryName: key,
        categoryDetails: categories[key],
      }));
    }

    const categoriesGrid = document.getElementById("categories-grid");
    categoriesGrid.innerHTML = ''; // Clear previous categories

    // Now categories should be an array, you can use forEach
    categories.forEach((category) => {
      // Display each category (you may need to adjust how you display categories)
      addCategoryToUI(category.categoryName);
    });
    
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}



// Function to display category on the UI (you can modify this based on your UI needs)
function addCategoryToUI(categoryName) {
  const categoriesGrid = document.getElementById("categories-grid");

  const categoryCard = document.createElement("div");
  categoryCard.classList.add("category-card", "position-relative");
  categoryCard.style.setProperty("background-color", selectedCategoryContainerColor, "important");

  const categoryHeader = document.createElement("h4");
  categoryHeader.textContent = categoryName;

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("position-absolute", "top-0", "end-0", "m-2", "d-flex", "gap-1");

  // Create and append buttons for Add Task, Delete Category etc.
  // For example:
  const addTaskIcon = document.createElement("button");
  addTaskIcon.innerHTML = "+";
  addTaskIcon.classList.add("btn", "btn-primary", "p-1");

  buttonContainer.appendChild(addTaskIcon);
  categoryCard.appendChild(buttonContainer);
  categoryCard.appendChild(categoryHeader);
  categoriesGrid.appendChild(categoryCard);

}
