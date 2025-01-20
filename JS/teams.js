const apiBaseUrl = "https://s5lu00mr08.execute-api.us-east-1.amazonaws.com/prod"

const sub = sessionStorage.getItem('sub');;
const firstName = sessionStorage.getItem('first_name');
const user = sub
console.log('Sub:', sub);

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
    const teamNameInput = document.getElementById("teamNameInput");
    const teamCharCount = document.getElementById("teamCharCount");
  
    // Update character count dynamically
    teamNameInput.addEventListener("input", () => {
      const remaining = 20 - teamNameInput.value.length;
      teamCharCount.textContent = `${remaining} characters remaining`;
    });
  
    // Handle form submission
    const newTeamForm = document.getElementById("newTeamForm");
    newTeamForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const teamName = teamNameInput.value.trim();
  
      if (teamName) {
        console.log(`New team created: ${teamName}`);
        // Add logic here to save the new team to the database
        // and update the UI accordingly.
  
        // Reset the form
        teamNameInput.value = "";
        teamCharCount.textContent = "20 characters remaining";
  
        // Close the modal
        const newTeamModal = bootstrap.Modal.getInstance(
          document.getElementById("newTeamModal")
        );
        newTeamModal.hide();
      } else {
        alert("Team name cannot be empty.");
      }
    });
  });
  
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
  