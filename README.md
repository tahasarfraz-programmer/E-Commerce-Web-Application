## Requirements

Before installing Atelier, make sure these are installed:

* Node.js 20.6 or newer
* MySQL 8.0 or newer
* Git (optional, only required if you want to clone or publish the project)

Node.js 20.6+ is required because the project uses Node's built-in `--env-file` option.

---

## Step-by-Step Installation

### Step 1 — Download or Clone the Project

Download the project ZIP and extract it, or clone the repository using Git.

After extracting, open the project folder.

The project should have this structure:

```text
atelier/
├── client/
├── server/
├── database/
├── docs/
├── scripts/
├── .env.example
├── package.json
└── README.md
```

---

### Step 2 — Open the Project in Terminal

Open PowerShell or Command Prompt inside the `atelier` project folder.

Example:

```powershell
cd "C:\path\to\atelier"
```

You can also open the folder in VS Code and use its built-in terminal.

---

### Step 3 — Install Root Dependencies

From the project root, run:

```powershell
npm install
```

Wait until the installation finishes.

---

### Step 4 — Install Client Dependencies

Move into the client folder:

```powershell
cd client
```

Install the frontend dependencies:

```powershell
npm install
```

Then return to the project root:

```powershell
cd ..
```

---

### Step 5 — Install Server Dependencies

Move into the server folder:

```powershell
cd server
```

Install the backend dependencies:

```powershell
npm install
```

Then return to the project root:

```powershell
cd ..
```

---

### Step 6 — Make Sure MySQL Is Running

Start your MySQL 8 server.

You can use MySQL Workbench or the MySQL Windows service.

To check that MySQL is available, run:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Enter your MySQL root password.

If you see:

```text
Welcome to the MySQL monitor.
```

MySQL is running correctly.

Type:

```sql
exit;
```

to leave MySQL.

---

### Step 7 — Create the Database

The project includes the database structure in:

```text
database/schema.sql
```

From the project root, run:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "source database/schema.sql"
```

Enter your MySQL root password when requested.

The script creates the `atelier` database and all required tables.

MySQL officially supports executing SQL scripts through the `source` command.

> **Windows PowerShell note:** Do not use `mysql < database/schema.sql` directly in PowerShell because `<` is reserved by PowerShell. Using MySQL's `source` command avoids this issue.

---

### Step 8 — Verify the Database

Run:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "USE atelier; SHOW TABLES;"
```

You should see the project's database tables.

---

### Step 9 — Create the Environment File

The project includes:

```text
.env.example
```

Make a copy of it and name the copy:

```text
.env
```

From the project root, run:

```powershell
Copy-Item .env.example .env
```

---

### Step 10 — Configure `.env`

Open the `.env` file:

```powershell
notepad .env
```

Update the database settings with your MySQL credentials.

Example:

```env
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=YOUR_MYSQL_PASSWORD
DATABASE_NAME=atelier

JWT_SECRET=YOUR_LONG_RANDOM_SECRET

PORT=4000
CLIENT_URL=http://localhost:5173

NODE_ENV=development
TRUST_PROXY=0

SMTP_URL=
MAIL_FROM=Atelier <no-reply@example.com>
```

Replace:

```text
YOUR_MYSQL_PASSWORD
```

with your actual MySQL root password.

Also replace:

```text
YOUR_LONG_RANDOM_SECRET
```

with a long random secret.

Do **not** commit `.env` to GitHub.

The project already ignores `.env` through `.gitignore`.

---

### Step 11 — Generate a JWT Secret

You can generate a secure random secret using Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value and put it in:

```env
JWT_SECRET=YOUR_GENERATED_SECRET
```

---

### Step 12 — Seed the Database

Make sure you are in the project root:

```powershell
cd "C:\path\to\atelier"
```

Run:

```powershell
npm run seed
```

The seed command creates the initial data, including:

* Categories
* Brands
* Products
* Admin account
* Customer account
* Coupons
* Other sample data

The command prints the generated demo account passwords in the terminal.

**Save these credentials somewhere safe because the passwords are shown during seeding.**

---

### Step 13 — Start the Backend Server

Open a new PowerShell terminal.

Go to the server folder:

```powershell
cd "C:\path\to\atelier\server"
```

Start the development server:

```powershell
npm run dev
```

You should see something similar to:

```text
Database connected
API on :4000
```

Keep this terminal running.

The backend API runs on:

```text
http://localhost:4000
```

---

