<div align="center">
  <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1200&h=400" alt="FestPass Banner" />

  <h1>🎟️ FestPass</h1>
  <p><strong>One Digital Wallet, Every Campus Fest. Say goodbye to physical coupons and long lines.</strong></p>
</div>

---

## 🤔 What is FestPass?

FestPass is a simple, decentralized digital wallet application built for college students. Instead of buying paper coupons for every college festival you attend, you simply load your FestPass wallet with **FEST tokens** and use your phone to pay at any food stall, merchandise booth, or event. 

### ✨ Key Features
- **Seamless Login:** Sign up normally or instantly connect using Google via Firebase Authentication.
- **Unified Wallet:** One wallet and balance that works seamlessly across all participating campus festivals.
- **Fast Payments:** Tap to pay, with instant transaction processing and automatic QR Code generation for payment verification.
- **Persistent Storage:** All student profiles, balances, and transaction histories are securely stored in a live Supabase PostgreSQL database.

---

## 💻 How to Run the App (Developer Guide)

If you are a developer and want to run this application on your own computer, follow these step-by-step instructions:

### 1. Download the Code
Open your terminal and clone the repository:
```bash
git clone https://github.com/kartik2118-cloud/rangersIIIT.git
cd rangersIIIT
```

### 2. Install Requirements
Install all the necessary packages (including Next.js, Firebase, and Supabase SDKs):
```bash
npm install
```

### 3. Setup the Environment Variables
The application relies on secure cloud services to function. You must create an `.env` file to connect them.
1. Create a new file named `.env` in the main folder.
2. Copy the following structure and fill in your own API keys from Supabase and Firebase:

```env
# ── AUTH (Custom JWT) ────────────────────────
JWT_SECRET=your_super_secret_jwt_string_here

# ── SUPABASE (Database) ──────────────────────
# Get these from database.new -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ── FIREBASE (Google Sign-in) ────────────────
# Get these from Firebase Console -> Project Settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Setup the Database Schema
Before running the app, you need to create the database tables in Supabase:
1. Open the provided `schema.sql` file in this repository and copy all the text.
2. Go to your Supabase Project Dashboard.
3. Click on **SQL Editor** in the left sidebar.
4. Paste the SQL code and hit **Run**. This will generate the necessary `users` and `transactions` tables.

### 5. Start the Application
Run the local development server:
```bash
npm run dev
```
Now, open your web browser and go to **[http://localhost:4000](http://localhost:4000)** to view the app!

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js 15 (App Router) & React 19
*   **Styling:** Vanilla CSS (Glassmorphism & Dynamic UI)
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Firebase (Google OIDC) + Custom JSON Web Tokens (jose)
*   **QR Code API:** GoQR (qrserver)
