import {getArticles, postArticle, patchArticle, removeArticle} from "@/controllers/article.controller.ts";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz} from "@/middlewares/authorization.middleware.ts";
import {Router} from "express";

const router = Router();

router.get('/:id/articles', authenticationHandler, withAuthz(getArticles));
router.post('/:id/articles', authenticationHandler, withAuthz(postArticle));
router.patch('/:id/articles/:articleId', authenticationHandler, withAuthz(patchArticle));
router.delete('/:id/articles/:articleId', authenticationHandler, withAuthz(removeArticle));

export default router;
