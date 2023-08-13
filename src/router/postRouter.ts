import express from "express"
import { PostsController } from "../controllers/PostsController"
import { PostBusiness } from "../business/PostBusiness"
import { PostsDatabase } from "../database/PostDatabase"
import { IdGenerator } from "../services/idGenerator"
import { TokenManager } from "../services/tokenManager"
import { LikeOrDislikeDatabase } from "../database/LikeDislikeDatabase"
import { UserDataBase } from "../database/UserDatabase"

export const postRouter = express.Router()

const postController = new PostsController(
  new PostBusiness(
    new PostsDatabase(),
    new IdGenerator(),
    new TokenManager(),
    new LikeOrDislikeDatabase(),
    new UserDataBase()
  )
)

postRouter.get("/", postController.getPosts)
postRouter.post("/", postController.createPosts)
postRouter.put("/:id", postController.editPost)
postRouter.put("/:id/like", postController.likeOrDislike)
postRouter.delete("/:id", postController.deletePost)