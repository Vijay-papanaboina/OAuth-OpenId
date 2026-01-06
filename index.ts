import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import indexRoutes from "./routes/index.routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.use("/api", indexRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
