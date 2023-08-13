import { LikeOrDislikeDatabase } from "../database/LikeDislikeDatabase";
import { PostsDatabase } from "../database/PostDatabase";
import { UserDataBase } from "../database/UserDatabase";
import {
  EditPostInputDTO,
  EditPostOutputDTO,
} from "../dtos/posts/EditPost.dto";
import {
  CreatePostInputDTO,
  CreatePostOutputDTO,
} from "../dtos/posts/createPost.dto";
import {
  DeletePostInputDTO,
  DeletePostOutputDTO,
} from "../dtos/posts/deletePost.dto";
import {
  GetPostsInputDTO,
  GetPostsOutputDTO,
} from "../dtos/posts/getPosts.dto";
import {
  LikeOrDislikeInputDTO,
  LikeOrDislikeOutputDTO,
} from "../dtos/posts/likeOrDislike.dto";
import { BadRequestError } from "../error/BadRequestError";
import { NotAuthenticatedError } from "../error/NotAuthenticatedError";
import { NotFoundError } from "../error/NotFoundError";
import { UnauthorizedError } from "../error/UnauthorizedError";
import { LikeDislike } from "../models/LikeDislike";
import { Posts, PostsDB, PostsModel, PostsWithCreator } from "../models/Posts";
import { UserDB, userRole } from "../models/Users";
import { IdGenerator } from "../services/idGenerator";
import { TokenManager, TokenPayload } from "../services/tokenManager";

export class PostBusiness {
  constructor(
    private postsDatabase: PostsDatabase,
    private idGenerator: IdGenerator,
    private tokenManager: TokenManager,
    private likeOrDislikeDatabase: LikeOrDislikeDatabase,
    private userDataBase: UserDataBase
  ) { }

  public getPosts = async (
    input: GetPostsInputDTO
  ): Promise<GetPostsOutputDTO> => {
    const { token } = input;

    const isAuthenticaded: TokenPayload | null =
      this.tokenManager.getPayload(token);

    if (!isAuthenticaded) {
      throw new NotAuthenticatedError();
    }

    const postsDB: Array<PostsDB> = await this.postsDatabase.getPosts();

    const promisePostWithCreator: Array<Promise<PostsModel>> = postsDB.map(async (p) => {
      const [user]: Array<UserDB> = await this.userDataBase.getUserById(p.creator_id)
      const post = new PostsWithCreator(
        p.id,
        p.creator_id,
        p.content,
        p.likes,
        p.dislikes,
        p.updated_at,
        p.created_at,
        user.name
      )
      return post.toBusinessModelWithCreator()
    })

    const postsWithCreator: Array<PostsModel> = await Promise.all(promisePostWithCreator)

    return postsWithCreator;
  };

  public createPost = async (
    input: CreatePostInputDTO
  ): Promise<CreatePostOutputDTO> => {
    const { content, token } = input;

    const isAuthenticaded: TokenPayload | null =
      this.tokenManager.getPayload(token);

    if (!isAuthenticaded) {
      throw new NotAuthenticatedError();
    }

    const id = this.idGenerator.generate();
    const newPost = new Posts(
      id,
      isAuthenticaded.id,
      content,
      0,
      0,
      new Date().toISOString(),
      new Date().toISOString()
    );

    await this.postsDatabase.createPost(newPost.toDBModel());
    const output: CreatePostOutputDTO = undefined;
    return output;
  };

  public editPost = async (
    input: EditPostInputDTO
  ): Promise<EditPostOutputDTO> => {
    const { idToEdit, content, token } = input;

    const isAuthenticaded: TokenPayload | null =
      this.tokenManager.getPayload(token);

    if (!isAuthenticaded) {
      throw new NotAuthenticatedError();
    }

    const [postExist] = await this.postsDatabase.getPostById(idToEdit);
    if (!postExist) {
      throw new NotFoundError("Post não existe");
    }

    if (isAuthenticaded.id !== postExist.creator_id) {
      throw new BadRequestError("Apenas o criador do post pode edita-lo");
    }

    const post = new Posts(
      postExist.id,
      postExist.creator_id,
      content,
      postExist.likes,
      postExist.dislikes,
      postExist.created_at,
      new Date().toISOString()
    );
    await this.postsDatabase.editPost(post.toDBModel(), idToEdit);
    return "Post editado com sucesso";
  };

