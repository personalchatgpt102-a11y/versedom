import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import bookshelfRoutes from "./routes/bookshelfRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";

const app = express();

connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "Versedom API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/bookshelf", bookshelfRoutes);
app.use("/api/books", bookRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});