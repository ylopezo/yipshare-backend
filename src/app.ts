import express from 'express';
import errorHandler from "@/middlewares/error.middleware.ts";
import authRoutes from "@/routes/auth.routes.ts";

export const app = express();

app.use(express.json())
app.use('/auth', authRoutes);
app.use(errorHandler);