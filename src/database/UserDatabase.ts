import { UserDB } from "../models/Users";
import { BaseDatabase } from "./baseDatabase";

export class UserDataBase extends BaseDatabase {
  public static USERS_TABLES = 'users'

  public async getUserByEmail(email: string): Promise<Array<UserDB>> {
    const result: Array<UserDB> = await BaseDatabase.connection(UserDataBase.USERS_TABLES).where({ email })
    return result
  }

  public async signUp(user: UserDB): Promise<void> {
    await BaseDatabase.connection(UserDataBase.USERS_TABLES).insert(user)
  }

  public async getUserById(id: string): Promise<Array<UserDB>> {
    const result: Array<UserDB> = await BaseDatabase.connection(UserDataBase.USERS_TABLES).where({ id })
    return result
  }


}