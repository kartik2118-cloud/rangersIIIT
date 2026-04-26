<div align="center">
  <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1200&h=400" alt="FestPass Banner" />

  <h1>🎟️ FestPass</h1>
  <p><strong>One Wallet, Every Fest. Say goodbye to physical coupons and long lines.</strong></p>
</div>

---

## 🤔 What is FestPass?

FestPass is a simple digital wallet app for college students. Instead of buying paper coupons for every college festival you attend, you simply load your FestPass wallet with **FEST tokens** and use your phone to pay at any food stall or event. 

## 📱 How to Use It (User Guide)

Using the app is incredibly simple:

1. **Create an Account:** 
   Sign up with your name, email, and college roll number. The app will automatically generate a secure digital wallet for you in the background.

2. **Check Your Balance:** 
   Go to the **Wallet** tab to see your current FEST token balance and view which college festivals are currently active.

3. **Make a Payment:** 
   When you are at a food stall or event, tap the **Pay** tab. Select the merchant you want to pay, enter the amount in FEST tokens, and click Pay. The transaction is instant!

4. **Track Spending:** 
   Go to the **History** tab to see exactly where you spent your tokens and how much you have left.

<div align="center">
  <img src="https://images.unsplash.com/photo-1616077168712-fc6c788db4af?auto=format&fit=crop&q=80&w=800" alt="App UI Mockup" width="400" style="border-radius: 16px; margin-top: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
</div>

---

## 💻 How to Run the App (Developer Guide)

If you are a developer and want to run this app on your own computer, follow these simple steps:

### 1. Download the Code
Open your terminal and clone the repository:
```bash
git clone https://github.com/kartik2118-cloud/rangersIIIT.git
cd festpass
```

### 2. Install Requirements
Install all the necessary packages to run the app:
```bash
npm install
```

### 3. Setup the Environment
The app needs a secret key to keep user logins secure. 
1. Create a new file named `.env` in the main folder.
2. Open it and paste the following line inside:
```env
JWT_SECRET=my_super_secret_password_123
```

### 4. Start the App
Run the server:
```bash
npm run dev
```
Now, open your web browser and go to **[http://localhost:3000](http://localhost:3000)** to see the app!

---

## 🛠️ Built With

*   **Next.js 15 & React 19:** The core framework for the website.
*   **Vanilla CSS:** Clean, custom styling with a warm, minimal aesthetic.
*   **JWT (JSON Web Tokens):** For secure user logins.
*   **Base Sepolia (Blockchain):** The app's payments are designed to connect to the blockchain for secure, gasless transactions.
