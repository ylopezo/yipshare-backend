import express from 'express';
import errorHandler from "@/middlewares/error.middleware.ts";
import authRoutes from "@/routes/auth.routes.ts";
import condominiumRoutes from "@/routes/condominium.routes.ts";
import {postCondominium} from "@/controllers/condominium.controller.ts";

export const app = express();

app.use(express.json())
app.use('/auth', authRoutes);
app.use('/condominiums', condominiumRoutes);
app.router.post('/', postCondominium);
app.use(errorHandler);