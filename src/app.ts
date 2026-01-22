import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler } from "./middlewares/error.middleware.js";
import apiRoutes from "./routes/index.js";
import { setupSwagger } from "./shared/utils/swagger.config.js";




const app = express();

app.set("trust proxy", 1);


// Middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Secure HTTP headers
app.use(morgan("dev")); // HTTP request logger
app.use(express.json()); // JSON body parser

//swagger doc
setupSwagger(app);

// Routes
app.use("/", apiRoutes);


// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Fintech API is running" });
});

// Error handler
app.use(errorHandler);

export default app;
