# KloudRaksha: Comprehensive Cloud Auditing Tool

## Project Overview
KloudRaksha is a cloud auditing tool addressing security and compliance challenges in multi-cloud environments. It provides real-time monitoring, misconfiguration detection, regulatory compliance checks, and actionable insights for diverse stakeholders.

## Problem Definition
Organizations face challenges in managing cloud security due to:
- Multi-cloud complexity.
- Misconfigurations in cloud services.
- Manual audits.
- Overly technical reports.

## Objectives
- Support for AWS, Azure, and GCP.
- Real-time automated auditing.
- Customizable compliance checks.
- Scalable for dynamic infrastructures.
- User-friendly reports.

## Core Features
- **Automated Audits**: Accurate cloud assessments.
- **Real-Time Insights**: Immediate compliance and security updates.
- **Actionable Recommendations**: Tailored guidance to mitigate risks.

## Team & Roles
- **Project Manager**: Mandar Waghmare
- **Lead Developer**: Parth Bhattad
- **Frontend Developers**: Riya Wani, Mustafa Trunkwala
- **Backend Developers**: Mustafa Trunkwala, Ameya Surana
- **Designer**: Riya Wani

---

# Technical Architecture

### Frontend
- **Technology**: React with TypeScript and Vite
- **Styling**: TailwindCSS, Material UI, Radix UI
- **Key Features**: Dashboard for reports, compliance metrics, and remediation.

### Backend
- **Technology**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Features**: JWT Authentication, Razorpay integration, API endpoints for scans, payments, and user management.

---

# Backend Setup

### Prerequisites
- Node.js (v18 or higher), MongoDB

### Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Environment Setup**
   Create `.env` file:
   ```env
   PORT=8000
   MONGODB_URL=<connection_string>
   JWT_SECRET=<secret>
   COOKIE_SECRET=<secret>
   RAZORPAY_KEY_ID=<key>
   RAZORPAY_KEY_SECRET=<secret>
   ```
4. **Run Development Server**
   ```bash
   npm run dev
   ```

### Key API Routes
- **User Management**: Register, login, profile updates.
- **Auditing**: Scan requests, results, and history.
- **Payment**: Create and verify payments.
- **Admin**: Manage users and roles.

---

# Frontend Setup

### Prerequisites
- Node.js (v18 or higher), npm or yarn

### Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Environment Setup**
   Create `.env` file:
   ```env
   VITE_API_URL=<backend_url>
   ```
4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

# Audit Script Overview

## Features
- Uses Prowler for AWS audits.
- Stores findings in MongoDB.
- Generates PDF reports.
- Sends email notifications.

### Prerequisites
- Docker, AWS CLI, MongoDB Atlas URI.

### Setup
1. Modify `audit_script.py` as needed.
2. Build Docker image:
   ```bash
   docker build -t audit-tool .
   ```
3. Run Docker container:
   ```bash
   docker run -e AWS_ACCESS_KEY_ID=<key> \
              -e AWS_SECRET_ACCESS_KEY=<secret> \
              -e office_email=<email> \
              audit-tool
   ```

---

# Flask-Based Server

### Features
- Runs audits using AWS services.
- Manages user data in MongoDB.
- Sends email notifications.

### Setup
1. **Install Python**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Run Server**
   ```bash
   flask run
   ```

---

# Security Features
- JWT Authentication
- Password Hashing (bcrypt)
- CORS Protection
- Input Validation (Zod)

# Monitoring & Logging
- Morgan for HTTP logging.
- Debug for development logs.
- Error tracking for production.

---

# Contributions
1. Create a new branch.
2. Make changes.
3. Submit a pull request.


---

# Containerized Setup

1. **Copy environment files**
   - Root: `cp .env.example .env`
   - Backend: `cp backend/.env.sample backend/.env`
   - Flask audit service: `cp server/.env.example server/.env`
   - Frontend (optional overrides): `cp frontend/.env.example frontend/.env`
