# Veylora – Identity & Access Management Platform

Veylora is a web-based identity and account management application. It provides a responsive interface for account registration, login, password recovery, and access to a personal dashboard. The frontend communicates with a REST API built using FastAPI, with user and password-reset data stored in MySQL.

## Features

- **User registration:** Create an account using a name, email address, and password.
- **User login:** Authenticate with email and password.
- **Password hashing:** Store passwords as bcrypt hashes rather than plain text.
- **JWT authentication:** Issue bearer access tokens after successful login.
- **Protected profile endpoint:** Retrieve the signed-in user's profile using the JWT.
- **Forgot password:** Request a password-reset email.
- **Secure password reset:** Use a time-limited, single-use reset token.
- **Email notifications:** Send welcome and password-reset emails through SMTP.
- **Personal dashboard:** Display account information after authentication.
- **Logout:** Clear the browser's stored access token and return to the login page.
- **Responsive interface:** HTML and CSS pages with JavaScript-based API integration.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python, FastAPI |
| API server | Uvicorn |
| Database | MySQL |
| ORM | SQLAlchemy |
| Database driver | PyMySQL |
| Validation | Pydantic |
| Authentication | JWT (PyJWT), HTTP Bearer |
| Password security | bcrypt |
| Email | Python SMTP, `email.message` |
| Configuration | python-dotenv |
| API testing | Swagger UI |

## Project Structure

```text
WEEK 6 - WEB DEVELOPMENT/
│
├── index.html
├── signup.html
├── login.html
├── forgot-password.html
├── reset-password.html
├── dashboard.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── common.js
│   ├── signup.js
│   ├── login.js
│   ├── forgot-password.js
│   ├── reset-password.js
│   └── dashboard.js
│
├── backend/
│   ├── .env                  # Create locally; do not commit secrets
│   ├── __init__.py
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── security.py
│       ├── email_service.py
│       ├── requirements.txt
│       └── routes/
│           └── auth.py
│
└── .vscode/
    └── settings.json
```

## Application Flow

1. A visitor opens the Veylora home page.
2. A new visitor submits the signup form.
3. The frontend sends the registration details to the FastAPI backend.
4. The backend validates the data, hashes the password, and saves the user in MySQL.
5. The application attempts to send a welcome email through SMTP.
6. The user signs in with their registered email and password.
7. The backend verifies the password and returns a JWT access token.
8. The frontend stores the token in `sessionStorage` and opens the dashboard.
9. The dashboard calls the protected profile endpoint and displays the authenticated user's information.
10. If the user forgets their password, they can request a reset email and use its time-limited link to set a new password.

## Prerequisites

Install the following before running the project:

- Python 3.11 (or a compatible Python version)
- MySQL Server
- Visual Studio Code
- A modern web browser
- VS Code Live Server extension (recommended)

## Installation and Setup

### 1. Create the MySQL database

Start MySQL and create the database:

```sql
CREATE DATABASE veylora_db;
```

The application uses SQLAlchemy to create its tables when the FastAPI application starts.

### 2. Configure environment variables

Create a file named `.env` inside the `backend` directory:

```env
DATABASE_URL=mysql+pymysql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/veylora_db

JWT_SECRET_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-email-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Veylora

FRONTEND_RESET_URL=http://127.0.0.1:5500/reset-password.html
```

**Important configuration notes:**

- Replace all example values with your own local configuration.
- Use a MySQL account that has permission to access `veylora_db`.
- If the database password contains special characters, URL-encode them in `DATABASE_URL`.
- Generate a strong, random JWT secret. Do not use the example placeholder.
- For Gmail SMTP, use an App Password where applicable, not your normal Gmail password.
- The reset URL must match the address and port used by your frontend. If Live Server uses port `5501`, update it accordingly.
- Check that the backend reset-link generation uses the same `FRONTEND_RESET_URL` environment variable.

### 3. Create and activate a Python virtual environment

Open a terminal in the project directory and run:

```powershell
cd backend

python -m venv venv

.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use Command Prompt:

```cmd
venv\Scripts\activate.bat
```

### 4. Install backend dependencies

Run this command from the `backend` directory:

```powershell
pip install -r app/requirements.txt
```

### 5. Start the FastAPI backend

Still inside the `backend` directory, run:

```powershell
uvicorn app.main:app --reload
```

The backend should be available at:

- API base: `http://127.0.0.1:8000`
- Health check: `http://127.0.0.1:8000/health`
- Swagger API documentation: `http://127.0.0.1:8000/docs`
- ReDoc documentation: `http://127.0.0.1:8000/redoc`

Keep this terminal running while using the application.

### 6. Start the frontend

1. Open the project folder in Visual Studio Code.
2. Open `index.html`.
3. Right-click the file and select **Open with Live Server**.
4. The browser should open the Veylora home page.

The frontend JavaScript currently uses this API base URL:

```javascript
const API_BASE_URL = "http://127.0.0.1:8000/api";
```

The backend CORS configuration allows the local frontend origins on ports `5500` and `5501`. If you use a different port, update the CORS allowed origins in `backend/app/main.py`.

