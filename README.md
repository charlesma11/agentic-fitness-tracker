# Agentic Fitness Tracker

This is a web application designed to help you track your fitness journey through a modern, voice-first interface. Log your workouts and meals by speaking, and get AI-powered analysis to see if you're on track to meet your goals.

## Features

- **Workout Planning:** Input your workout program, including max lifts and weekly percentages.
- **Voice-Powered Workout Logging:** Speak your completed sets, reps, and weight to automatically log your performance.
- **Voice-Powered Meal Logging:** Describe your meals and get AI-powered estimates for calories and protein.
- **Body Weight Tracking:** Log your body weight over time to track progress.
- **Data Management:** Edit or delete any logged workout, meal, or weight entry to correct mistakes.
- **AI-Powered Parsing:** Uses the Gemini AI model to understand natural language for logging entries.

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React Framework) with TypeScript and [Tailwind CSS](https://tailwindcss.com/).
- **Backend:** [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/) for the core API.
- **Database:** [SQLite](https://www.sqlite.org/index.html) for simple and efficient local data storage.
- **AI:** [Google Gemini](https://ai.google.dev/) for natural language understanding.

## Project Structure

- `/frontend`: Contains the entire Next.js user-facing application and AI service routes.
- `/backend`: Contains the Node.js/Express server that interacts with the SQLite database.

## Setup and Installation

Follow these steps to get the project running locally.

### 1. Backend Setup

First, navigate to the backend directory and install the dependencies.

```bash
cd backend
npm install
```

Then, start the backend server. It will run on `http://localhost:3001`.

```bash
npm start
```

The first time you run this, it will automatically create a `db.sqlite` file with the necessary tables.

### 2. Frontend Setup

In a separate terminal, navigate to the frontend directory and install the dependencies.

```bash
cd frontend
npm install
```

### 3. Environment Variables

The application uses the Gemini API for its voice-parsing features. You will need to provide an API key.

1.  In the `/frontend` directory, create a new file named `.env.local`.
2.  Add your API key to this file as shown below. You can get a free key from [Google AI Studio](https://aistudio.google.com/).

```
GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

### 4. Running the Frontend

Once the environment variable is set, you can run the frontend development server.

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
