# Frontend Follow System Analysis - Followers/Following Modals

## Overview
The Followers/Following modal system is a comprehensive feature that allows users to view, manage, and interact with their followers and following lists. It includes follow/unfollow functionality, remove followers capability, and real-time sync with global state changes.

---

## 1. COMPONENT LOCATIONS & FILE STRUCTURE

### Frontend Components:
```
frontend/src/
├── components/
│   ├── FollowersModal.jsx          (📍 Main followers modal)
│   ├── FollowingModal.jsx          (📍 Main following modal)
│   ├── FollowButton.jsx            (📍 Reusable follow/unfollow button)
│   └── UserListCard.jsx            (📍 User list item display)
├── pages/
│   └── Profile.jsx                 (📍 Triggers modals)
└── services/
    └── api.js                       (📍 API client with interceptors)
```

### Backend Routes:
```
backend/routes/
├── profileRoutes.js    (GET /profile/get-followers/:id, GET /profile/get-following/:id)
├── followRoutes.js     (POST /follow/follow-user, DELETE /follow/unfollow-user/:id, etc.)
└── Other routes...
```

---

## 2. DATA FLOW & ARCHITECTURE

### 2.1 Modal Trigger Flow (Profile.jsx)

```
Profile Page
    ↓
    ├─→ Followers Stats Card (onClick: setShowFollowers(true))
    ├─→ Following Stats Card (onClick: setShowFollowing(true))
    │
    └─→ Renders:
        ├─ <FollowersModal userId={profileUserId} onClose={} />
        └─ <FollowingModal userId={profileUserId} onClose={} />
```

**Profile Component State:**
```javascript
const [showFollowers, setShowFollowers] = useState(false);
const [showFollowing, setShowFollowing] = useState(false);
const [profile, setProfile] = useState(null);  // Profile data with followers/following counts
```

**Profile Fetch:**
```
GET /profile/get-profile/{profileUserId}
Response: { self, following, profile: { _id, followers, following, ... } }
```

---

## 3. FOLLOWERS MODAL (FollowersModal.jsx)

### 3.1 Component Props
```javascript
Props = {
  userId,                      // Whose followers to fetch
  onClose,                      // Close handler
  onFollowersUpdate,           // Called after remove follower (optional)
  onFollowersCountUpdate,      // Passes new follower count (optional)
}
```

### 3.2 Data Fetching
```
Initial Load:
  GET /profile/get-followers/{userId}
  
Response Structure:
  {
    followers: [
      {
        userId: ObjectId,
        username: "john_doe",
        name: "John Doe",
        profilePicture: "cloudinary_url",  // Already transformed for comment view
        isFollowing?: boolean
      },
      ...
    ],
    message: "Followers list retrieved successfully"
  }
```

**Backend Query (MongoDB Aggregation):**
- Matches: `Follow` records where `target === userId`
- Sorts: By `createdAt` (descending)
- Pagination: Default 50 items per page
- Lookup: Joins with `User` collection to get follower details
- Project: Extracts `userId`, `username`, `name`, `profilePicture.commentView`

### 3.3 State Management
```javascript
State: {
  followers: [],              // List of follower objects
  searchTerm: "",            // Search input
  loading: true,             // Initial fetch loading
  error: null,               // Error messages
  removingId: null,          // ID of follower being removed
  removeError: null,         // Remove action error
  mountedRef: useRef(true)   // Prevent state updates after unmount
}
```

### 3.4 Key Features

#### Feature 1: Auto-Filter Own User
```javascript
// Filters out the logged-in user from followers list
if (user?.id) {
  list = list.filter(
    (item) => String(item.userId || item._id) !== String(user.id)
  );
}
```

#### Feature 2: Search Functionality
```javascript
const filteredFollowers = followers.filter((follower) => {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;
  return [follower.username, follower.name]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));
});
```

#### Feature 3: Remove Follower (Own Profile Only)
```
DELETE /follow/remove-follower/{followerId}
- Only available on own profile (isOwnProfile = true)
- Removes follower from your follower list
- Updates local state after success
- Shows loading state "Removing…"
- Displays error messages
```

**Backend Logic:**
- Finds and deletes Follow record: `{ host: followerId, target: currentUserId }`
- Decrements both users' counts: `followers--`, `following--`
- Emits event: `notificationBus.emit('unfollow-user', ...)`