### Step 14 — Start the Frontend

Open another PowerShell terminal.

Go to the client folder:

```powershell
cd "C:\path\to\atelier\client"
```

Start Vite:

```powershell
npm run dev
```

You should see:

```text
VITE ready

Local: http://localhost:5173/
```

Keep this terminal running too.

---

### Step 15 — Open the Website

Open your browser and visit:

```text
http://localhost:5173/
```

The Atelier website should now open.

The frontend runs on port `5173`, while the Express API runs on port `4000`.

---

## Step 16 — Test the Application

Test the application in this order:

1. Open the home page.
2. Open the Shop page.
3. Browse the products.
4. Search or filter products.
5. Open a product.
6. Add a product to the cart.
7. Increase and decrease the quantity.
8. Remove a product from the cart.
9. Register a new account.
10. Sign in.
11. Add or check your address.
12. Apply a coupon.
13. Place a test order.
14. Open the Account page.
15. Check your order.
16. Sign in using the admin account.
17. Open the Admin area.
18. Check the dashboard.
19. Create a product.
20. Edit the product.
21. Delete the product.
22. Change an order status.
23. Check the browser console for errors.

---

## Step 17 — Run the Tests

From the project root, run:

```powershell
npm test --prefix server
```

The tests should complete without errors.

---

## Step 18 — Generate Screenshots

The project can generate screenshots of the real running application.

First make sure:

* MySQL is running.
* The database is seeded.
* The backend is running.
* The frontend is running.

Then install Playwright:

```powershell
npm run screenshots:install
```

After that, run the screenshot command.

On Windows PowerShell, set the admin password before running the command:

```powershell
$env:ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"
npm run screenshots
```

The screenshots will be saved inside:

```text
docs/screenshots/
```

Expected screenshots include:

```text
home.png
shop.png
product.png
cart.png
admin-overview.png
home-mobile.png
```

---

## Step 19 — Production Build

When the application is ready for production, build the React frontend:

```powershell
npm run build
```

The production frontend will be generated inside:

```text
client/dist/
```

Start the production server with:

```powershell
npm start --prefix server
```

For production, configure the correct:

```env
NODE_ENV=production
CLIENT_URL=your-production-url
```

Use HTTPS in production.

---

## Troubleshooting

### MySQL connection error

Check that:

* MySQL is running.
* `DATABASE_USER` is correct.
* `DATABASE_PASSWORD` is correct.
* `DATABASE_NAME=atelier`.
* `DATABASE_PORT=3306`.

---

### `mysql` is not recognized

If PowerShell says:

```text
mysql is not recognized
```

use the full MySQL path:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

---

### PowerShell shows an error for `<`

Do not use:

```powershell
mysql -u root -p < database/schema.sql
```

in PowerShell.

Instead use:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "source database/schema.sql"
```

MySQL documents `source` as a way to execute SQL scripts, and specifically notes the PowerShell `<` issue.

---

### `--env-file` error

Upgrade Node.js to version 20.6 or newer.

The project uses:

```powershell
node --env-file=.env
```

Node.js added the `--env-file` option in Node 20.6.0.

Check your Node version:

```powershell
node --version
```

---

### `ECONNREFUSED`

If the browser or frontend reports `ECONNREFUSED`, make sure the backend terminal is running:

```powershell
cd server
npm run dev
```

You should see:

```text
Database connected
API on :4000
```

---

### CORS error

Check that `.env` contains:

```env
CLIENT_URL=http://localhost:5173
```

The URL must match the address being used by the frontend.

---

### Website does not load

Make sure both terminals are running.

**Terminal 1 — Backend:**

```powershell
cd server
npm run dev
```

**Terminal 2 — Frontend:**

```powershell
cd client
npm run dev
```

Then open:

```text
http://localhost:5173/
```

---

## Important Security Notes

Never upload `.env` to GitHub.

The `.env` file can contain:

* Database passwords
* JWT secrets
* SMTP credentials
* Other private configuration

Only commit:

```text
.env.example
```

Never commit:

```text
.env
```

---

## Quick Start

After the first installation, you normally only need these steps:

### Terminal 1 — Backend

```powershell
cd "C:\path\to\atelier\server"
npm run dev
```

### Terminal 2 — Frontend

```powershell
cd "C:\path\to\atelier\client"
npm run dev
```

Then open:

```text
http://localhost:5173/
```

If the database has already been configured and seeded, you do not need to recreate it every time you start the project.
