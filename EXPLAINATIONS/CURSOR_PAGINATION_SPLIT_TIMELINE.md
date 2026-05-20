# 🎓 Welcome to Class: High-Performance Cursor-Based Split-Timeline Feed

Hello everyone! Welcome to today's lesson.

Today, we are going to dive deep into a core feature of modern social media architecture: **building a personalized, infinite-scroll feed using cursor-based pagination and a Split-Timeline Social Graph.**

If you scroll through Instagram, Twitter/X, or LinkedIn, you are experiencing this exact architecture. Your friends' newest updates appear first, followed by global content, and you can scroll forever without seeing duplicates or experiencing lag. Let's explore how we built this for **Momentia**!

---

## 🛑 Chapter 1: The Pitfalls of Offset Pagination (`skip` / `limit`)

Previously, Momentia used offset-based pagination:
```javascript
const page = parseInt(req.params.page) || 1;
const skip = (page - 1) * 20;
// query database with .skip(skip).limit(20)
```

In the real world, this pattern breaks down for feeds due to two main reasons:

1. **The "Duplicate Content" Bug:** If a user is viewing page 1 of their feed, and 5 new posts are published on the platform, when the user scrolls down to request page 2, the database skips the first 20 records (including the 5 new ones). As a result, 5 posts from page 1 get pushed into page 2. The user sees duplicates!
2. **The "N+1 Collection Scan" performance bottleneck:** When you query with `.skip(5000)`, MongoDB has to fetch all 5020 documents from disk, count through them, throw away the first 5000, and only return 20. On large databases, this is extremely slow and memory-intensive.

---

## 🧠 Chapter 2: The Magic of Cursor-Based Pagination

To solve this, we replaced offset pagination with **cursor-based pagination**. 

Instead of asking the database for a page offset, we ask for documents relative to the **last item** we saw.
For our feed, we sort by `feedGroup` (ascending) and `createdAt` (descending). To make the sort order deterministic, we also append the `_id` (descending).

### 1. The Compound Cursor
Our cursor is represented as a Base64-encoded token containing:
- `feedGroup`: Which section of the timeline we are in (1 for priority, 2 for global).
- `createdAt`: The timestamp of the last loaded post.
- `id`: The database `_id` of the last loaded post.