#### Feature 4: Follow/Unfollow Integration
```javascript
// FollowButton component integration
<FollowButton
  userId={followerId}
  initialFollowing={follower.isFollowing ?? null}
  size="sm"
  onFollowStatusChange={(status) =>
    handleFollowStatusChange(followerId, status)
  }
/>

// Updates local state when user follows/unfollows from modal
const handleFollowStatusChange = (targetUserId, status) => {
  setFollowers((current) =>
    current.map((item) => {
      const id = String(item.userId || item._id);
      if (id !== String(targetUserId)) return item;
      return { ...item, isFollowing: status === "followed" };
    })
  );
};
```

---

## 4. FOLLOWING MODAL (FollowingModal.jsx)

### 4.1 Component Props
```javascript
Props = {
  userId,                      // Whose following list to fetch
  onClose,                      // Close handler
  onFollowingUpdate,           // Called after unfollow (optional)
  onFollowingCountUpdate,      // Passes new count (optional)
}
```

### 4.2 Data Fetching
```
Initial Load:
  GET /profile/get-following/{userId}
  
Response Structure:
  {
    following: [
      {
        userId: ObjectId,
        username: "jane_doe",
        name: "Jane Doe",
        profilePicture: "cloudinary_url",
        isFollowing: boolean  // Whether current user follows this person
      },
      ...
    ],
    message: "Following list retrieved successfully"
  }
```

**Backend Query (MongoDB Aggregation):**
- Matches: `Follow` records where `host === userId`
- Sorts: By `createdAt` (descending)
- Pagination: Default 50 items per page
- Double Lookup:
  1. Joins `User` collection for `target` user details
  2. Checks if `currentUser` is following each `target` user
- Project: Extracts `userId`, `username`, `name`, `profilePicture.commentView`, `isFollowing`

### 4.3 State Management
```javascript
State: {
  following: [],             // List of following objects
  loading: true,             // Initial fetch loading
  error: null,               // Error messages
  mountedRef: useRef(true)   // Prevent state updates after unmount
}
```

### 4.4 Key Features

#### Feature 1: Auto-Filter Own User
Same as Followers modal - removes logged-in user from list

#### Feature 2: Unfollow from Modal
```javascript
// FollowButton with initialFollowing={true}
<FollowButton
  userId={userItem.userId}
  initialFollowing={true}
  size="sm"
  onFollowStatusChange={(status) =>
    handleFollowStatusChange(userItem.userId, status)
  }
/>

// When unfollowed, removes from list
const handleFollowStatusChange = (targetUserId, status) => {
  if (status === "unfollowed") {
    const updated = following.filter((u) => u.userId !== targetUserId);
    setFollowing(updated);
    onFollowingUpdate?.();
    onFollowingCountUpdate?.(updated.length);
  }
};
```

---

## 5. FOLLOW BUTTON COMPONENT (FollowButton.jsx)

### 5.1 Component Props
```javascript
Props = {
  userId,                      // User to follow/unfollow
  initialFollowing = null,     // Initial state (null = fetch)
  onFollowStatusChange,        // Callback: (status) => void
  size = "md",                 // "sm" or "md"
  variant = "default",         // "default" or "outline"
}
```

### 5.2 State Management
```javascript
State: {
  following: boolean | null,   // null = fetching, true/false = state
  loading: boolean,            // Action in progress
  fetching: boolean,           // Initial fetch in progress
  hovered: boolean,            // For UI state
  error: string | null,        // Error message
  mountedRef: useRef(true)     // Prevent state updates after unmount
}
```

### 5.3 Initialization Logic

**Case 1: initialFollowing provided**
```javascript
if (initialFollowing !== null) {
  setFollowing(initialFollowing);
  setFetching(false);
  return;
}
```

**Case 2: initialFollowing is null (fetch from API)**
```
GET /profile/get-profile/{userId}
  → Extract response.data.following (boolean)
  → Store in state
```

### 5.4 Follow/Unfollow API Calls

**Follow Action:**
```
POST /follow/follow-user
Body: { targetId: userId }
```

**Unfollow Action:**
```
DELETE /follow/unfollow-user/{userId}
```

### 5.5 Global Event System

FollowButton uses custom events to sync state across components:

```javascript
// Event emitter
const FOLLOW_EVENT = "momentia:follow-changed";

export const emitFollowChange = (targetId, status) => {
  window.dispatchEvent(
    new CustomEvent(FOLLOW_EVENT, { 
      detail: { targetId, status: "followed"|"unfollowed" } 
    })
  );
};

// Event listener
export const onFollowChange = (handler) => {
  window.addEventListener(FOLLOW_EVENT, handler);
  return () => window.removeEventListener(FOLLOW_EVENT, handler);
};
```

**Usage in FollowButton:**
```javascript
// After successful follow/unfollow
emitFollowChange(userId, status);  // status = "followed" | "unfollowed"
onFollowStatusChange?.(status);
```

### 5.6 UI States