## API Endpoints

All authentication endpoints use the `/api/auth` prefix.

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/api/auth/signup` | Register a new user | No |
| POST | `/api/auth/login` | Sign in and receive a JWT | No |
| GET | `/api/auth/me` | Get the current user's profile | Bearer token |
| POST | `/api/auth/forgot-password` | Request a password-reset email | No |
| POST | `/api/auth/reset-password` | Set a new password using a reset token | No |

### Example signup request

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "YourStrongPassword"
}
```

### Example login request

```json
{
  "email": "you@example.com",
  "password": "YourStrongPassword"
}
```

A successful login returns an access token and user information. Use the token in the Authorization header when calling protected endpoints:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Example forgot-password request

```json
{
  "email": "you@example.com"
}
```

### Example reset-password request

```json
{
  "token": "TOKEN_FROM_THE_RESET_LINK",
  "new_password": "YourNewStrongPassword"
}
```

## Database Tables

### `users`

Stores registered account information:

- `id`
- `name`
- `email`
- `password_hash`
- `role`
- `is_active`
- `welcome_email_sent`
- `created_at`

### `password_reset_tokens`

Stores password-reset token records:

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `used`
- `created_at`

The reset token is stored as a SHA-256 hash in the database. The application is designed to expire reset links after 15 minutes and prevent reuse.

## Frontend Pages

| Page | Description |
|---|---|
| `index.html` | Veylora landing page |
| `signup.html` | New account registration |
| `login.html` | User login |
| `forgot-password.html` | Request a password-reset email |
| `reset-password.html` | Set a new password from the reset link |
| `dashboard.html` | Authenticated user's account dashboard |

## Testing Checklist

After starting both frontend and backend, test the following:

- [ ] Home page opens successfully.
- [ ] A new user can register with valid details.
- [ ] Duplicate email registration is handled.
- [ ] Welcome email is delivered when SMTP is configured.
- [ ] A registered user can log in.
- [ ] Incorrect login credentials are rejected.
- [ ] Successful login opens the dashboard.
- [ ] Dashboard displays the authenticated user's profile details.
- [ ] Opening the dashboard without a token redirects to login.
- [ ] Logout clears the session token.
- [ ] Forgot-password request works for a registered account.
- [ ] Password-reset email contains a working reset link.
- [ ] An expired or already-used reset token is rejected.
- [ ] The user can log in using the new password.

You can also test the backend endpoints directly using Swagger UI at `http://127.0.0.1:8000/docs`.

## Common Issues and Troubleshooting

| Issue | What to check |
|---|---|
| `DATABASE_URL is missing from .env` | Confirm that `.env` is inside `backend` and contains `DATABASE_URL`. Start Uvicorn from the `backend` directory. |
| MySQL connection refused | Confirm that MySQL Server is running and the host, port, username, password, and database name are correct. |
| Unknown database | Create `veylora_db` in MySQL before starting the backend. |
| JWT secret error | Set a strong `JWT_SECRET_KEY` containing at least 32 characters. |
| SMTP authentication failed | Verify the SMTP username, App Password, host, and port. |
| CORS error | Confirm the Live Server origin is included in the CORS list in `backend/app/main.py`. |
| Frontend cannot reach the API | Confirm Uvicorn is running on port `8000` and `API_BASE_URL` is correct. |
| Reset link does not open | Confirm `FRONTEND_RESET_URL` matches the actual Live Server URL and port. |

## Security Notes

- Never commit `.env`, database passwords, SMTP credentials, or JWT secrets to GitHub.
- Add `.env`, virtual environments, and Python cache files to `.gitignore`.
- If real credentials were included in a shared ZIP or pushed to a repository, rotate those credentials.
- Use HTTPS and secure deployment configuration before making the application public.
- The current frontend stores its access token in `sessionStorage`. This is cleared when the browser session ends, but JavaScript-accessible storage can be exposed if the site has an XSS vulnerability.
- Configure production CORS with only the actual frontend domain.
- Use database migrations (for example, Alembic) when evolving the schema in a production project.

## Future Enhancements

- Add email verification during registration.
- Add role-based authorization for admin-only features.
- Add refresh-token support and a server-side logout/revocation strategy.
- Add profile editing and account deactivation.
- Add rate limiting and stronger password policies.
- Add automated backend and frontend tests.
- Add deployment configuration and production monitoring.

## Learning Outcomes

Through this project, the following concepts can be practiced:

- Building responsive web pages with HTML and CSS.
- Connecting JavaScript forms to REST APIs.
- Creating APIs using FastAPI.
- Validating request data using Pydantic.
- Connecting Python applications to MySQL using SQLAlchemy.
- Implementing password hashing and JWT-based authentication.
- Developing password recovery using secure, expiring tokens.
- Sending transactional emails using SMTP.
- Testing APIs using Swagger UI.
- Debugging frontend, backend, database, CORS, and email configuration issues.

**Veylora – Identity & Access Management Platform**

Developed as part of the Week 6 Web Development project.

---