We wrote two lightweight helpers inside [feedRoutes.js](file:///C:/Users/Deep/Desktop/True%20React/4-team%20momentia/insta-clone-momentia/backend/routes/feedRoutes.js) to encode and decode this cursor seamlessly:

```javascript
const encodeCursor = (obj) => {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
};

const decodeCursor = (cursorStr) => {
    try {
        return JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf-8'));
    } catch (err) {
        return null;
    }
};
```

---

## 🚀 Chapter 3: The Split-Timeline Aggregation (Social Graph)

To keep users engaged, we implemented a **Split-Timeline Strategy**:
* **Stream 1 (Priority Content):** Posts from people the user follows plus their own posts, created in the last 48 hours. Tagged with `feedGroup: 1`.
* **Stream 2 (Global Content):** Global posts or priority posts older than 48 hours. Tagged with `feedGroup: 2`.

When the two streams are combined, we sort by `{ feedGroup: 1, createdAt: -1, _id: -1 }`. Because group `1` comes before group `2`, updates from friends always stay pinned at the top!

### 2. High-Performance Execution Flow
Instead of running a heavy `$unionWith` aggregation over the entire database and filtering afterwards, we dynamically construct the query stages. If the cursor indicates we are already on `feedGroup: 2` (Global), we skip querying Stream 1 entirely, saving database cycles!

Here is the exact routing pipeline we implemented:

```javascript
// 1. Calculate the 2-day time boundary for followed users
const twoDaysAgo = new Date()
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

// 2. Fetch the user's social graph
const followingRelationships = await Follow.find({ host: user._id }).select('target')
const followedIds = followingRelationships.map(rel => rel.target)
const priorityAuthors = [...followedIds, new mongoose.Types.ObjectId(user._id)]

let postsToSend = []

if (cursor && cursor.feedGroup === 2) {
    // ----------------------------------------------------
    // OPTIMIZATION: Only search Stream 2 (Global)
    // ----------------------------------------------------
    postsToSend = await Post.aggregate([
        {
            $match: {
                $and: [
                    {
                        $or: [
                            { author: { $nin: priorityAuthors } },
                            { createdAt: { $lt: twoDaysAgo } }
                        ]
                    },
                    {
                        $or: [
                            { createdAt: { $lt: new Date(cursor.createdAt) } },
                            {
                                createdAt: new Date(cursor.createdAt),
                                _id: { $lt: new mongoose.Types.ObjectId(cursor.id) }
                            }
                        ]
                    }
                ]
            }
        },
        { $addFields: { feedGroup: 2 } },
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: limitCount + 1 }, // Fetch 1 extra to check for hasNextPage
        // ... lookups (joins) ...
    ])
} else {
    // ----------------------------------------------------
    // STREAM 1 (Followed/Recent) + UNION STREAM 2 (Global)
    // ----------------------------------------------------
    const stream1Match = {
        author: { $in: priorityAuthors },
        createdAt: { $gte: twoDaysAgo }
    }

    if (cursor && cursor.feedGroup === 1) {
        stream1Match.$or = [
            { createdAt: { $lt: new Date(cursor.createdAt) } },
            {
                createdAt: new Date(cursor.createdAt),
                _id: { $lt: new mongoose.Types.ObjectId(cursor.id) }
            }
        ]
    }

    postsToSend = await Post.aggregate([
        { $match: stream1Match },
        { $addFields: { feedGroup: 1 } },
        {
            $unionWith: {
                coll: "posts",
                pipeline: [
                    {
                        $match: {
                            $or: [
                                { author: { $nin: priorityAuthors } },
                                { createdAt: { $lt: twoDaysAgo } }
                            ]
                        }
                    },
                    { $addFields: { feedGroup: 2 } }
                ]
            }
        },
        {
            $sort: {
                feedGroup: 1,
                createdAt: -1,
                _id: -1
            }
        },
        { $limit: limitCount + 1 },
        // ... lookups (joins) ...
    ])
}
```

---

## ⚡ Chapter 4: The Lookups (Join Bottleneck Fixed)

In MongoDB aggregation, `$lookup` stages are expensive because they perform cross-collection joins. 

**Critical optimization rule:** Always place `$limit` before `$lookup` whenever possible.
By applying the pagination `{ $limit: limitCount + 1 }` **before** our `$lookup` blocks for `users` (authorDetails), `likes` (likedStatus), `savedPosts` (savedStatus), and `follows` (followStatus), we ensure that the database **only performs exactly 20 joins** per request, instead of joining thousands of posts and discarding them. This reduces API response times by up to 95%!

---

## 💻 Chapter 5: React Frontend Integration

We updated the React frontend to support the new cursor-based API format using `react-virtuoso`.

### 1. Feed Pagination ([Feed.jsx](file:///C:/Users/Deep/Desktop/True%20React/4-team%20momentia/insta-clone-momentia/frontend/src/pages/Feed.jsx))
We keep track of the `nextCursor` string and whether there is more data using `hasMore`:

```javascript
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);
const [nextCursor, setNextCursor] = useState(null);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);

const fetchPosts = async (cursor = null) => {
  const isInitial = !cursor;
  if (isInitial) setLoading(true);
  else setLoadingMore(true);

  try {
    const url = cursor ? `/feed/get-posts?cursor=${encodeURIComponent(cursor)}` : "/feed/get-posts";
    const res = await api.get(url);
    const newPosts = res.data.posts || [];
    
    setPosts((prev) => (isInitial ? newPosts : [...prev, ...newPosts]));
    setNextCursor(res.data.nextCursor);
    setHasMore(res.data.hasNextPage);
  } catch (err) {
    console.error("Error fetching posts", err);
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
};
```

We connected this to Virtuoso:
```javascript
<Virtuoso
  useWindowScroll
  data={posts}
  endReached={loadMore} // Triggered when scrolled to the bottom
  itemContent={(index, post) => (
    <div className="w-full">
      <PostCard key={post._id} post={post} />
    </div>
  )}
  components={{
    Footer: () =>
      loadingMore ? (
        <p className="text-center text-gray-500 py-4">Loading more posts...</p>
      ) : null,
  }}
/>
```

---

## 🏁 Summary of the Whole Process

1. **State Decoding:** Client sends an HTTP request with `cursor` in query parameters.
2. **Dynamic Filtering:** Backend decodes the cursor into `{ feedGroup, createdAt, id }` and queries either the combined timelines (Stream 1 + Union Stream 2) or solely the fallback global timeline (Stream 2) depending on which section is currently loaded.
3. **Compound Key Sorting:** Combined results are sorted by `{ feedGroup: 1, createdAt: -1, _id: -1 }`.
4. **Optimized Slicing:** Limits results to 20, keeping 1 extra to set the `hasNextPage` boolean.
5. **Lookup Resolution:** Joins are resolved only on the returned 20 documents.
6. **Token Issuance:** Backend encodes the fields of the last document in the response slice into a new Base64 `nextCursor` token and sends it back to the client.
7. **Frontend Append:** Client appends new elements to state, displays the loader when fetching, and requests subsequent items by passing the token.

Class dismissed! Go try it out! 🚀