```
Loading/Fetching:
  → Shows spinner
  → Button disabled

Following (not hovered):
  → Shows: ✓ Following
  → Style: Muted

Following (hovered):
  → Shows: Unfollow
  → Style: Danger (red)

Not Following:
  → Shows: + Follow
  → Style: Primary (blue)
```

---

## 6. USER LIST CARD COMPONENT (UserListCard.jsx)

### 6.1 Component Props
```javascript
Props = {
  user,                  // User data object
  onUserClick,          // Navigate to profile callback
  actionNode,           // FollowButton or action component
  showOnline = false,   // Show online dot indicator
  animationDelay = 0,   // Stagger animation
}
```

### 6.2 Features
- Displays user avatar with fallback initials
- Shows username and real name
- Shows follow status as badge when present
- Supports verification badge icon
- Navigation to user profile on click
- Accepts custom action node (FollowButton)

---

## 7. API INTEGRATION (api.js)

### 7.1 Axios Instance Setup
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});
```

### 7.2 Request Interceptor
- Automatically attaches Bearer token from localStorage
- Reads from: `localStorage.getItem("token")`

### 7.3 Response Interceptor
- Handles 401 errors (expired access token)
- Automatically refreshes token using refresh token
- Queues failed requests while token is refreshing
- Updates Redux store with new token
- Logs out user if refresh fails

### 7.4 API Endpoints Used

**Follow/Unfollow:**
```
POST   /follow/follow-user              { targetId }
DELETE /follow/unfollow-user/:userId
DELETE /follow/remove-follower/:userId
```

**Profile:**
```
GET /profile/get-profile/:userId
GET /profile/get-followers/:userId
GET /profile/get-following/:userId
GET /profile/get-savedposts/:userId
POST /profile/upload-avatar
```

---

## 8. STATE MANAGEMENT & SYNC

### 8.1 Redux Integration
```javascript
// Profile page uses Redux auth store
const { user } = useSelector((state) => state.auth);

