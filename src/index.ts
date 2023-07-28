import express, { Request, Response } from "express";
import cors from "express";

const api = express()

api.use(express.json())
api.use(cors())

api.listen(3003, () => {
  console.log("Listening on http://localhost:3003")
})

