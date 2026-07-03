import "./db"; // ensure schema is applied before routes load
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import "express-async-errors";
import path from "node:path";
import { areasRouter } from "./routes/areas";
import { authRouter } from "./routes/auth";
import { buildingsRouter } from "./routes/buildings";
import { checklistItemsRouter } from "./routes/checklistItems";
import { invitesRouter } from "./routes/invites";
import { photosRouter } from "./routes/photos";
import { spacesRouter } from "./routes/spaces";
import { verificationsRouter } from "./routes/verifications";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/buildings", buildingsRouter);
app.use("/api", areasRouter);
app.use("/api", spacesRouter);
app.use("/api", checklistItemsRouter);
app.use("/api", photosRouter);
app.use("/api", invitesRouter);
app.use("/api", verificationsRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const webDist = path.join(__dirname, "..", "..", "web", "dist");
app.use(express.static(webDist));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(webDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Picture It Clean server listening on :${PORT}`);
});