// Used for:
- Getting current logged-in user ID
- Checking if viewing own profile
- Filtering self from follower/following lists
```

### 8.2 Global Event Listeners (Profile.jsx)

**Follow Change Event:**
```javascript
useEffect(() => {
  const handler = (e) => {
    const { targetId, status } = e.detail || {};
    if (!targetId || !profile) return;

    setProfile((prev) => {
      const next = { ...prev };
      // If target is profile owner, increment/decrement followers
      if (prev._id === targetId) {
        next.followers = (next.followers || 0) + (status === "followed" ? 1 : -1);
      }
      // If target is current user, increment/decrement following
      if (user?.id && prev._id === user.id) {
        next.following = (next.following || 0) + (status === "followed" ? 1 : -1);
      }
      return next;
    });
  };

  window.addEventListener("momentia:follow-changed", handler);
  return () => window.removeEventListener("momentia:follow-changed", handler);
}, [profile, user]);
```

### 8.3 Socket.io Integration (Profile.jsx)

**Real-time Updates:**
```javascript
useEffect(() => {
  const socket = window.__socket;
  
  // When someone follows current user
  socket.on("user-followed", (notificationData) => {
    if (profile._id === recipient) {
      setProfile((prev) => ({ 
        ...prev, 
        followers: (prev.followers || 0) + 1 
      }));
    }
  });

  // When someone unfollows current user
  socket.on("unfollow-user", (data) => {
    if (profile._id === target) {
      setProfile((prev) => ({ 
        ...prev, 
        followers: Math.max(0, (prev.followers || 1) - 1) 
      }));
    }
  });

  return () => {
    socket.off("user-followed", onUserFollowed);
    socket.off("unfollow-user", onUnfollowUser);
  };
}, [profile]);
```

---

## 9. CURRENT ISSUES & PATTERNS

### Issue 1: Inconsistent Data Structure
- **Problem**: User ID sometimes at `item.userId`, sometimes at `item._id`
- **Pattern**: Components use `userId || _id` for safety
- **Location**: FollowersModal.jsx:84, FollowingModal.jsx:59, etc.

```javascript
const id = String(item.userId || item._id);
```

### Issue 2: Unfiltered Modals vs Profile Page
- **Pattern**: Modals filter out current user, but this isn't checked in get-followers/get-following backend
- **Risk**: Redundant filtering if user ID changes during session

### Issue 3: Profile Picture URLs
- **Pattern**: Different URL variations stored: `original`, `profileView`, `commentView`
- **Usage**: Modals use `commentView` (50x50), Profile uses `profileView` (400x400)
- **Cloudinary Transform**: URLs are pre-transformed on upload

### Issue 4: Error Handling Inconsistency
- **FollowersModal**: Inline error display + timeout auto-clear
- **FollowingModal**: No error display for unfollow actions
- **FollowButton**: 3-second timeout on errors

### Issue 5: Missing Search in FollowingModal
- **FollowersModal**: Has search functionality (line 200+)
- **FollowingModal**: No search field
- **Inconsistency**: Following list has no search while Followers does

### Issue 6: Pagination Not Implemented
- **Backend**: Supports pagination (page, limit, skip)
- **Frontend**: Always fetches with default limit (50 items)
- **Risk**: Large follower/following lists won't paginate

---

## 10. RESPONSE STRUCTURES

### Get Profile Response
```json
{
  "self": boolean,
  "following": boolean,
  "profile": {
    "_id": "ObjectId",
    "username": "john_doe",
    "name": "John Doe",
    "email": "hidden",
    "bio": "...",
    "followers": 42,
    "following": 18,
    "totalPosts": 5,
    "location": "San Francisco",
    "website": "https://example.com",
    "profilePicture": {
      "original": { "url": "...", "public_id": "..." },
      "profileView": "...",
      "commentView": "..."
    }
  },
  "message": "..."
}
```

### Get Followers Response
```json
{
  "followers": [
    {
      "userId": "ObjectId",
      "username": "jane_doe",
      "name": "Jane Doe",
      "profilePicture": "cloudinary_url"
    }
  ],
  "message": "Followers list retrieved successfully"
}
```

### Get Following Response
```json
{
  "following": [
    {
      "userId": "ObjectId",
      "username": "jane_doe",
      "name": "Jane Doe",
      "profilePicture": "cloudinary_url",
      "isFollowing": boolean
    }
  ],
  "message": "Following list retrieved successfully"
}
```

---

## 11. DESIGN & UI PATTERNS

### Modal Styling
- **FollowersModal**: Uses inline styles (gradient borders, custom animations)
- **FollowingModal**: Uses Tailwind classes (consistent with rest of app)
- **Inconsistency**: Two different styling approaches

### Animations
```css
@keyframes fm-spin { to { transform: rotate(360deg); } }
@keyframes fm-slide { 
  from { opacity: 0; transform: translateY(16px) scale(.98); } 
  to { opacity: 1; transform: translateY(0) scale(1); } 
}
```

### Responsive Design
- Mobile adjustments for FollowersModal
- FollowingModal lacks mobile-specific styles
- Max modal width: 480px

---

## 12. SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **Follower Fetch** | `GET /profile/get-followers/:id` - Returns list with basic user info |
| **Following Fetch** | `GET /profile/get-following/:id` - Returns list with isFollowing status |
| **Follow Action** | `POST /follow/follow-user { targetId }` |
| **Unfollow Action** | `DELETE /follow/unfollow-user/:userId` |
| **Remove Follower** | `DELETE /follow/remove-follower/:userId` - Only on own profile |
| **Global Sync** | Custom events: `momentia:follow-changed` |
| **Real-time Sync** | Socket.io: `user-followed`, `unfollow-user` |
| **Search** | Available in FollowersModal only |
| **Pagination** | Backend supports but frontend doesn't use |
| **Error Handling** | Toast/inline errors with auto-clear |
| **Auto-filters** | Removes current user from both lists |
| **Initial State** | Can be provided or fetched on-demand |

---

## 13. NAVIGATION FLOW

```
Profile Page
├─ Display stats (followers/following counts)
│  └─ Clickable buttons trigger modals
│
├─ FollowersModal
│  ├─ Fetch GET /profile/get-followers/:id
│  ├─ Search & filter
│  ├─ Show FollowButton for each follower
│  ├─ Show "Remove" button if own profile
│  └─ UserListCard navigation → /profile/:userId on click
│
├─ FollowingModal
│  ├─ Fetch GET /profile/get-following/:id
│  ├─ Show FollowButton for each user
│  └─ UserListCard navigation → /profile/:userId on click
│
└─ FollowButton
   ├─ Fetch follow status if needed
   ├─ POST/DELETE to follow/unfollow
   ├─ Emit global event
   └─ Update local state
```

---

## Key Takeaways

1. **Two-modal system** - Separate components for followers vs following
2. **Event-driven updates** - Custom window events sync all follow buttons
3. **Socket integration** - Real-time updates from backend
4. **Dual feedback loops** - Both optimistic updates + real-time socket events
5. **Design inconsistency** - FollowersModal (inline styles) vs FollowingModal (Tailwind)
6. **Missing features** - Search in Following, pagination not used, mobile styles incomplete
7. **Data safety** - Multiple null-checks for ID fields to prevent errors
