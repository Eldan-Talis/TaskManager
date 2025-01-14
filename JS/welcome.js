document.getElementById('signInBtn').addEventListener('click', () => {
    window.location.href = 'https://us-east-1doxbvaqzz.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=646mieltk0s1nidal6scivrlc0&redirect_uri=http://taskmanager-led.s3-website-us-east-1.amazonaws.com/';
  });
  
  document.getElementById('signUpBtn').addEventListener('click', () => {
    window.location.href = 'https://your-cognito-domain.auth.region.amazoncognito.com/signup?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI';
  });
  