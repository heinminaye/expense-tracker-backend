# 💸 Expense Tracker Backend

Welcome to the **Expense Tracker Backend**! This project is built with **Node.js**, **Express**, **Sequelize**, and **PostgreSQL** to manage expenses and categories in a secure and efficient manner.

### 🚀 Features

Currently, the backend supports the following features:

- **Add, update, and delete expenses**
- **Add and retrieve categories**

Upcoming features include:

- **Update and delete categories**
- **Staff, Income, Branch and some other features**

### 🧰 Prerequisites

To run this project locally, you’ll need the following:

- **Node.js** (v18 or later recommended)
- **PostgreSQL** database
- **npm** (comes with Node.js)
  
### Before starting the server, configure your database. Open the config/db.config.js
module.exports = {
  HOST: "localhost",
  USER: "postgres", // Change with your own postgres username
  PASSWORD: "123456789", // Change with your own postgres password
  DB: "expense", // Change with your own DB
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};


### ⚙️ Getting Started

#### Step 1: Clone the repository

To get started, clone the repository to your local machine by running:

```bash
git clone https://github.com/yourusername/expense-tracker-backend.git
cd expense-tracker-backend
