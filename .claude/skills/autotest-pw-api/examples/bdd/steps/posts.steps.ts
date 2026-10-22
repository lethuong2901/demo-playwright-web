// Steps: bdd/features/posts.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=api --grep @posts
import { expect } from '@playwright/test';
import { Given, When, Then } from './bdd';
import { PostService, type Post } from '@services/posts/PostService';
import { loadData } from '@support/data';

When('lấy bài viết id {int}', async ({ api, ctx }, id: number) => {
  ctx.set('post', await new PostService(api).getPost(id));
});

Then('bài viết trả về có tiêu đề không rỗng', async ({ ctx }) => {
  expect(ctx.get<Post>('post').title.length).toBeGreaterThan(0);
});

When('tạo bài viết từ dữ liệu {string}', async ({ api, ctx }, tc: string) => {
  const payload = loadData<{ title: string; body: string; userId: number }>('posts')[tc];
  ctx.set('created', await new PostService(api).createPost(payload));
});

Then('bài viết được tạo có id hợp lệ', async ({ ctx }) => {
  expect(ctx.get<Post>('created').id).toBeGreaterThan(0);
});
