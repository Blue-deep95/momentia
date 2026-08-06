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
      providesTags: (result) => 
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
      // onQueryStarted executes as soon as the mutation is triggered, before the request finishes.
      // This allows us to perform an 'optimistic update' for immediate UI response.
      async onQueryStarted({ commentId, postId, parentId }, { dispatch, queryFulfilled }) {
        let patchComments = null;
        let patchReplies = null;

        // 1. Optimistically patch the top-level comment cache (getComments query) if postId is provided
        if (postId) {
          patchComments = dispatch(
            commentApi.util.updateQueryData('getComments', { postId }, (draft) => {
              if (draft && draft.comments) {
                const comment = draft.comments.find(c => c._id === commentId);
                if (comment) {
                  comment.isLiked = !comment.isLiked;
                  comment.totalLikes += comment.isLiked ? 1 : -1;
                }
              }
            })
          );
        }

        // 2. Optimistically patch the nested replies cache (getReplies query) if both postId and parentId are provided
        if (postId && parentId) {
          patchReplies = dispatch(
            commentApi.util.updateQueryData('getReplies', { postId, parentId }, (draft) => {
              if (draft && draft.replies) {
                const reply = draft.replies.find(r => r._id === commentId);
                if (reply) {
                  reply.isLiked = !reply.isLiked;
                  reply.totalLikes += reply.isLiked ? 1 : -1;
                }
              }
            })
          );
        }

        try {
          // Wait for the actual network request to succeed
          await queryFulfilled;
        } catch {
          // If the mutation fails, rollback our optimistic updates to ensure UI consistency
          if (patchComments) patchComments.undo();
          if (patchReplies) patchReplies.undo();
        }
      },
      // Removed invalidatesTags: We use optimistic updates instead of full list refetches to save network bandwidth.
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
