import type {Response, NextFunction} from "express";
import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import {ArticleParams, ArticleQuery, ArticleRequest} from "@/schema/article.schema.ts";
import {CondominiumIdParams} from "@/schema/condominium.schema.ts";
import {listArticles, createArticle, updateArticle, deleteArticle} from "@/services/article.service.ts";

export const getArticles = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        const {q} = ArticleQuery.parse(req.query);
        return res.status(200).json(await listArticles(req.session.userId, id, q));
    } catch (error) {
        next(error);
    }
}

export const postArticle = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        const data = ArticleRequest.parse(req.body);
        return res.status(201).json(await createArticle(req.session.userId, id, data));
    } catch (error) {
        next(error);
    }
}

export const patchArticle = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id, articleId} = ArticleParams.parse(req.params);
        const data = ArticleRequest.parse(req.body);
        return res.status(200).json(await updateArticle(req.session.userId, id, articleId, data));
    } catch (error) {
        next(error);
    }
}

export const removeArticle = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id, articleId} = ArticleParams.parse(req.params);
        await deleteArticle(req.session.userId, id, articleId);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}