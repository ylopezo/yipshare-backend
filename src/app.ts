import express from 'express';
import errorHandler from "@/middlewares/error.middleware.ts";
import authRoutes from "@/routes/auth.routes.ts";
import condominiumRoutes from "@/routes/condominium.routes.ts";
import {postCondominium} from "@/controllers/condominium.controller.ts";
import usersRoutes from "@/routes/users.routes.ts";

export const app = express();

app.use((req, res, next) => {
    if (req.method === 'GET' || req.method === 'QUERY') {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        });
    }
    next();
});

app.use(express.json())
app.use('/auth', authRoutes);
app.use('/condominiums', condominiumRoutes);
app.use('/users', usersRoutes);

app.use(errorHandler);