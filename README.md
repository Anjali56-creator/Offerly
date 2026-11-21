# Offerly

*from applied to offer*

A notebook-style web app for students to keep track of internship applications. Built with React 18, Vite, React Router and plain CSS. There is no backend yet, so everything is stored in localStorage.

## Features

**Login / Sign up**
- Sign up with full name, email, college, password and confirm password
- Login with email and password
- Validation with clear messages (required fields, email format, minimum 6 characters, passwords must match, "Email already registered", "Wrong email or password")
- Session is saved, so a refresh keeps you logged in
- Protected routes: logged-out users go to /login, logged-in users skip /login and go to /dashboard
- Header shows "Hi, <first name>" and a Logout button
- Forgot password (3 steps): enter email, enter a 6-digit code (valid for 10 minutes, shown on screen in demo mode), then set a new password

**Dashboard and categories**
- Six category cards (Government, Private, Startup, Research, Remote / Virtual, NGO / Social) with a "saved" count for each
- "+ Add Internship" opens a small **Quick add** modal (company, role, deadline; category is preselected on a category page; "+ more details" is optional). The full form page is still used for editing (`/edit-internship/:id`)
- **My Internships** page: everything you added or saved, sorted by deadline and grouped into "Due this week", "Upcoming" and "Deadline passed", with search, category / status / priority filters, a "Hide passed deadlines" toggle, a summary line and a status dropdown on every card
- Dashboard banner when a Wishlist internship has a deadline in the next 3 days
- Click a category to open its page: 8 sample listings per category with search, mode filter, "Paid only" and sort (nearest deadline / highest stipend)
- One-click **"+ Add"** on every listing card (and on the listing detail page, `/listing/:id`) copies all its details to My Internships as Wishlist. The button turns into "✓ Added" (click again to remove). A toast shows "Added to My Internships · Undo · View"
- Saved internships also show up on the category page with Edit and Delete
- Each user only sees their own data

> Note: the login is a frontend-only demo. Passwords are kept in plain text in localStorage, which is not safe. Real apps must use a backend (e.g. Firebase Auth or Node + JWT) with hashed passwords.

Not built yet: status board and charts.

## How to run

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal (usually http://localhost:5173).

To make a production build:

```bash
npm run build
```

## localStorage keys

| Key | What it holds |
| --- | --- |
| `offerly-users` | all registered users |
| `offerly-session` | the logged-in user |
| `offerly-reset` | the current password reset code and its expiry |
| `offerly-data-<userEmail>` | that user's internships |

## Folder structure

```
offerly/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                 entry point (Router + AuthProvider)
    ├── App.jsx                  routes
    ├── App.css                  all styles, CSS variables in :root
    ├── context/
    │   ├── AuthContext.jsx      user, login, signup, logout, password reset
    │   ├── InternshipsContext.jsx  the logged-in user's internships, shared by all pages
    │   └── ToastContext.jsx     the "Added · Undo · View" toast
    ├── hooks/
    │   └── useInternships.js    add / edit / delete + save for one user
    ├── components/
    │   ├── Header.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── CategoryCard.jsx
    │   ├── MyInternshipCard.jsx an internship on the My Internships page
    │   ├── ListingAddButton.jsx "+ Add" / "✓ Added" button
    │   ├── QuickAddModal.jsx    small add form
    │   ├── FloatingButton.jsx   mobile "📋 N" button
    │   ├── DeadlineBadge.jsx    "5 days left" / "today!" / "closed"
    │   ├── InternshipCard.jsx   a saved internship (Edit / Delete)
    │   └── ListingCard.jsx      a sample listing (Apply / Save)
    ├── pages/
    │   ├── Login.jsx
    │   ├── Signup.jsx
    │   ├── ForgotPassword.jsx
    │   ├── AddInternship.jsx    full form page (used for editing)
    │   ├── ListingDetail.jsx
    │   ├── MyInternships.jsx
    │   ├── Dashboard.jsx
    │   └── CategoryPage.jsx
    ├── data/
    │   └── internships.js       sample listings for all 6 categories
    └── utils/
        ├── storage.js           localStorage helpers with try/catch
        ├── listings.js          turns a listing into an internship
        ├── dates.js             daysLeft, deadlineText, formatDate, formatTime, todayString
        └── categories.js        the 6 categories
```
