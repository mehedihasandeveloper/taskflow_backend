import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import projectRoutes from "./routes/project.routes";
import taskRoutes from "./routes/task.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import teamRoutes from "./routes/team.routes";
import { errorHandler, notFound } from "./middleware/errorHandler";
import aiRoutes from "./routes/ai.routes";
const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: "1mb" })); // avatars are sent as small data URLs

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/team", teamRoutes);
app.use("/api", taskRoutes);
app.use("/api", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;