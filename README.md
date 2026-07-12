# 🚚 TransitOps

### Smart Fleet & Transport Management Platform

TransitOps is a modern fleet and transport management platform designed to streamline logistics and transportation operations through intelligent dashboards, real-time fleet monitoring, financial analytics, trip management, and secure role-based access.

The platform enables transport companies to efficiently manage vehicles, drivers, routes, finances, maintenance records, and operational workflows from a centralized system.

---

# ✨ Features

## 🔐 Authentication

- Secure User Registration
- Secure Login
- JWT Authentication
- Password Hashing
- Role-Based Authorization
- Protected Routes
- Session Management

---

## 👥 Role-Based Dashboards

TransitOps provides dedicated dashboards for different organizational roles.

### 👨‍💼 Admin

- System Overview
- User Management
- Fleet Monitoring
- Financial Insights
- Reports & Analytics

### 🚛 Fleet Manager

- Vehicle Management
- Driver Management
- Fleet Utilization
- Maintenance Tracking
- Trip Scheduling
- PDF Export Reports

### 💰 Financial Analyst

- Revenue Dashboard
- Expense Analysis
- Profit Reports
- Financial KPIs
- Invoice Management
- PDF Export Reports

### 🚚 Driver

- Assigned Trips
- Route Information
- Vehicle Details
- Trip Status Updates

---

# 🚛 Fleet Management

- Vehicle Registration
- Fleet Monitoring
- Vehicle Availability
- Fleet Utilization
- Fuel Monitoring
- Maintenance Scheduling
- Service History

---

# 🛣️ Trip Management

- Create Trips
- Assign Drivers
- Route Planning
- Trip Tracking
- Distance Management
- Delivery Monitoring

---

# 💰 Financial Management

- Revenue Tracking
- Expense Tracking
- Fuel Expenses
- Maintenance Costs
- Invoice Management
- Financial Reports
- Profit Analysis

---

# 📊 Analytics Dashboard

Interactive dashboards featuring:

- KPI Cards
- Revenue Charts
- Expense Charts
- Fleet Statistics
- Vehicle Utilization
- Driver Performance
- Trip Analytics
- Maintenance Analytics

---

# 📄 PDF Export

Available exclusively for:

- Financial Analyst
- Fleet Manager

Features include:

- Professional A4 Reports
- Dashboard Summary
- Charts & Graphs
- Data Tables
- KPIs
- Timestamp
- Automatic Download

---

# 🔍 Search & Filtering

- Global Search
- Advanced Filters
- Sorting
- Pagination
- Dynamic Data Tables

---

# 🛡️ Security

- JWT Authentication
- Password Encryption
- Role-Based Access Control
- Protected Backend APIs
- Input Validation
- Secure Environment Variables
- Robust Error Handling

---

# 🗄️ Database

- PostgreSQL Database
- Real-Time Data Integration
- CRUD Operations
- Relational Database Design
- Data Validation
- Foreign Key Relationships

---

# ⚙️ Tech Stack

## Frontend

- React.js
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Axios

## Backend

- FastAPI
- Python
- SQLAlchemy
- Pydantic
- JWT Authentication

## Database

- PostgreSQL

---

# 📂 Project Structure

```text
TransitOps
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
│
├── backend/
│   ├── app/
│   ├── routes/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── database/
│
├── prisma/
├── public/
├── README.md
└── .env.example
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/your-username/TransitOps.git
cd TransitOps
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

---

## Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

---

# ⚙️ Environment Variables

Create a `.env` file in the backend.

```env
DATABASE_URL=

SECRET_KEY=

JWT_SECRET=

ACCESS_TOKEN_EXPIRE_MINUTES=

FRONTEND_URL=
```

---

# ▶️ Running the Project

## Backend

```bash
uvicorn app.main:app --reload
```

## Frontend

```bash
npm run dev
```

---

# 🌐 Deployed Link

>

---

# 🔮 Future Enhancements

- AI-Based Fleet Predictions
- Driver Performance Analytics
- Fuel Consumption Optimization
- Live GPS Tracking
- Email & Push Notifications
- Mobile Application
- Multi-Tenant Architecture
- AI-Powered Route Optimization

---

# 👨‍💻 Contributors

- **Yash Bhandari**
- **Taranveer Singh Vig**
- **Aditya Dandgavhal**
- **Ayush Mishra**

---

# 📄 License

This project was developed for educational, learning, and hackathon purposes.

---

## ⭐ Support

If you found this project useful, consider giving the repository a ⭐ on GitHub!
