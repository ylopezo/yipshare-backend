import {getArticles, postArticle, patchArticle, removeArticle} from "@/controllers/articles.controller.ts";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {Router} from "express";
import {getIdFromParams} from "@/middlewares/condominiumGetter.middleware.ts";
import {validImage} from "@/utils/fileValidation.util.ts";
import {imageMulter} from "@/config/multer.ts";
import type {DiskFileHandle, FileHandlesFromSchema} from "@/types/files";

const router = Router();

const articleImgSchema = {
    image: { required: true, validator: validImage },
} as const;

export const uploadArticleImg = imageMulter.schema(articleImgSchema);

export type ArticleImgHandles = FileHandlesFromSchema<typeof articleImgSchema, DiskFileHandle>;

const articleUpdateImgSchema = {
    image: { required: false, validator: validImage },
} as const;

export const uploadUpdateArticleImg = imageMulter.schema(articleUpdateImgSchema);

export type ArticleUpdateImgHandles = FileHandlesFromSchema<typeof articleImgSchema, DiskFileHandle>;

router.get('/:id/articles', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:read.articles.all'), withAuthz(getArticles));
router.post('/:id/articles', authenticationHandler, getIdFromParams('id'), uploadArticleImg, withPermissions('condominium:create.articles'), withAuthz<{fileHandles: ArticleImgHandles}>(postArticle));
router.patch('/:id/articles/:articleId', authenticationHandler, getIdFromParams('id'), uploadUpdateArticleImg, withPermissions('condominium:update.articles'), withAuthz<{fileHandles: ArticleUpdateImgHandles}>(patchArticle));
router.delete('/:id/articles/:articleId', authenticationHandler, getIdFromParams('id'),  withPermissions('condominium:delete.articles'), withAuthz(removeArticle));

export default router;
