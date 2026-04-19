# 💼 Hire – Job Portal System

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application designed to connect job seekers with employers through a modern, efficient, and user-friendly platform.

This system enables users to search and apply for jobs while allowing administrators to manage job postings and monitor applications.

---

## 🌍 Project Overview

The **Hire Job Portal** simplifies the recruitment process by providing a centralized platform for job listings and applications.

Users can explore job opportunities, apply with resumes, and track their applications, while administrators can manage jobs and analyze platform activity through a dashboard.

This project demonstrates real-world full stack development with secure authentication and scalable architecture.

---

## 🎯 Objectives

* Provide an easy platform for job searching
* Enable users to apply for jobs efficiently
* Allow admins to manage job listings
* Prevent duplicate applications
* Improve recruitment workflow

---

## 👥 User Roles

### 👤 User

Users can:

* Register and login
* Browse available jobs
* Search and filter jobs
* Apply with resume upload
* Track applications
* Update profile

---

### 🛠 Admin

Admin users can:

* Add new job listings
* Delete job postings
* View dashboard statistics
* Monitor applications
* Manage platform data

---

## 🚀 Features

### 🔐 Authentication

* Secure Login & Signup
* JWT-based Authentication
* Role-Based Access Control

---

### 💼 Job Management

Users can:

* Browse job listings
* Search by company, role, location
* Filter by job type
* View job details

---

### 📄 Job Application

* Apply for jobs
* Upload resume (PDF/DOCX)
* Prevent duplicate applications

---

### 📊 Dashboard

Admin dashboard provides:

* Total Jobs Count
* Total Users Count
* Total Applications
* Job Management Panel

---

### 👤 Profile Management

* Update user details
* Change password

---

### 🔑 Forgot Password

* OTP-based password reset (demo via terminal)

---

## 🛠 Technologies Used

### Frontend

* React.js
* JavaScript
* HTML
* CSS

---

### Backend

* Node.js
* Express.js
* REST APIs

---

### Database

* MongoDB
* Mongoose ODM

---

### Additional Tools

* JWT Authentication
* Multer (File Upload)
* bcrypt (Password Hashing)
* Local Storage
* GitHub

---

## 📁 Project Structure

```
job-portal/

backend/
│ ├── models/
│ ├── routes/
│ ├── controllers/
│ ├── uploads/
│ ├── server.js
│ ├── package.json

frontend/
│ ├── public/
│ ├── src/
│ ├── components/
│ ├── pages/
│ ├── App.js
│ ├── index.js
│ ├── package.json

README.md
.gitignore
```

---

## ⚙️ Installation Guide

### Step 1 — Clone Repository

```bash
git clone https://github.com/your-username/job-portal.git
```

### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3 — Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 4 — Run Backend Server

```bash
cd backend
npm start
```

Server runs on:
👉 [http://localhost:5000](http://localhost:5000)

---

### Step 5 — Run Frontend

```bash
cd frontend
npm start
```

Frontend runs on:
👉 [http://localhost:3000](http://localhost:3000)

---

## 📊 Database Design

**Database:** MongoDB

### Collections:

**Users**

* name
* email
* password
* role

**Jobs**

* company
* role
* description
* location
* salary
* type

**Applications**

* userId
* jobId
* resumeUrl
* status
* appliedAt

---

## 🔒 Security Features

* JWT Authentication
* Protected Routes
* Password Hashing
* Role-Based Access

---

## 🌍 Future Enhancements

* Email notifications
* Resume parsing
* Pagination
* Job recommendations (ML)
* Google/LinkedIn login
* Mobile application
* Real-time notifications

---

## 🎓 Academic Use

This project is developed as part of:

**B.Tech Computer Science (Full Stack & DevOps Project)**

Useful for:

* Academic submission
* Portfolio projects
* Full stack practice

---

## 👨‍💻 Author

**Name:** Sanith Akula
**Course:** B.Tech CSE
**Project:** Hire – Job Portal

🔗 GitHub:
[https://github.com/your-username/job-portal](https://github.com/your-username/job-portal)

---

## 📜 License

This project is developed for educational purposes only.

