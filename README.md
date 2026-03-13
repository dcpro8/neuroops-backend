# 🧠 NeuroOps Backend

> **AI-Powered DevOps Intelligence Platform — Backend Microservices**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Queue-Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Infrastructure-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📖 Overview

**NeuroOps** is an AI-powered DevOps intelligence platform that automatically analyzes GitHub Pull Requests and detects potential risks before code is merged.

The backend system processes GitHub webhook events, performs AI-based code analysis, stores insights, and exposes APIs used by the NeuroOps analytics dashboard. This repository contains the **event-driven backend architecture** responsible for:

* **Pull request ingestion**
* **AI risk analysis**
* **GitHub comment automation**
* **Analytics aggregation**
* **Real-time frontend updates**

---

## 🏗 Architecture

NeuroOps uses an **event-driven microservice architecture** to decouple webhook ingestion from AI processing.

```mermaid
graph TD
A[GitHub Pull Request] --> B[GitHub Webhook Service]
B --> C[Redis Queue - BullMQ]
C --> D[Worker Service]
D -->|AI Analysis| E[NVIDIA Kimi 2.5 API]
D --> F[(MongoDB Atlas)]
F --> G[Gateway API]
G --> H[React Dashboard]
G -->|SSE| H

```

---

# 🧩 Core Services

### 🔌 GitHub Service
Receives webhook events from GitHub when pull requests are opened or updated.
* **Responsibilities:** Verify webhook signatures & push PR jobs into a Redis queue.

### ⚙️ Worker Service
Processes queued pull request events.
* **Responsibilities:** Fetch PR diff from GitHub, perform AI analysis, extract risk scores, store results in MongoDB, post AI review comments, and notify the dashboard via SSE.

### ⛩️ Gateway Service
REST API layer used by the frontend dashboard.
* **Responsibilities:** Serve PR analytics, expose REST endpoints, and broadcast SSE updates to the dashboard.

---

# ✨ Key Features

* **🤖 AI Pull Request Risk Analysis:** Each pull request diff is analyzed using the **NVIDIA Kimi-2.5** AI model to detect potential bugs, security risks, performance issues, and risky patterns.
  
* **💬 Automated GitHub PR Comments:** AI feedback is automatically posted directly to the pull request as a review comment, streamlining the peer review process.
  
* **⚡ Real-Time Dashboard Updates:** The frontend receives updates instantly using **Server-Sent Events (SSE)** the moment an analysis is finalized.
  
* **📦 Queue-Based Processing:** Powered by **BullMQ + Redis** to ensure reliable background job execution and seamless horizontal scalability.back is automatically posted directly to the pull request as a review comment.

---

### 🛠 Tech Stack

  | Component | Technology |
  | :--- | :--- |
  | **Backend** | `Node.js`, `Express` |
  | **Queue** | `BullMQ`, `Redis (Upstash)` |
  | **Database** | `MongoDB Atlas` |
  | **AI** | `NVIDIA Kimi-2.5 API` |
  | **Infrastructure** | `Docker`, `Render` |

---

### 📂 Project Structure

```bash
.
├── services/
│   ├── github-service/    # Webhook handler & Job producer
│   ├── worker-service/    # AI Analysis & PR Reviewer
│   └── gateway-service/   # API & Dashboard SSE updates
├── docker-compose.yml     # Local orchestration
├── .env.example           # Template for environment variables
└── README.md              # Project documentation

```

---

### ⚙️ Environment Variables

Create a `.env` file in the root with the following keys:

```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_token
WEBHOOK_SECRET=your_webhook_secret

# Database & Queue
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/neuroops
REDIS_URL=rediss://default:password@upstash-url:6379

# AI Configuration (NVIDIA Kimi-2.5)
NVIDIA_API_KEY=your_kimi_api_key

# Service URLs
GATEWAY_URL=[https://neuroops-gateway.onrender.com/](https://neuroops-gateway.onrender.com/)

```

---

### 💻 Running Locally

1. **Clone the repository**
   ```bash
   git clone [https://github.com/dcpro8/neuroops-backend.git](https://github.com/dcpro8/neuroops-backend.git)
   cd neuroops-backend
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run services**
   ```bash
   docker compose up --build
   ```

---

## 🚢 Deployment

The backend is deployed on **Render** using a microservices architecture.

* **Services Deployed:** `github-service`,`worker-service`,`gateway-service`.

* **External Cloud Services:**

  * **Database:** MongoDB Atlas

  * **Queue:** Upstash Redis

  * **AI Engine:** NVIDIA Kimi-2.5 API

---

 ### 🛣 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/webhook` | Receive GitHub webhook events |
| `GET` | `/api/prs` | Return analyzed pull requests |
| `GET` | `/api/analytics/*` | Analytics endpoints used by dashboard |
| `GET` | `/api/events` | SSE stream for real-time updates |

---

### 👤 Author

**Dhruv Chauhan**

### 📄 License

This project is licensed under the **MIT License**.