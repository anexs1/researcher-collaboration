# React + Vite

## Project Setup

<!-- git add for adding files
git commit for committing changes
git push for pushing changes to the remote repository -->

✅ Manage Announcements (Edit/Delete researcher posts)
✅ Approve/Reject Collaboration Requests
✅ User Management (Activate/Deactivate researchers)
✅ Monitor Chats (Only if needed for moderation)
✅ Dashboard Analytics (See collaboration trends, active users, etc.)
✅ i need the place where the file repositry is stored and the database is stored
✅ i need to be able to add a researcher to the database and i need to be able to edit a researcher's profile and i need to be able to delete a researcher from the database
✅ i need to be able to add a collaboration request and i need to be able to edit a collaboration request and i need to be able to delete a collaboration request
✅ i need to be able to view a researcher's profile and i need to be able to view a collaboration request

## 1. Clone the repository:

git clone https://github.com/yourusername/researcher-collaboration-portal.git
Install dependencies:

cd researcher-collaboration-portal
npm install

## 2. Frontend Development (React.js)

The frontend is developed using React.js, where users can interact with the portal.

UI Design and Components: The user interface is designed with reusable components for different sections (e.g., search bar, collaborator requests, chat interface).
State Management: We use React Context API for global state management (or Redux if required).

Routing: We use React Router for navigating between pages like Dashboard, Profile, Announcements, and Messages.
Fetching Data: Frontend communicates with the backend API through RESTful API calls using Axios or Fetch.
Authentication: Authentication is handled via JWT (JSON Web Tokens) for secure user login and session management.
Steps:

Implement UI components for the researcher's profile and announcements.
Set up React Router for different pages: Home, Dashboard, Profile, Messages, and Search.
Use Axios to call backend endpoints for retrieving and sending data.
Integrate the chat functionality for real-time messaging.

## 3. Backend Development (Node.js / Express.js)

The backend handles the logic for user authentication, storing research announcements, and messaging.

## API Endpoints: Built with Express.js to handle requests from the frontend.

## Authentication: JWT is used for authenticating users and providing secure API access.

## Database: Data is stored in a MySQL database, which holds tables like Users, Announcements, Collaborator Requests, Messages, etc.

## Real-Time Communication: Socket.io is used for implementing real-time messaging and notifications.

## Error Handling: Standard error handling mechanisms are implemented for API responses (e.g., 400, 404, 500 errors).

## Security: Protect sensitive data using encryption (e.g., bcrypt for passwords) and implement security measures (e.g., CORS, rate-limiting).

Steps:

Set up Express.js and create endpoints for user registration, login, profile management, posting announcements, and managing collaborator requests.
Implement JWT-based authentication and middleware to secure routes.
Set up the MySQL database and write queries for storing and retrieving data.
Implement real-time chat functionality using Socket.io

Design the database schema for the Users, Announcements, and CollaboratorRequests tables.
Create SQL queries for interacting with the database (e.g., adding new users, posting new announcements).
Use an ORM (like Sequelize or TypeORM) if necessary for easier database interaction.
The database is structured to store the data related to users, announcements, collaboration requests, and messages.
Design the database schema for the Users, Announcements, Messages, and CollaboratorRequests tables.
Create SQL queries for interacting with the database (e.g., adding new users, posting new announcements).
Use an ORM (like Sequelize or TypeORM) if necessary for easier database interaction.

## 5. Real-Time Functionality (Socket.io)

The application includes real-time features such as chat and notifications. These are powered by Socket.io.
Chat Feature: Enables users to send and receive messages instantly.
Notifications: Notifies users when they receive a new collaborator request or message.
Steps:

## Set up Socket.io on both the frontend and backend.

Implement event listeners on the frontend for new messages and notifications.
Set up a backend listener to handle real-time events like new messages or collaborator request approvals.

## 1. User Management (Researchers, Admins)

Feature-Specific Tasks:
✅ User Registration (Researchers only, Admins are added manually).
✅ Login with JWT authentication.
✅ Password Reset via email verification.
✅ Role-based access control (Researcher vs Admin).
✅ Update profile information (name, expertise, bio, image, etc.).
✅ Create a new announcement.
✅ Edit or delete own announcements.
✅ Filter/search announcements by research area, keywords, or posted date.
✅ View list of all announcements.
✅ List all registered users (Admin only).
✅ Ban/unban users (Admin only).

## 2. Announcements (Collaboration Requests)

Feature-Specific Tasks:
✅ Post a new announcement with a title, description, and criteria.
✅ Edit or delete own announcements.
✅ Filter/search announcements by research area, keywords, or posted date.
✅ View list of all announcements.
✅ Moderate announcements (Admin only).
✅ Close an announcement to stop receiving collaboration requests.

## 3. Collaboration Requests (Request-Approval System)

Feature-Specific Tasks:
✅ Researchers can send collaboration requests to announcements.
✅ Cancel pending requests before approval.
✅ Announcement owner can approve or decline requests.
✅ View request status (pending, approved, declined).
✅ Admin can view all collaboration requests.

## 4. Chat System (Appears Only After Approval)

Feature-Specific Tasks:
✅ Chat with other researchers after approval.
✅ Send private messages to specific users.
✅ View chat history.
✅ Admin can view all chat messages.
✅ Real-time messaging between approved collaborators.
✅ View chat history.
✅ Block chat access for pending/declined requests.
