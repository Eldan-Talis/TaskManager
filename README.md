# **Task Manager**

## **Project Overview**
This is a **Task Manager** application built using AWS cloud services, including:
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** AWS Lambda and API Gateway
- **Database:** DynamoDB
- **Authentication:** AWS Cognito

The project is designed to provide a **simple and efficient** way to manage personal and team tasks.

---

## **Repository Structure**
```
TaskManager/
├── CSS/             # Stylesheets
├── HTML/            # HTML pages
├── JS/              # JavaScript files
├── 404.html         # Error page
├── callback.html    # Cognito callback page
├── index.html       # Main page
└── README.md        # Project documentation
```

---

## **Deployment Instructions**

### **Step 1: Clone the Repository**
1. Open your terminal.
2. Run the following commands to clone the repository:
   ```sh
   git clone https://github.com/Eldan-Talis/TaskManager.git
   cd TaskManager
   ```
3. Ensure all files are available in the `TaskManager` directory.

---

### **Step 2: Setup AWS Services**

#### **2.1. Upload Frontend Files to S3**
1. Log in to the AWS Management Console.
2. Navigate to the **S3** service.
3. **Create a new bucket:**
   - Click on **Create Bucket**.
   - Enter a unique name, e.g., `task-manager-frontend`.
   - Choose your preferred region.
   - Uncheck the **"Block all public access"** option to allow access to files.
   - **Permissions bucket policy:**
     ```json
     {
       "Version": "2012-10-17",
       "Id": "Policy1736951779952",
       "Statement": [
           {
               "Sid": "Stmt1736951777109",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "<Enter_S3_arn>/*"
           }
       ]
     }
     ```
   - Click **Create Bucket**.
4. **Upload the frontend files:**
   - In the bucket menu, click **Upload**.
   - Select the files from the **HTML, CSS, and JS** folders in your project.
   - Click **Upload**.
5. **Configure the bucket for static website hosting:**
   - Go to **Properties → Static Website Hosting**.
   - Enable the option and set:
     - **Index Document:** `index.html`.
     - **Error Document:** `404.html`.
   - Click **Save**.
6. **Save the generated URL for later use.**

---

#### **2.2. Configure AWS Cognito for User Authentication**
1. Navigate to the **Cognito** service.
2. Click on **Manage User Pools → Create a User Pool**.
3. **Create a new pool:**
   - Name the pool, e.g., `TaskManagerUserPool`.
   - Allow sign-in with **Email only**.
   - Click **Next Step** and complete the configuration.
4. **Create an application in the pool:**
   - In the **App Clients** menu, click **Add an App Client**.
   - Click **Create App Client**.
5. **Save the User Pool ID and App Client ID for later use.**
6. **Create an Admin group:**
   - Name the Group: **“Admins”**.
   - Add users to the group to make them admin (or don’t, it’s your choice how to live your life).

---

#### **2.3. Deploy Backend Logic with AWS Lambda**
1. Navigate to the **Lambda** service.
2. **Create functions:**
   - Download the **Lambda's functions** from the ZIP file attached (*Programming language: Python*).
   - Upload the functions that you’ve downloaded to the **Lambda services**.
3. **Set up environment variables:**
   - If you want to change the table name, you can change it at the start of every function. Or you can simply use the table names stated in the next segment.

---

#### **2.4. Set up DynamoDB for Data Storage**
1. Navigate to the **DynamoDB** service.
2. **Create tables:**
   - **User Table:**
     - **Partition Key:** `UserId` (*String*).
     - **Table Name:** `UserData`.
   - **Teams Table:**
     - **Partition Key:** `TeamId` (*String*).
     - **Table Name:** `TeamData`.

---

#### **2.5. Configure API Gateway**
1. Navigate to the **API Gateway** service.
2. **Create a new API:**
   - **Type:** HTTP API.
3. **Upload the API export `Swagger.json` file** (from the attached files) to the **API Gateway**.

---

#### **2.6. Monitor Logs with CloudWatch**
1. Ensure all **Lambda functions** are configured to send logs to **CloudWatch**.
2. Add **alarms for monitoring failures**.

---

#### **2.7. Changes to the Code Itself**
1. **In file `config.js`:**
   - Change the `clientId` to your own **clientId** (*from Cognito*).
   - Change the `domain` to your own **Cognito domain**.
   - Change the `redirectUri` to your own **callbackUri** (*from Cognito*).
2. **In `teams.js` & `personal.js`:**
   - Change the **API base URL** to your own API base URL (*from API Gateway*).
   - Change the **logout URL** to your own logout URL (*from Cognito*).

---

### **Step 3: Run the Application**
1. Open the **S3 bucket URL** in your browser.
2. **Perform tests:**
   - Log in using **Cognito**.
   - Add **categories and tasks**.

---

## **Additional Notes**
- In case of issues, check **logs in CloudWatch**.

---

## **AWS Services Used:**
- **S3:** Static file hosting
- **Lambda:** Backend functions
- **API Gateway:** HTTP endpoints
- **DynamoDB:** Task and category storage
- **Cognito:** User authentication
- **CloudWatch:** Logs monitoring

---

## **Contributors**
- **Eldan Talis** - [Eldan7070@gmail.com](mailto:Eldan7070@gmail.com)
- **Lidor Machluf** - [Machluflidor@gmail.com](mailto:Machluflidor@gmail.com)
- **Din Eliyahu** - [dinelyahu@gmail.com](mailto:dinelyahu@gmail.com)
