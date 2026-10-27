# NMD Dispatch Planner

Daily dispatch planning for **Nasik Metaldust Pvt. Ltd. (Plant 65)**. The plan is built from the ERP pending Sales Order Register. It follows customer priority (P1 / P2 / Hold) and then FIFO by required date or PO date. Quantities are entered per PO, and plans go through approval.

- **Hosting:** GitHub Pages (free) serves the app.
- **Data:** Google Firebase Cloud Firestore (free "Spark" plan) stores the shared data.
- **Login:** the same click-based Admin / Planner / Viewer login as the app. Behind the scenes, each login is its own protected Firebase account.

---

## What's in this repository

| File | Purpose |
|---|---|
| `index.html` | The planner app |
| `firebase-config.js` | **Your** Firebase project settings. You fill this in. |
| `firebase-bridge.js` | Connects the app and its logins to Firebase, and turns on normal Excel/PDF downloads. No changes needed. |
| `setup.html` | One-time setup: creates the logins and imports the old data |
| `firestore.rules` | Database security rules to paste into Firebase. No changes needed. |
| `.gitignore` | Stops data backups (`*.json`) from being uploaded to GitHub |

> ⚠️ Never upload the data backup file (`nmd-data-backup-….json`) to GitHub. It contains customer orders and login data.

---

## Setup (about 20 minutes, one time)

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> and sign in with a company Google account.
2. Click **Add project**, name it `nmd-dispatch`, and turn Google Analytics off. Then click **Create**.
3. Under **Build → Firestore Database**, click **Create database**.
   - Location: **asia-south1 (Mumbai)**.
   - Mode: **production mode**.
4. Under **Build → Authentication**, click **Get started**. Open **Sign-in method** and enable **Email/Password**. Don't add any users here; the setup page creates them.
5. Under **Firestore Database → Rules**, paste the whole contents of `firestore.rules` and click **Publish**.

### 2. Register the web app and copy its settings
1. Open **Project settings** (gear icon) → **General** → **Your apps**, and click the **</>** (Web) icon.
2. Enter the nickname `nmd-dispatch-web`. Don't tick Firebase Hosting. Click **Register app**.
3. Copy the values shown in `firebaseConfig` (apiKey, authDomain, projectId and the rest).

### 3. Fill in `firebase-config.js`
Paste the values into `firebase-config.js`, replacing the example values.

### 4. Put the code on GitHub
1. Create a free account at <https://github.com> if you don't have one.
2. Click **New repository**.
   - Name: `nmd-dispatch-planner`.
   - Visibility: **Public**, because GitHub Pages needs a public repository on the free plan. Your data stays in Firebase, not GitHub.
   - Click **Create repository**.
3. Click **uploading an existing file**.
   - Drag in `index.html`, `firebase-config.js`, `firebase-bridge.js`, `setup.html`, `firestore.rules`, `README.md` and `.gitignore`.
   - Click **Commit changes**.

   If you use Git on your PC instead:
   ```bash
   cd nmd-dispatch-planner
   git init
   git add .
   git commit -m "NMD Dispatch Planner"
   git branch -M main
   git remote add origin https://github.com/<your-user>/nmd-dispatch-planner.git
   git push -u origin main
   ```
4. In the repository, open **Settings → Pages**.
   - Source: **Deploy from a branch**.
   - Branch: **main**, folder **/ (root)**.
   - Click **Save**.
5. After 1–2 minutes the app is live at
   `https://<your-user>.github.io/nmd-dispatch-planner/`

### 5. Allow your GitHub address in Firebase
In Firebase, open **Authentication → Settings → Authorized domains**, click **Add domain**, and enter `<your-user>.github.io`.

### 6. Create logins and load your data (one time)
1. Open `https://<your-user>.github.io/nmd-dispatch-planner/setup.html`.
2. **Optional:** choose `nmd-data-backup-2026-10-27.json` to bring over the pending SO, saved plans, quantities, priorities and the login list (admin / planner / nmd).
3. Type a password for each login. You can keep the old passwords.
4. Click **Create logins & import**.
5. Open the planner and log in exactly as before: click the role, click the name and type the password.

Run the setup page only once. After that, manage logins in the app's **Users** tab.

---

## Daily use
1. **Admin / Planner:** upload the day's **Sales Order Register** in **Pending SO**.
2. Set customer priorities. Then enter qty item-wise or with **Download qty sheet → Upload qty sheet** (one row per PO, any date).
3. **Save plan** and **Approve**. The Viewer sees only approved plans.
4. Use **Print PDF**, **Export to Excel** or **Share plan** (WhatsApp Web / Outlook Web).

## Updating the app later
Replace `index.html` in GitHub (**Add file → Upload files**, then commit). The site updates in about a minute. Your data in Firebase is not affected.

## Backups
In the Firebase console, open **Firestore Database** and use **Import/Export**. Exports need the paid "Blaze" plan, which is pay-as-you-go and costs almost nothing at this size. You can also download Pending SO and plan Excel files from the app regularly.

## Logins (Users tab, Admin only)
- **Add a user:** enter the Login ID, name, role and password. The login is created at once.
- **Change a role:** edit the user and change the role. It takes effect immediately.
- **Reset someone's password:** edit the user and type a new password. The old password stops working.
- **Remove a user:** that login can no longer open any data.
- A login stays signed in only for that browser tab. Closing the tab or clicking **Sign out** logs it out.

## Security notes
- The database itself checks every request. Without a valid login, nobody can read or change data, even with the link. A Viewer login can only read.
- The login screen shows only names and roles. Passwords are never stored in readable form.
- Firebase free plan limits (50k reads and 20k writes per day) are far above what this app uses.