2. **Populate secrets** with local MongoDB details (defaults point at the bundled container), AWS credentials (IAM user with S3 + SES permissions and a verified sender on `vaultix.in`), and the bucket/prefix where raw Prowler JSON files should live.
3. **Start the stack**
   ```bash
   docker compose up --build
   ```
   > On Linux, run the command with sufficient privileges (or add your user to the `docker` group) so the audit service can reach `/var/run/docker.sock` and launch the Prowler container on demand.
4. Access the services:
   - Frontend UI: `http://localhost:${FRONTEND_PORT:-4173}`
   - Backend API: `http://localhost:${BACKEND_PORT:-8080}/api`
   - Flask audit health check: `http://localhost:${AUDIT_PORT:-6000}/ping`

The audit container mounts the Docker socket from the host runtime so every scan can spin up a fresh `toniblyx/prowler` container, upload the raw JSON to S3, store normalized findings in MongoDB, and notify the Node backend through its callback URL.

## Security Hardening
- **Secrets stay local**: `.gitignore` excludes environment files (while keeping `*.env.example` templates) so JWT secrets, Mongo credentials, and AWS keys never leave your machine.
- **Strict cookies**: Auth tokens are issued as HTTP-only cookies with `SameSite=Strict` and `Secure` enabled in production, blocking client-side access and CSRF attacks.
- **Encrypted credentials**: User passwords are hashed with bcrypt before storage and compared using the hash—legacy plaintext passwords should be reset.
- **Rate limiting & CORS**: `express-rate-limit` throttles abusive traffic, and the `CORS_ALLOWED_ORIGINS` env var lets you restrict which frontends can call the APIs.
- **Hardened middleware**: Helmet remains enabled, and the Express app now trusts upstream proxies so TLS terminators can pass real client IPs for logging and enforcement.

---

# Production Deployment (kloudraksha.com)

1. **Infrastructure prerequisites**
   - Provision an Ubuntu-based EC2 instance with Docker Engine + Compose plugin installed.
   - Point `kloudraksha.com` (and `www.kloudraksha.com` if desired) to the EC2 public IP.
   - Issue TLS certificates with Let’s Encrypt/Certbot (or terminate TLS at a load balancer). Keep ports 80/443 open.

2. **Environment configuration**
   - Copy `.env.example`, `backend/.env.sample`, and `server/.env.example` on the EC2 host and rename each to `.env`. Populate secrets for Mongo, JWT/COOKIE keys, AWS credentials, SES sender, and S3 bucket.
   - Set `CORS_ALLOWED_ORIGINS=https://kloudraksha.com,https://www.kloudraksha.com` (add any extra domains/comma-separated) and keep `PUBLIC_API_URL=/api` so the frontend proxies via the same origin.

3. **Reverse proxy (HTTPS)**
   Run Nginx/Caddy/Traefik on the EC2 host to forward traffic to the frontend container (port 4173). Example Nginx snippet:

   ```nginx
   server {
     listen 443 ssl http2;
     server_name kloudraksha.com;

     ssl_certificate /etc/letsencrypt/live/kloudraksha.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/kloudraksha.com/privkey.pem;

     location / {
       proxy_pass http://127.0.0.1:4173;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

   The frontend container already proxies `/api/*` to the backend container, so only the `4173` listener needs to be publicly exposed.

4. **Manual deployment**
   ```bash
   docker compose up -d --build
   ```
   This builds/pulls all services (frontend, backend, audit, Mongo) and restarts them.

5. **GitHub Actions pipeline**
   - A workflow at `.github/workflows/deploy.yml` automates deployments on pushes to `main`.
   - Add the following repository secrets: `EC2_HOST` (public IP/DNS), `EC2_USER` (e.g., `ubuntu`), and `EC2_SSH_KEY` (private key contents with newline escapes).
   - The pipeline rsyncs the repository to `/home/<user>/kloudraksha` on the EC2 host, preserves sensitive `.env*` files, and runs `docker compose up -d --build` remotely. Logs are visible in the Actions tab.

6. **Verification**
   - Browse to `https://kloudraksha.com` and confirm static assets load over HTTPS.
   - Submit a scan and watch `docker logs -f audit` on the server; each request should spin up a `prowler_<auditId>` container and the admin dashboard should display the requester, purpose, and results after completion.
