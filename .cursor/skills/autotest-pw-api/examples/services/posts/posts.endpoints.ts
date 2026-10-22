/** Endpoint của resource posts (JSONPlaceholder). */
export const EP = {
  posts: '/posts',
  post: (id: number): string => `/posts/${id}`,
};
