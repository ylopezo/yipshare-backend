import express from 'express';
import errorHandler from "@/middlewares/error.middleware.ts";
import authRoutes from "@/routes/auth.routes.ts";
import condominiumRoutes from "@/routes/condominium.routes.ts";
import reportRoutes from "@/routes/report.routes.ts";
import notificationRoutes from "@/routes/notification.routes.ts";
import articleRoutes from "@/routes/article.routes.ts";

export const app = express();

app.use(express.json())
app.use('/auth', authRoutes);
app.use('/condominiums', condominiumRoutes);
app.use('/reports', reportRoutes);
app.use('/notifications', notificationRoutes);
app.use('/condominiums', articleRoutes);
app.use('/condominiums', articleRoutes);
app.use(errorHandler);