  public deletePost = async (
    input: DeletePostInputDTO
  ): Promise<DeletePostOutputDTO> => {
    const { idToDelete, token } = input;

    const isAuthenticaded: TokenPayload | null =
      this.tokenManager.getPayload(token);

    if (!isAuthenticaded) {
      throw new NotAuthenticatedError();
    }

    const [postExist] = await this.postsDatabase.getPostById(idToDelete);

    if (!postExist) {
      throw new NotFoundError("Post não existe");
    }

    if (
      postExist.creator_id !== isAuthenticaded.id &&
      isAuthenticaded.role !== userRole.Admin
    ) {
      throw new UnauthorizedError();
    }

    await this.postsDatabase.deletePost(idToDelete);
    return "Post Removido com sucesso";
  };

  public likeOrDislike = async (
    input: LikeOrDislikeInputDTO
  ): Promise<LikeOrDislikeOutputDTO> => {
    const { like, token, postId } = input;
    let removeLikeOrDislike: boolean = false;
    let wasLikedOrDisliked: boolean = false;
    const isAuthenticated: TokenPayload | null =
      this.tokenManager.getPayload(token);

    if (!isAuthenticated) {
      throw new NotAuthenticatedError();
    }

    const [exists]: Array<PostsDB> = await this.postsDatabase.getPostById(
      postId
    );

    if (!exists) {
      throw new BadRequestError("Este post não existe");
    }

    if (isAuthenticated.id === exists.creator_id) {
      throw new BadRequestError(
        "O criador do post não pode dar like/dislike em seu proprio post"
      );
    }

    const [likeOrDislikePostDB] =
      await this.likeOrDislikeDatabase.getLikeDislikeTable(
        exists.id,
        isAuthenticated.id
      );

    const newLikeDislikeDB = new LikeDislike(
      isAuthenticated.id,
      postId,
      like
    ).likeDislikeToDB();

    if (!likeOrDislikePostDB) {
      this.likeOrDislikeDatabase.createLikeDislike(newLikeDislikeDB);
    } else if (like) {
      if (likeOrDislikePostDB.like === 1) {
        this.likeOrDislikeDatabase.removeLikeDislike(
          postId,
          isAuthenticated.id
        );
        removeLikeOrDislike = true;
      } else {
        this.likeOrDislikeDatabase.updateLikeDislike(
          postId,
          isAuthenticated.id,
          newLikeDislikeDB
        );
        wasLikedOrDisliked = !wasLikedOrDisliked;
      }
    } else {
      if (likeOrDislikePostDB.like === 0) {
        this.likeOrDislikeDatabase.removeLikeDislike(
          postId,
          isAuthenticated.id
        );
        removeLikeOrDislike = true;
      } else {
        this.likeOrDislikeDatabase.updateLikeDislike(
          postId,
          isAuthenticated.id,
          newLikeDislikeDB
        );
        wasLikedOrDisliked = !wasLikedOrDisliked;
      }
    }

    if (like) {
      const newPost = new Posts(
        exists.id,
        exists.creator_id,
        exists.content,
        removeLikeOrDislike ? exists.likes - 1 : exists.likes + 1,
        wasLikedOrDisliked ? exists.dislikes - 1 : exists.dislikes,
        exists.created_at,
        exists.updated_at
      ).toDBModel();
      await this.postsDatabase.editPost(newPost, postId);
    } else {
      const newPost = new Posts(
        exists.id,
        exists.creator_id,
        exists.content,
        wasLikedOrDisliked ? exists.likes - 1 : exists.likes,
        removeLikeOrDislike ? exists.dislikes - 1 : exists.dislikes + 1,
        exists.created_at,
        exists.updated_at
      ).toDBModel();
      await this.postsDatabase.editPost(newPost, postId);
    }
  };
}
