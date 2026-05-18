import { createApi } from '@reduxjs/toolkit/query/react';
import api from '../services/api';

const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await api({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export const commentApi = createApi({
  reducerPath: 'commentApi',
  baseQuery: axiosBaseQuery({ baseUrl: '' }),
  tagTypes: ['Comment', 'Reply'],
  endpoints: (builder) => ({
    getComments: builder.query({
      query: ({ postId, page }) => ({
        url: `/comment/get-comments/${postId}/${page}`,
        method: 'GET',
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs?.postId || 'unknown'}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        currentCache.comments.push(...newItems.comments);
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: (result, error, { postId }) => 
        result 
          ? [...result.comments.map(({ _id }) => ({ type: 'Comment', id: _id })), { type: 'Comment', id: 'LIST' }]
          : [{ type: 'Comment', id: 'LIST' }],
    }),

    getReplies: builder.query({
      query: ({ postId, parentId, page }) => ({
        url: `/comment/get-replies/${postId}/${parentId}/${page}`,
        method: 'GET',
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs?.parentId || 'unknown'}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        currentCache.replies.push(...newItems.replies);
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: (result, error, { parentId }) =>
        result
          ? [...result.replies.map(({ _id }) => ({ type: 'Reply', id: _id })), { type: 'Reply', id: parentId }]
          : [{ type: 'Reply', id: parentId }],
    }),

    createComment: builder.mutation({
      query: (newComment) => ({
        url: '/comment/create-comment',
        method: 'POST',
        data: newComment,
      }),
      invalidatesTags: (result, error, { parent }) => 
        parent ? [{ type: 'Reply', id: parent }, { type: 'Comment', id: 'LIST' }] : [{ type: 'Comment', id: 'LIST' }],
    }),

    toggleLike: builder.mutation({
      query: ({ commentId }) => ({
        url: `/comment/toggle-like/${commentId}`,
        method: 'POST',
      }),
      async onQueryStarted({ commentId, postId }, { dispatch, queryFulfilled }) {
        // Optimistically update getComments cache
        const patchResult = dispatch(
          commentApi.util.updateQueryData('getComments', { postId }, (draft) => {
            const comment = draft.comments.find(c => c._id === commentId);
            if (comment) {
              comment.isLiked = !comment.isLiked;
              comment.totalLikes += comment.isLiked ? 1 : -1;
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      // Removed invalidatesTags: No more GET request after a Like!
    }),
    deleteComment: builder.mutation({
      query: ({ commentId }) => ({
        url: `/comment/delete-comment/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { parent }) =>
        parent ? [{ type: 'Reply', id: parent }, { type: 'Comment', id: 'LIST' }] : [{ type: 'Comment', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useGetRepliesQuery,
  useCreateCommentMutation,
  useToggleLikeMutation,
  useDeleteCommentMutation,
} = commentApi;
