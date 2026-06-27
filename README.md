# 🚀 TicketBari Server

<div align="center">

<img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js" />
<img src="https://img.shields.io/badge/Express.js-5-black?style=for-the-badge&logo=express" />
<img src="https://img.shields.io/badge/MongoDB-7.3-green?style=for-the-badge&logo=mongodb" />
<img src="https://img.shields.io/badge/Better%20Auth-Authentication-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Stripe-Payment-635BFF?style=for-the-badge&logo=stripe" />

# TicketBari Backend API

A secure RESTful backend powering the **TicketBari** online ticket booking platform.

</div>

---

# 🌐 Live API

### Production

https://ticketbari-server-nu.vercel.app/

---

# 📖 Overview

TicketBari Server is responsible for handling:

- Authentication
- User Management
- Ticket Management
- Booking Management
- Stripe Payments
- Vendor Operations
- Admin Operations
- MongoDB Database

The API is designed using REST principles and supports secure role-based access for **Users**, **Vendors**, and **Admins**.

---

# ✨ Features

## 🔐 Authentication

- Better Auth Integration
- Secure Session Management
- Protected Routes
- Role-Based Authorization
- Login & Registration APIs

---

## 👤 User APIs

- View Available Tickets
- Book Tickets
- View Booking History
- View Transactions
- Update Profile

---

## 🚌 Vendor APIs

- Add Ticket
- Update Ticket
- Delete Ticket
- View Own Tickets
- View Booking Requests
- Revenue Overview

---

## 👑 Admin APIs

- Manage Users
- Manage Tickets
- Approve Tickets
- Reject Tickets
- Advertise Tickets

---

## 🎫 Ticket Management

- Create Ticket
- Update Ticket
- Delete Ticket
- Get All Tickets
- Get Ticket Details
- Search Tickets
- Filter Tickets
- Sort Tickets

---

## 💳 Payment

- Stripe Checkout
- Payment Intent
- Booking Confirmation

---

# 🛠 Tech Stack

## Runtime

- Node.js

## Framework

- Express.js

## Database

- MongoDB Atlas

## Authentication

- Better Auth

## Payment

- Stripe

## Deployment

- Vercel

---

# 📦 NPM Packages

- express
- mongodb
- better-auth
- @better-auth/mongo-adapter
- stripe
- cors
- dotenv

---

# 📂 Project Structure

```
server
│
├── routes
│
├── middleware
│
├── controllers
│
├── config
│
├── utils
│
├── db
│
├── app.js
│
└── server.js
```

---

# 🔐 Authentication Flow

```
Client

↓

Login / Register

↓

Better Auth

↓

MongoDB Session

↓

Protected API

↓

Response
```

---

# 👥 Role-Based Access

## 👤 User

- Browse Tickets
- Book Tickets
- View Transactions
- Manage Profile

---

## 🚌 Vendor

- Add Ticket
- Update Ticket
- Delete Ticket
- View Booking Requests
- Revenue Dashboard

---

## 👑 Admin

- Manage Users
- Manage Tickets
- Advertise Tickets

---

# 📡 REST API Endpoints

## Authentication

| Method | Endpoint |
|----------|----------|
| POST | /api/auth/login |
| POST | /api/auth/register |
| POST | /api/auth/logout |

---

## Tickets

| Method | Endpoint |
|----------|----------|
| GET | /api/tickets |
| GET | /api/tickets/:id |
| POST | /api/tickets |
| PATCH | /api/tickets/:id |
| DELETE | /api/tickets/:id |

---

## Bookings

| Method | Endpoint |
|----------|----------|
| POST | /api/bookings |
| GET | /api/bookings |
| PATCH | /api/bookings/:id |

---

## Users

| Method | Endpoint |
|----------|----------|
| GET | /api/users |
| PATCH | /api/users/:id |

---

## Advertisements

| Method | Endpoint |
|----------|----------|
| GET | /api/advertisements |
| POST | /api/advertisements |

---

# 🚀 Installation

Clone repository

```bash
git clone https://github.com/shakil218/ticketbari-server.git
```

Go inside

```bash
cd ticketbari-server
```

Install dependencies

```bash
npm install
```

Create

```
.env
```

Environment Variables

```env
PORT=

MONGODB_URI=

DB_NAME=

BETTER_AUTH_SECRET=

BETTER_AUTH_URL=

STRIPE_SECRET_KEY=

CLIENT_URL=
```

Run

```bash
npm run dev
```

---

# 🌍 Environment Variables

| Variable | Description |
|------------|-------------|
| PORT | Server Port |
| MONGODB_URI | MongoDB Connection URI |
| DB_NAME | Database Name |
| BETTER_AUTH_SECRET | Better Auth Secret |
| BETTER_AUTH_URL | Authentication Base URL |
| STRIPE_SECRET_KEY | Stripe Secret Key |
| CLIENT_URL | Frontend URL |

---

# 🔄 Backend Workflow

```
Client Request

↓

Express Route

↓

Authentication Middleware

↓

Controller

↓

MongoDB

↓

Response
```

---

# 📈 Future Improvements

- Redis Caching
- Rate Limiting
- API Versioning
- Email Notifications
- QR Code Generation
- PDF Ticket Generation
- Logging System
- Unit Testing
- Docker Support

---

# 🤝 Contributing

1. Fork the repository

2. Create a branch

```bash
git checkout -b feature-name
```

3. Commit

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature-name
```

5. Open Pull Request

---

# 📄 License

Licensed under the **MIT License**.

---

# 👨‍💻 Developer

## Rabiul Hasan Shakil

GitHub

https://github.com/shakil218

---

# ⭐ Support

If you found this project useful, please consider giving the repository a ⭐.

It helps others discover the project and encourages future development.

---

<div align="center">

### 🚀 Built with Node.js, Express.js, MongoDB, Better Auth & Stripe

**TicketBari Backend API**

</div>
