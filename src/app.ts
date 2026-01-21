import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";



import { errorHandler } from "./middlewares/error.middleware";
import apiRoutes from "../src/routes";
import { setupSwagger } from "./shared/utils/swagger.config";




const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Secure HTTP headers
app.use(morgan("dev")); // HTTP request logger
app.use(express.json()); // JSON body parser

//swagger doc
setupSwagger(app);

// Routes
app.use("/api", apiRoutes);


// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Fintech API is running" });
});

// Error handler
app.use(errorHandler);

export default app;
