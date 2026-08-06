# Beginner's Guide: React & RTK Query Comment Architecture

This guide explains the design and inner workings of the Comments and Replies system in Momentia. It is written to be beginner-friendly, showing what each block of code does and the engineering decisions behind them.

---

## Table of Contents
1. [Overview of the Architecture](#1-overview-of-the-architecture)
2. [Deep Dive: The RTK Query Slice (`commentApi.js`)](#2-deep-dive-the-rtk-query-slice-commentapijs)
3. [Deep Dive: The Recursive Comment Item (`CommentItem.jsx`)](#3-deep-dive-the-recursive-comment-item-commentitemjsx)
4. [Deep Dive: The Comments Modal Container (`Comment.jsx`)](#4-deep-dive-the-comments-modal-container-commentjsx)
5. [Deep Dive: The Stateless Input Bar (`CommentInput.jsx`)](#5-deep-dive-the-stateless-input-bar-commentinputjsx)

---

## 1. Overview of the Architecture

In a standard React application, managing comment feeds with replies, likes, and pagination requires lots of manual work (tracking loading states, storing lists in local state, manually sending API calls, and updating parent elements).

To make the app fast and robust, we use **Redux Toolkit (RTK) Query** alongside **Axios**:
* **Axios** handles the raw network requests and credentials/token refreshes.
* **RTK Query** acts as a smart cache manager. It caches API responses, manages loading and fetching states, merges paginated scroll pages, and supports **optimistic UI updates** (making the app feel instant).

Here is how the data flows:
```
           +-----------------------------------------+
           |           CommentsModal (Light)         |
           |   (Main Container, Page pagination)     |
           +--------------------+--------------------+
                                |
                   Renders list using Virtuoso
                                |
                                v
                   +------------+------------+
                   |     CommentItem.jsx     | <---+
                   |  (Top-level Comment UI) |     |
                   +------------+------------+     | Renders itself
                                |                  | for sub-replies
                        Renders replies            | (Recursion)
                                |                  |
                                v                  |
                   +------------+------------+     |
                   |     CommentItem.jsx     | ----+
                   |    (Nested Reply UI)    |
                   +-------------------------+
```

---

## 2. Deep Dive: The RTK Query Slice (`commentApi.js`)

The file `commentApi.js` is the brain of the comment state. It configures our network requests and caching policies.

### Part A: The Axios Custom Base Query
```javascript
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
```
* **What it does:** It adapts our pre-configured Axios instance (`api` which handles JWT token injection and automatic 401 token regeneration) into a format that RTK Query understands.
* **Why this way:** Instead of using RTK Query's built-in `fetchBaseQuery` (which uses the browser's raw `fetch` API), we wrapper our custom Axios client so we don't have to duplicate authentication interceptors, headers, and refresh logic.

---

### Part B: Query Endpoints (Comments & Replies)

#### 1. `getComments` (Top-level comments)
```javascript
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
})
```
* **`serializeQueryArgs`:** Customizes how RTK Query caches this query. Instead of creating a new cache entry for every page number, it caches all pages for a given `postId` under the key: `getComments-postId`.
* **`merge`:** When page is `1`, it resets the cache to the latest comments (e.g., when opening a post). When page is `2` or higher, it appends the new comments to the existing list. This enables infinite scroll.
* **`providesTags`:** Tags this cache with the list label `'LIST'` and each individual comment's `_id`. If we mutate (like deleting a comment), RTK Query will read these tags and automatically remove or refresh elements.

---

### Part C: Optimistic Updates on Like Mutate
When a user clicks the "Like" button, they expect the count to increase immediately. Waiting for the database response (which takes 100–300ms) makes the application feel sluggish. We use **optimistic updates** to solve this.

```javascript
toggleLike: builder.mutation({
  query: ({ commentId }) => ({
    url: `/comment/toggle-like/${commentId}`,
    method: 'POST',
  }),
  async onQueryStarted({ commentId, postId, parentId }, { dispatch, queryFulfilled }) {
    let patchComments = null;
    let patchReplies = null;

    // 1. Optimistically patch top-level comment cache
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

    // 2. Optimistically patch reply cache if parentId exists
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
      await queryFulfilled; // Wait for request to succeed
    } catch {
      // Revert changes if request fails
      if (patchComments) patchComments.undo();
      if (patchReplies) patchReplies.undo();
    }
  }
})
```
* **`updateQueryData`:** Allows us to manually edit RTK Query's cache. We find the matching comment by ID in the cache and flip the like status and count.
* **`undo()`:** If the network request fails (e.g. user lost connection), we catch the error and execute `.undo()`, restoring the like state and count to its exact previous state without needing to refresh.

---

## 3. Deep Dive: The Recursive Comment Item (`CommentItem.jsx`)

The component `CommentItem.jsx` renders a single comment or reply, handles like toggles, displays sub-replies, and allows users to reply or delete.

### Part A: Code and Explanations for Replies and Likes

Let's look at the core code of [CommentItem.jsx](file:///C:/Users/Deep/Desktop/True%20React/4-team%20momentia/insta-clone-momentia/frontend/src/components/CommentItem.jsx):

```javascript
const CommentItem = ({ comment, postId, onReply }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  
  // Hooks generated by RTK Query endpoints in commentApi.js
  const [toggleLike] = useToggleLikeMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const currentUser = useSelector((state) => state.auth.user);

  // Lazy sub-query setup
  const { data: repliesData, isFetching: loadingReplies } = useGetRepliesQuery(
    { postId, parentId: comment._id, page: repliesPage },
    { skip: !showReplies } // Skips the fetch until user toggles replies open
  );
```

#### How the Lazy Sub-query works:
* **The skip flag:** RTK Query lets us pass a second arguments object `{ skip: Boolean }`. When `showReplies` is false, `skip` is true, and no request is made.
* **Toggling showReplies:** When the user clicks "View replies", we set `showReplies` to true. RTK Query instantly notices `skip` is now false and fires the fetch request.
* **Caching replies:** Just like top-level comments, replies are cached automatically. If the user hides replies and opens them again, RTK Query reads from cache instead of making another server trip!

---

### Part B: Recursive Self-Rendering
Inside the component template, if there are replies, we render `CommentItem` recursively:

```javascript
{showReplies && (
  <div className="mt-4 space-y-4 border-l-2 border-gray-50 pl-4">
    {repliesData?.replies?.map((reply) => (
      <CommentItem 
        key={reply._id || Math.random()} 
        comment={reply} 
        postId={postId} 
        onReply={onReply}
      />
    ))}
```

#### Why we do it this way:
* **Natural Tree Hierarchy:** Nested comments are parent-child structures. Instead of writing a separate `ReplyItem.jsx` (which does the exact same thing as `CommentItem`), we let `CommentItem` render itself recursively.
* **Scalability:** This supports infinite layers of nesting (e.g. replies to replies), although in this app we align sub-replies directly under the top-level parent comment to keep layout clean.

---

### Part C: Text Cleaning (Double Handle Prevention)
When you click "Reply", the input value is set to let you write. However, when the comment is stored, we track who you replied to in `comment.referencedUser`.

```javascript
const referencedUsername = comment.referencedUser?.username;

const cleanedContent = (() => {
  if (!comment.content) return "";
  const trimmed = comment.content.trim();
  // If the user's message body starts with '@username', strip it out
  if (referencedUsername && trimmed.startsWith(`@${referencedUsername}`)) {
    return trimmed.replace(new RegExp(`^@${referencedUsername}\\s*`), "");
  }
  return trimmed;
})();
```

And in the UI, we render it like this:
```javascript
<p className="mt-0.5 text-sm text-gray-700 leading-snug break-words">
  {referencedUsername && (
    <span className="mr-1 font-bold text-blue-600">
      @{referencedUsername}
    </span>
  )}
  {cleanedContent}
</p>
```

#### Why we do it this way:
* If John replies to Sarah's comment, John might type: `@sarah yes, I agree!`.
* In the UI, we already render a styled blue badge: `**@sarah**`.
* If we didn't strip the text, it would display as: **@sarah** @sarah yes, I agree!. Stripping it ensures the interface stays clean and readable.

---

### Part D: Deleting Comments and Cross-Component Count Syncing
```javascript
const handleDelete = async () => {
  if (!window.confirm("Delete this comment?")) return;
  try {
    const res = await deleteComment({ 
      commentId: comment._id, 
      parent: comment.parent 
    }).unwrap();
    
    const deletedCount = res?.deletedCount || 1;
    // Dispatch custom event to notify external counters (e.g. on the Feed view)
    window.dispatchEvent(
      new CustomEvent("commentCountChanged", { 
        detail: { postId, delta: -deletedCount } 
      })
    );
  } catch (err) {
    console.error("Error deleting comment", err);
    alert(err?.data?.message || "Failed to delete comment.");
  }
};
```

#### Why we do it this way:
* **State Isolation:** The feed post card displays comment counts but has its own cache. When a comment is deleted, we want that feed card to decrement its count immediately.
* **Custom Window Events:** Instead of using complex global state managers for a simple count, a `CustomEvent` is lightweight. The main post feed component listens to the window event `"commentCountChanged"` and updates its UI count.

---

## 4. Deep Dive: The Comments Modal Container (`Comment.jsx`)

The file [Comment.jsx](file:///C:/Users/Deep/Desktop/True%20React/4-team%20momentia/insta-clone-momentia/frontend/src/components/Comment.jsx) handles modal structure, pagination, and virtual scrolling.

### Part A: Virtual Scroll Viewport with `Virtuoso`
Instead of standard React mapping, we use `Virtuoso` to manage large lists:

```javascript
<Virtuoso
  ref={virtuosoRef}
  data={comments}
  className="h-full w-full"
  endReached={loadMore} // Trigger pagination when user scrolls to bottom
  increaseViewportBy={400} // Pre-renders items 400px below screen for smooth scroll
  itemContent={(index, comment) => (
    <div className="px-6 py-4 sm:px-8">
      <CommentItem 
        comment={comment} 
        postId={post._id}
        onReply={handleReplyClick}
      />
    </div>
  )}
/>
```

#### Why we do it this way:
* **DOM Performance:** In standard React:
  ```javascript
  comments.map(c => <CommentItem comment={c} />)
  ```
  If there are 500 comments, the browser creates 500 sets of avatars, texts, and buttons in the DOM. This causes memory issues and lags the browser.
* **Virtualization:** `Virtuoso` only mounts the comments that fit inside the visible screen (e.g. 5–10 items). As you scroll, it unmounts comments that leave the screen and mounts new ones, keeping the DOM extremely small.

---

### Part B: Merging Pages (Infinite Scroll)
```javascript
const [page, setPage] = useState(1);

const { data: commentsData, isLoading, isFetching } = useGetCommentsQuery({ 
  postId: post?._id, 
  page 
});

const loadMore = useCallback(() => {
  const comments = commentsData?.comments || [];
  const hasMore = comments.length > 0 && (comments.length % 25 === 0);
  if (hasMore && !isFetching) {
    setPage((prev) => prev + 1); // Increments page number
  }
}, [commentsData, isFetching]);
```

#### How it works:
1. Initially, `page` is `1`. RTK Query fetches page 1 comments.
2. When the user scrolls near the bottom, `Virtuoso` fires `endReached`, calling `loadMore()`.
3. `loadMore()` checks if we have comments and if they are a multiple of `25` (meaning there might be more comments on the next page).
4. If yes, we increment `page` to `2`.
5. RTK Query detects the argument change (`page` changed from `1` to `2`), fetches page 2, and then the `merge` function in `commentApi.js` merges the results together, maintaining a single flat list in the cache.

---

## 5. Deep Dive: The Stateless Input Bar (`CommentInput.jsx`)

The file [CommentInput.jsx](file:///C:/Users/Deep/Desktop/True%20React/4-team%20momentia/insta-clone-momentia/frontend/src/components/CommentInput.jsx) renders the text input, active user's avatar, and the "Post" button.

```javascript
const CommentInput = ({ input, setInput, onSend, replyTo, onClearReply, isDisabled }) => {
  const { user } = useSelector(state => state.auth);

  return (
    <div className="border-t border-gray-100 px-4 py-3 bg-white">
      {/* If replying to someone, render a cancelable ribbon */}
      {replyTo && (
        <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-blue-50/50 rounded-lg text-[11px] font-bold text-blue-500 uppercase tracking-tight">
          <span>Replying to @{replyTo.authorDetails?.username || replyTo.author?.username || "user"}</span>
          <button onClick={onClearReply} className="hover:text-blue-700">
            <X size={14} />
          </button>
        </div>
      )}
      ...
```

#### Why we do it this way:
* **Dumb/Presentation Pattern:** The component does not contain any state variables (no `useState`), nor does it run queries or dispatch actions directly.
* **Separation of Concerns:** It accepts its parameters through React props. The parent container (`CommentsModal`) handles the state, so if we decide to change where the input is saved or how it's sent, we only have to change it in the parent container. The input element itself remains simple, portable, and easy to test.
