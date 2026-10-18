# Task Manager API with AI Integration

A REST API built with **Node.js, Express, MongoDB (Mongoose)** that manages tasks and uses the **Groq AI API** to generate intelligent task plans.

## Project structure

```
task-manager-api/
├── server.js
├── package.json
├── .env.example
├── postman_collection.json
└── src/
    ├── config/db.js
    ├── models/Task.js
    ├── controllers/
    │   ├── taskController.js
    │   └── aiController.js
    ├── routes/
    │   ├── taskRoutes.js
    │   └── aiRoutes.js
    └── middleware/
        ├── errorHandler.js
        └── validateObjectId.js
```

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `MONGODB_URI` – connection string from MongoDB Atlas (Database > Connect > Drivers). Remember to allow your IP under Network Access.
   - `GROQ_API_KEY` – create a key at https://console.groq.com/keys
3. Run: `npm start` (or `npm run dev` for auto-reload)

The server starts on `http://localhost:5000`.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/ai/plan-task` | Generate an AI task plan |

Task fields: `title` (required), `description`, `status` (`pending` / `in-progress` / `completed`, default `pending`), `dueDate` (optional).

### Status codes and errors

- `201` created, `200` success
- `400` validation failure, invalid MongoDB ID, bad JSON, empty AI description
- `404` task or route not found
- `429` AI rate limit, `502` AI service error or invalid AI output, `504` AI timeout
- `500` unexpected server error

### AI example

Request `POST /api/ai/plan-task`:

```json
{ "description": "I need to build a portfolio website within three days." }
```

Response:

```json
{
  "success": true,
  "plan": {
    "summary": "Build and launch a personal portfolio website.",
    "priority": "high",
    "estimatedHours": 12,
    "steps": ["Plan the website structure", "Build the responsive layout", "Add projects and contact information", "Test and deploy the website"]
  }
}
```

## How the AI API was integrated

1. **Provider:** Groq, chosen for its free tier and OpenAI-compatible chat completions API (`https://api.groq.com/openai/v1/chat/completions`), using the model `llama-3.3-70b-versatile` (configurable through `GROQ_MODEL`).
2. **Security:** the API key lives only in `.env` (listed in `.gitignore`) and is read on the server via `process.env.GROQ_API_KEY`. It is never sent to a client. `.env.example` lists variable names only.
3. **Request:** the backend receives `{ description }`, validates it (non-empty string, max 2000 characters) and sends it with Node's built-in `fetch` using a `Bearer` token header. A system prompt tells the model to return only a JSON object with `summary`, `priority`, `estimatedHours` and `steps`, and `response_format: { type: "json_object" }` enforces JSON output.
4. **Validation of the AI output:** the response is parsed and checked (summary is a non-empty string, priority is low/medium/high, estimatedHours is a positive number, steps is a non-empty array of strings). Priority is normalized to lowercase.
5. **Error handling:** empty description returns 400; missing key returns 500; network failure returns 502; timeout (20 s) returns 504; rate limit returns 429; other provider errors and unparseable or invalid AI output return 502, each with a clear message.

## Testing with Postman

Import `postman_collection.json`. It includes success and failure cases for every required scenario (create, list, get, update, delete, invalid ID, missing title, invalid status, AI plan, empty AI description) with automated tests. Set the `baseUrl` collection variable to your live URL when testing the deployment. Run the requests in order; the create request saves `taskId` for the later requests. To demonstrate an AI API failure, temporarily set an invalid `GROQ_API_KEY` and call `/api/ai/plan-task` (expect 502).

## Deployment on Render

1. Push the project to GitHub (`.env` is ignored, so no secrets are uploaded).
2. On https://render.com create a **New > Web Service** and connect the repo.
3. Build command: `npm install`  |  Start command: `npm start`
4. Under **Environment**, add `MONGODB_URI`, `GROQ_API_KEY` and `GROQ_MODEL`.
5. In MongoDB Atlas > Network Access, allow access from `0.0.0.0/0` (Render uses changing IPs).
6. After deploy, test `https://<your-service>.onrender.com/api/tasks` in Postman.

Note: Render's free tier sleeps after inactivity, so the first request can take around 30 to 60 seconds.
