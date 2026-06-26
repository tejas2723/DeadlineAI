# DeadlineAI — Proactive AI-Driven Task & Career Planner

DeadlineAI is a modern, premium productivity companion and career assistant. It combines intelligent task prioritization, automated calendar scheduling, a custom Focus Engine, voice interaction simulations, and a personalized Career Opportunity Detector that automatically matches you to jobs, hackathons, and open-source projects.

---

## ✦ Key Features

### 1. AI Opportunity Detector (Personalized Career Hub)
Instead of static job lists, the detector continuously reviews your skills, goals, project histories, and calendar availability.
- **Match Score Breakdown:** Displays weighted match factors (Skills, Experience, Location, Interests, Availability, Resume Strength).
- **Resume Gap Analysis:** Points out what is missing from your profile and generates a structured study roadmap with time estimates.
- **Auto Application Prep:** Pre-drafts copyable tailored Cover Letters, elevator pitches, highlighted repositories, and interview checklists.
- **Forecast & Weekly Digest:** Predicts seasonal opening times and delivers a summary card of your career matches.

### 2. Focus Engine (Smart Pomodoro Replacement)
Locks in your tasks based on cognitive load and schedules sessions dynamically.
- **Locked Timers:** Automatically calculates effort (50m for high, 35m for medium, 20m for low).
- **Peak Hour Learning:** Logs complete sessions to calculate your daily peak productivity windows.

### 3. AI Scheduling & Auto-Scheduler
- **June 2026 Grid:** Integrates deadline overlays directly on a month-view calendar.
- **AI Auto-Schedule:** Maps pending backlog tasks onto free blocks during the day (e.g. 2:00 PM "write pitch deck") with one click.

### 4. Intelligent Backlog Prioritization
- Backlog tasks are sorted dynamically based on an `urgency × energy` score.
- Features custom color indicators (Red/Amber/Green) for clear visual status checks.

### 5. Voice Mode Simulator
- Glow-ring orb animations that simulate voice processing states (`listening` → `processing` → `speaking`) using browser-native SpeechSynthesis.

### 6. Email Alerts Scheduler
- Integrates Nodemailer and Google Gemini to send hourly, personalized, tone-specific deadline alerts and overdue summaries to users.

---

## 🛠️ Technology Stack

* **Frontend:** React, TailwindCSS, Lucide Icons, Axios, Recharts
* **Backend:** Node.js, Express.js (v5), Mongoose
* **Database:** MongoDB Atlas (Cloud Database)
* **AI Engine:** Google Gemini (`gemini-2.5-flash` with automatic cascades to `gemini-1.5-flash` and `gemini-1.5-flash-8b` for 100% availability)
* **Deployment:** Docker Multi-stage Container, Google Cloud Run

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v20+)
- MongoDB Atlas database URI
- Gemini API Key

### Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file based on the template:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/deadlineai
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_gmail_address
   SMTP_PASS=your_gmail_app_password
   SMTP_FROM="DeadlineAI Team <noreply@deadlineai.com>"
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```
3. Install dependencies and start server:
   ```bash
   npm install
   npm run dev
   ```

### Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies and start client:
   ```bash
   npm install
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Google Cloud Run Deployment

We use a single-container multi-stage Docker build that bundles the Express backend and serves the compiled React assets statically in production mode.

To deploy:
1. Ensure your Google Cloud SDK is authenticated and billing is enabled on your project:
   ```bash
   gcloud config set project deadlineai-1923
   ```
2. Deploy the container from the project root:
   ```bash
   gcloud run deploy deadlineai --source . --port 5000 --allow-unauthenticated --region us-central1 --set-env-vars NODE_ENV=production,MONGO_URI="your_mongodb_uri",JWT_SECRET="secret",GEMINI_API_KEY="key",SMTP_HOST="smtp.gmail.com",SMTP_PORT=587,SMTP_USER="email",SMTP_PASS="pass",SMTP_FROM="email"
   ```
