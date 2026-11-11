import express from "express";
import cors from "cors";
import router from "./routes.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "flowboard" });
});

app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`Flowboard API listening on http://localhost:${PORT}`);
});
