# ProjecTron - Project Allocation System

Hi everyone! This is the documentation for **ProjecTron**, a web application I built to help companies manage their projects, teams, and tasks efficiently. It's designed to be simple but powerful enough to handle real-world project management needs.

## 🚀 What is this project?

ProjecTron is a full-stack web application where you can manage everything about software projects. Think of it like a mix of Jira and a Resource Management tool.

It helps in:
*   Creating and tracking **Projects**.
*   Allocating **Engineers** to projects so they don't get overbooked.
*   Managing **Sprints** and **Tasks** (like Agile/Scrum).
*   Sending **Email Notifications** automatically when things happen (like when you get assigned a task).

## 👥 User Roles & Login Details

The system has 4 different roles, and each one sees a different dashboard.

> **Note:** Use these credentials to log in and test the application.

| Role | Email | Password | What they can do |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `Admin123!` | Can execute full system access, manage all users, projects, and settings. |
| **Project Manager** | `pm@projectron.com` | `Pm@123` | Manages their assigned projects, sprints, and allocates resources. |
| **Team Lead** | `tl@projectron.com` | `Tl@123` | Manages the team's tasks and daily work. |
| **Team Member** | `tm@projectron.com` | `Tm@123` | Works on assigned tasks and updates status. |

*Login the **Admin account** and then follow-up with creating the other roles accounts*

## 🛠️ How it Works (The Flow)

If you are new to the project, here is the simple flow of how things work:

1.  **Admin** sets up the **Organization** and adds **Users** (PMs, Team Leads, Developers).
2.  **Admin** creates a new **Project** (e.g., "AI Chatbot").
3.  **Admin** assigns a **Project Manager** to that project.
4.  **Project Manager** creates **Sprints** (2-week cycles) and **Allocates Team Members** to the project.
5.  **Team Lead** or **PM** breaks down requirements into **Tasks** and assigns them to **Team Members**.
6.  **Team Members** log in, see their tasks, work on them, and move them to "Done". 
7.  The system sends emails whenever a task is assigned or is due soon!

## 💻 Tech Stack

Use these technologies to build the app:

**Backend (The Brains):**
*   **.NET 8 Web API**: Fast and modern C# framework.
*   **SQL Server**: To store all the data (users, projects, tasks).
*   **Entity Framework Core**: To talk to the database easily.
*   **Azure Functions**: Handling background stuff like sending emails.

**Frontend (The Face):**
*   **React (Vite)**: Super fast frontend tool.
*   **TypeScript**: JavaScript but with types (less bugs!).
*   **Tailwind CSS**: For styling (makes it look good quickly).
*   **Redux Toolkit**: To manage the app state (like who is logged in).

## 🏃‍♂️ How to Run It Locally

Follow these steps to get it running on your machine:

### 1. Backend Setup
1.  Open `ProjecTron.sln` in Visual Studio or VS Code.
2.  Make sure you have SQL Server installed.
3.  Update the connection string in `appsettings.json` if needed.
4.  Run the migrations command in Package Manager Console: `Update-Database`.
5.  Run the project! It should start on `https://localhost:7001` (or similar).

### 2. Frontend Setup
1.  Go to the `Project_Allocation_System_Frontend` folder.
2.  Open a terminal and run `npm install` to get all packages.
3.  Run `npm run dev`.
4.  Open the link shown (usually `http://localhost:5173`).

---

