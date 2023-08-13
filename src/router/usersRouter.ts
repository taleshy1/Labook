import express from "express"
import { UserController } from "../controllers/UsersController"
import { UserBusiness } from "../business/UserBusiness"
import { UserDataBase } from "../database/UserDatabase"
import { IdGenerator } from "../services/idGenerator"
import { TokenManager } from "../services/tokenManager"
import { HashManager } from "../services/HashManager"

export const userRouter = express.Router()

const userController = new UserController(
  new UserBusiness(
    new UserDataBase(),
    new IdGenerator(),
    new TokenManager(),
    new HashManager()
  )
)
userRouter.post("/signup", userController.signup)
userRouter.post("/login", userController.login)