import { ApiClient } from '@services/base/ApiClient';
import { EP } from './posts.endpoints';

export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

/** Nghiệp vụ gọi API posts — mọi call đi qua ApiClient (không gọi request.* trực tiếp). */
export class PostService {
  constructor(private readonly api: ApiClient) {}

  async getPost(id: number): Promise<Post> {
    const res = await this.api.get(EP.post(id));
    return ApiClient.json<Post>(res);
  }

  async createPost(data: { title: string; body: string; userId: number }): Promise<Post> {
    const res = await this.api.post(EP.posts, { data, expectStatus: 201 });
    return ApiClient.json<Post>(res);
  }
}
