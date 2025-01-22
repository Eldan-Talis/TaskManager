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
## **Task Manager - Deployment Instructions (Detailed)**

### **Step 1: Clone the Repository**
1. Open your terminal.
2. Run the following commands to clone the repository:
   ```bash
   git clone https://github.com/Eldan-Talis/TaskManager.git
   cd TaskManager
   ```
3. Ensure all files are available in the `TaskManager` directory.

---

### **Step 2: Setup AWS Services**

#### **2.1. Upload Frontend Files to S3**
1. Log in to the [AWS Management Console](https://aws.amazon.com/console/).
2. Navigate to the **S3** service.
3. Create a new bucket:
   - Click on **Create Bucket**.
   - Enter a unique name, e.g., `task-manager-frontend`.
   - Choose your preferred region.
   - Uncheck the "Block all public access" option to allow access to files.
   - Click **Create Bucket**.
4. Upload the frontend files:
   - In the bucket menu, click **Upload**.
   - Select the files from the `HTML`, `CSS`, and `JS` folders in your project.
   - Click **Upload**.
5. Configure the bucket for static website hosting:
   - Go to **Properties** → **Static Website Hosting**.
   - Enable the option and set:
     - **Index Document**: `index.html`.
     - **Error Document**: `404.html`.
   - Click **Save**.
6. Save the generated URL for later use.

---

#### **2.2. Configure AWS Cognito for User Authentication**
1. Navigate to the **Cognito** service.
2. Click on **Manage User Pools** → **Create a User Pool**.
3. Create a new pool:
   - Name the pool, e.g., `TaskManagerUserPool`.
   - Allow sign-in with Email only.
   - Click **Next Step** and complete the configuration.
4. Create an application in the pool:
   - In the **App Clients** menu, click **Add an App Client**.
   - Uncheck `Generate Client Secret`.
   - Click **Create App Client**.
5. Save the User Pool ID and App Client ID for later use.

---

#### **2.3. Deploy Backend Logic with AWS Lambda**
1. Navigate to the **Lambda** service.
2. Create functions:
   - Examples: `createTask`, `deleteTask`, `getTasks`.
   - Programming language: Node.js (or Python).
3. Upload each function as a ZIP file:
   - Compress the code files with dependencies (Node.js modules).
   - Upload the ZIP file via **Upload from** → **.zip file**.
4. Set up environment variables:
   - Add keys such as:
     - `DYNAMO_DB_TABLE_NAME`: Name of the table in DynamoDB.
5. Test the functions using **Test Events**.

---

#### **2.4. Set up DynamoDB for Data Storage**
1. Navigate to the **DynamoDB** service.
2. Create tables:
   - **Categories Table**:
     - Primary Key: `categoryId` (String).
   - **Tasks Table**:
     - Primary Key: `taskId` (String).
3. Save the table names for use in Lambda functions.

---

#### **2.5. Configure API Gateway**
1. Navigate to the **API Gateway** service.
2. Create a new API:
   - Type: **HTTP API**.
   - Configure endpoints:
     - `/tasks` → Connect to the `getTasks` function.
     - `/tasks/create` → Connect to the `createTask` function.
3. Assign appropriate IAM permissions.

---

#### **2.6. Monitor Logs with CloudWatch**
1. Ensure all Lambda functions are configured to send logs to CloudWatch.
2. Add alarms for monitoring failures.

---

### **Step 3: Run the Application**
1. Open the S3 bucket URL in your browser.
2. Perform tests:
   - Log in using Cognito.
   - Add categories and tasks.
   - Test delete and edit functions.

---

### **Step 4: Provide Demo Users**
1. Create users manually through Cognito.
2. Share the user credentials with the instructor, including:
   - Username.
   - Password.

---

### **Additional Notes**
- In case of issues, check logs in CloudWatch.
- Ensure all services are linked to the correct IAM roles.

---


### **AWS Services Used:**
- S3: Static file hosting
- Lambda: Backend functions
- API Gateway: HTTP endpoints
- DynamoDB: Task and category storage
- Cognito: User authentication
- CloudWatch: Logs monitoring

  
### **Contributors**
- Eldan Talis - Eldan7070@gmail.com
- Lidor Machluf - Machluflidor@gmail.com
- Din Eliyahu - dinelyahu@gmail.com
