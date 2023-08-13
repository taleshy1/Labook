import express from "express";
import cors from "express";
import { postRouter } from "./router/postRouter";
import dotenv from "dotenv"
import { userRouter } from "./router/usersRouter";

dotenv.config()

const api = express()

api.use(express.json())
api.use(cors())

api.listen(Number(process.env.PORT), () => {
  console.log("Listening on http://localhost:" + process.env.PORT)
})


api.use("/posts", postRouter)
api.use("/users", userRouter)
