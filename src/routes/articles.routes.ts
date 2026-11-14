import {getArticles, postArticle, patchArticle, removeArticle} from "@/controllers/articles.controller.ts";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {Router} from "express";
import {getIdFromParams} from "@/middlewares/condominiumGetter.middleware.ts";

const router = Router();

router.get('/:id/articles', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:read.articles.all'), withAuthz(getArticles));
router.post('/:id/articles', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:create.articles'), withAuthz(postArticle));
router.patch('/:id/articles/:articleId', authenticationHandler, getIdFromParams('id'), withPermissions('condominium:update.articles'), withAuthz(patchArticle));
router.delete('/:id/articles/:articleId', authenticationHandler, getIdFromParams('id'),  withPermissions('condominium:delete.articles'), withAuthz(removeArticle));

export default router;
