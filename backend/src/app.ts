import cors from "cors";
import express from "express";

import { healthRouter } from "./routes/health";
import { writingRouter } from "./routes/writing";

export const app = express();

app.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_request, response) => {
  response.json({ message: "Welcome to TalkPath AI backend" });
});

app.use("/api", healthRouter);
app.use("/api/writing", writingRouter);
