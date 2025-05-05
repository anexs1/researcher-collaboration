Here's your **revised, interactive, and corrected project setup documentation**, formatted clearly for readability and usability in a collaborative development environment. It includes improvements in grammar, structure, consistency, and clarity.

---

# 🌐 Researcher Collaboration Portal – Project Setup Guide

This guide outlines everything you need to set up, run, and manage the full-stack portal (React + Node.js + MySQL + Socket.io).

---

## ✅ Git Setup: Save All Changes at Once to GitHub

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## ✅ Core Admin Features

- [x] Manage Announcements (Edit/Delete researcher posts)
- [x] Approve/Reject Collaboration Requests
- [x] User Management (Activate/Deactivate researchers)
- [x] Monitor Chats (if moderation is needed)
- [x] Dashboard Analytics (see trends, active users, collaboration insights)
- [x] Add/Edit/Delete Researchers from the Database
- [x] Add/Edit/Delete Collaboration Requests
- [x] View Researcher Profiles
- [x] View Collaboration Requests
- [x] File Repository Storage Location (needs config)
- [x] Database Storage Location (MySQL – local or cloud-hosted)

---

## 🔁 Project Flow Overview

### 1. ✅ Clone the Repository

```bash
git clone <your-repo-url>
cd <project-directory>
```

---

## 🌐 2. Frontend Development – React.js

### Technologies Used

- **React.js** (Frontend Framework)
- **React Router** (Navigation)
- **Axios / Fetch API** (Data fetching)
- **Context API / Redux** (State management)
- **JWT** (Authentication)
- **Socket.io Client** (Real-time communication)

### Key Features

- Reusable UI components (search bar, request cards, profile cards)
- Protected routes for Admin/Researcher
- Responsive design for mobile & desktop
- Form validations and error handling

### To Start Frontend:

```bash
cd frontend
npm install
npm start
```

---

## ⚙️ 3. Backend Development – Node.js + Express.js

### Technologies Used

- **Node.js / Express.js** (Backend Framework)
- **JWT** (Authentication)
- **bcrypt** (Password hashing)
- **MySQL** (Database)
- **Sequelize ORM** (Recommended for DB interaction)
- **Socket.io** (Real-time messaging)
- **Nodemailer** (For email-based password reset)
- **CORS / Helmet / Rate-Limiter** (Security)

### Backend Setup Steps

```bash
cd backend
npm install
npm run dev
```

### API Features

- User Registration & Login
- Role-based Access (Admin/Researcher)
- CRUD APIs: Users, Announcements, Collaboration Requests, Messages
- Admin dashboard analytics
- Real-time endpoints for messages

---

## 🗃️ 4. Database Design – MySQL

### Tables to Include:

- `Users` (id, name, email, password, role, status, profile info)
- `Announcements` (id, user_id, title, description, criteria, status)
- `CollaborationRequests` (id, user_id, announcement_id, status)
- `Messages` (id, sender_id, receiver_id, message, timestamp)
- Optional: `Notifications`, `Reports`, `ActivityLogs`

### SQL Tools

- **Workbench or phpMyAdmin** (for MySQL GUI)
- Use **Sequelize** (ORM) to avoid writing raw SQL.

---

## ⚡ 5. Real-Time Communication – Socket.io

### Features

- Instant private messaging (after approval)
- Real-time notifications (new requests, messages)
- Admin visibility into chats (if moderation enabled)

### Setup Instructions

- Backend: Integrate `socket.io` with Express server.
- Frontend: Use `socket.io-client` to connect.
- Events: `new_message`, `new_notification`, `chat_history`, etc.

---

## 🧑‍💼 6. User Management (Researchers, Admins)

### Researcher Capabilities

- Register & log in securely
- Update profile (bio, institution, expertise, image)
- Post, edit, or delete announcements
- Send/cancel collaboration requests
- View status (pending/approved/declined)
- Chat with approved collaborators

### Admin Capabilities

- Activate/deactivate users
- View all announcements and requests
- Approve/reject requests
- Monitor all chats (if needed)
- View dashboard analytics

---

## 📢 7. Announcements (Collaboration Opportunities)

- Researchers can:

  - Post announcements (title, description, criteria)
  - Edit or delete own posts
  - Filter/search announcements
  - Close announcements (no more requests)

- Admin can:

  - Moderate or remove inappropriate posts

---

## 🔄 8. Collaboration Requests System

- Send a request to collaborate on an announcement
- Cancel before approval
- Owner can approve or decline
- View request status (updated in real time)
- Admin has oversight on all requests

---

## 💬 9. Chat System

- Starts **only after approval**
- Real-time chat with approved collaborators
- View full chat history
- Admin access for moderation
- Auto-blocks chat for declined/pending requests

---

## 📁 File Repository & Database Storage

### 🔍 Where is Data Stored?

- **Files/Uploads** (if used): `uploads/` folder in backend
- **Database**: MySQL (can be local or hosted on services like PlanetScale or AWS RDS)
- **Environment Variables**: Stored in `.env` file for sensitive credentials

---

## 📝 Final Checklist

- [x] Frontend working (React, API calls, Auth, Routing)
- [x] Backend working (Node.js, Auth, Routes, DB)
- [x] MySQL database connected
- [x] Socket.io real-time chat set up
- [x] Admin dashboard access
- [x] All roles functional (Researcher & Admin)
