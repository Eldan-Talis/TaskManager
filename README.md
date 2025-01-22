# Task Manager

## Project Overview
This is a Task Manager application built using AWS cloud services, including:

- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: AWS Lambda and API Gateway  
- **Database**: DynamoDB  
- **Authentication**: AWS Cognito  

The project is designed to provide a simple and efficient way to manage personal and team tasks.

---

## Repository Structure

TaskManager/  
├── CSS/             # Stylesheets  
├── HTML/            # HTML pages  
├── JS/              # JavaScript files  
├── 404.html         # Error page  
├── callback.html    # Cognito callback page  
├── index.html       # Main page  
└── README.md        # Project documentation


---

## Deployment Instructions

### Clone the Repository:
```bash
git clone https://github.com/Eldan-Talis/TaskManager.git
cd TaskManager
Setup AWS Services:
Upload the Frontend files to AWS S3.
Deploy the Backend logic using AWS Lambda.
Configure API Gateway for backend communication.
Set up DynamoDB for database storage.
Configure Cognito for user authentication.
Run the Application:
Open the deployed URL from your S3 bucket.

AWS Services Used
S3: Static file hosting
Lambda: Backend functions
API Gateway: HTTP endpoints
DynamoDB: Task and category storage
Cognito: User authentication
CloudWatch: Logs monitoring
Contributors
Eldan Talis - eldan.talis@example.com
Lidor Machluf - lidor.machluf@example.com
Din Eliyahu - dinelyahu@gmail.com
