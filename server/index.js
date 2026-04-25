import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

const app = express();
const PORT = 3000;

// Middleware
// cors() allows your frontend (port 5173) to securely talk to this backend (port 3000)
app.use(cors()); 
// This allows your backend to securely read JSON data sent from the frontend
app.use(express.json()); 

let db;

// Start the Server and Database
async function startServer() {
  try {
    // 1. Initialize the SQLite database
    db = await initDb();
    console.log("✅ Beautiful! Connected to SQLite database.");

    // 2. Start listening for network requests
    app.listen(PORT, () => {
      console.log(`🚀 Backend API Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
}

// -------------------------------------------------------------
//  API ROUTES WILL GO BELOW HERE
// -------------------------------------------------------------

// Example test route
app.get('/api/test', (req, res) => {
  res.json({ message: "Hello from your new Backend API!" });
});


// Finally, trigger the server to start
startServer();
