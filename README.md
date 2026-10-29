# Frontend

Vite + React frontend for Carbon Edge E-Learning.

## Local Development

This frontend is configured to talk to the local backend in this repository.

- Frontend dev server: `http://localhost:4000`
- Backend API: `http://localhost:8086/lms-api`
- API calls from the frontend go to `/api` and are proxied by Vite to the local backend

### Start the backend

```bash
cd ../backend
mvn spring-boot:run
```

### Start the frontend

```bash
cd frontend
npm install
npm start
```

### Build

```bash
npm run build
```

## Environment

The frontend uses Vite environment variables with the `REACT_APP_` prefix.

Key local values:

- `REACT_APP_NUTALIG_API=/api`
- `REACT_APP_LINE_LOGIN_REDIRECT_URI=http://localhost:4000/login-success`
- `REACT_APP_ENVIRONMENT=development`

The backend is expected to run with:

- `SERVER_PORT=8086`
- `spring.application.name=lms-api`
- `server.servlet.context-path=/lms-api`
