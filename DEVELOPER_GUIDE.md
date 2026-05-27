# Followers & Following Modal System - Developer Guide

## Quick Reference

### Using Followers Modal

```jsx
import FollowersModal from "../components/FollowersModal.jsx";

// In your component
const [showFollowers, setShowFollowers] = useState(false);

<FollowersModal
  userId={userId}
  onClose={() => setShowFollowers(false)}
  onFollowersCountUpdate={(count) => setFollowersCount(count)}
  onFollowersUpdate={() => {
    // Called when a follower is removed
    // Refetch your data if needed
  }}
/>
```

### Using Following Modal

```jsx
import FollowingModal from "../components/FollowingModal.jsx";

// In your component
const [showFollowing, setShowFollowing] = useState(false);

<FollowingModal
  userId={userId}
  onClose={() => setShowFollowing(false)}
  onFollowingCountUpdate={(count) => setFollowingCount(count)}
  onFollowingUpdate={() => {
    // Called when a user is unfollowed
    // Refetch your data if needed
  }}
/>
```

### Using Follow Button

```jsx
import FollowButton from "../components/FollowButton.jsx";

// Simple usage
<FollowButton
  userId={targetUserId}
  size="md"  // "sm" or "md"
  onFollowStatusChange={(status) => {
    // status is "followed" or "unfollowed"
    console.log("Follow status changed:", status);
  }}
/>

// With initial state
<FollowButton
  userId={targetUserId}
  initialFollowing={true}  // null to fetch from API
  size="sm"
  variant="outline"  // "default" or "outline"
/>
```

---

## Component Props

### FollowersModal Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | string | Yes | User ID to fetch followers for |
| `onClose` | function | Yes | Called when modal closes |
| `onFollowersCountUpdate` | function | No | Called with follower count |
| `onFollowersUpdate` | function | No | Called when a follower is removed |

### FollowingModal Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | string | Yes | User ID to fetch following list for |
| `onClose` | function | Yes | Called when modal closes |
| `onFollowingCountUpdate` | function | No | Called with following count |
| `onFollowingUpdate` | function | No | Called when a user is unfollowed |

### FollowButton Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | string | Yes | User ID to follow/unfollow |
| `initialFollowing` | boolean/null | No | Initial follow state (null = fetch) |
| `onFollowStatusChange` | function | No | Called on status change |
| `size` | string | No | "sm" or "md" (default: "md") |
| `variant` | string | No | "default" or "outline" |

### UserListCard Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `user` | object | Yes | User object with profile data |
| `onUserClick` | function | No | Called when user card is clicked |
| `actionNode` | React node | No | Action button (like Follow button) |
| `showOnline` | boolean | No | Show online indicator |
| `animationDelay` | number | No | Animation delay in seconds |

---

## State Management Flow

### Follow/Unfollow Global Sync

```jsx
import { emitFollowChange, onFollowChange } from "../components/FollowButton.jsx";

// Emit follow change event
emitFollowChange(userId, "followed");  // or "unfollowed"

// Listen for follow changes
const unsubscribe = onFollowChange((event) => {
  console.log("Follow status changed:", event.detail.targetId, event.detail.status);
});

// Cleanup when done
return () => unsubscribe();
```

### User Object Structure

```javascript
{
  userId: "string",        // User's ID
  _id: "string",          // Alternative ID field
  username: "string",      // Username
  name: "string",         // Full name
  profilePicture: {
    commentView: "URL",
    profileView: "URL",
    url: "URL"
  },
  isFollowing: boolean    // Optional: whether currently following
}
```

---

## Styling

### CSS Classes Available

```css
.modal-backdrop        /* Backdrop overlay */
.modal-shell          /* Gradient border shell */
.modal-inner          /* Inner white container */
.modal-header         /* Header section */
.modal-title          /* Title text */
.modal-subtitle       /* Subtitle text */
.modal-close          /* Close button */
.modal-list-body      /* Scrollable list area */
.modal-scroll         /* Custom scrollbar styling */
.modal-footer         /* Footer section */
.user-card            /* User card container */
.avatar-ring          /* Avatar with gradient border */
.follow-button        /* Follow button base */
.follow-button-sm     /* Small follow button */
.follow-button-md     /* Medium follow button */
.follow-button-primary     /* Primary state */
.follow-button-muted       /* Following state */
.follow-button-danger      /* Unfollow hover state */
```

### Custom Tailwind Classes Used

- `@apply` directives for responsive design
- Breakpoints: `@media (max-width: 640px)` and `@media (max-width: 480px)`
- Color variables: `from-blue-600`, `to-purple-500`, etc.

---

## API Integration

### Endpoints Used (No Changes)

```javascript
// Fetch followers
GET /profile/get-followers/:userId
Response: { followers: UserObject[] }

// Fetch following
GET /profile/get-following/:userId
Response: { following: UserObject[] }

// Follow user
POST /follow/follow-user
Body: { targetId: string }

// Unfollow user
DELETE /follow/unfollow-user/:userId

// Remove follower
DELETE /follow/remove-follower/:userId

// Get follow status
GET /profile/get-profile/:userId
Response: { following: boolean }
```

---

## Error Handling

### Toast Notifications

The system uses `react-hot-toast` for notifications:

```javascript
// Success toast (auto-shown by FollowButton)
toast.success("User followed!", { duration: 2, position: "bottom-center" });

// Error toast (auto-shown by FollowButton)
toast.error(errorMessage, { duration: 3, position: "bottom-center" });
```

### Error States in Components

```javascript
// Check for errors in modals
{error && (
  <div className="modal-alert">{error}</div>
)}

// Check for errors in follow button
{error && (
  <div className="mt-1 text-xs text-red-600">{error}</div>
)}
```

---

## Performance Tips

1. **Use initialFollowing**: Provide initial state to avoid fetching
   ```jsx
   <FollowButton userId={id} initialFollowing={isFollowing} />
   ```

2. **Memoize callbacks**: Prevent unnecessary re-renders
   ```jsx
   const handleFollowChange = useCallback((status) => {
     // handle change
   }, []);
   ```

3. **Lazy load images**: Already implemented in UserListCard
   ```jsx
   <img loading="lazy" src={src} alt={alt} />
   ```

4. **Key properly in lists**: Already handled in modals
   ```jsx
   {filteredFollowers.map((user) => (
     <UserListCard key={user.userId || user._id} />
   ))}
   ```

---

## Common Issues & Solutions

### Issue: Modal not closing
**Solution**: Ensure `onClose` prop is properly connected to state setter
```jsx
<FollowersModal onClose={() => setShowFollowers(false)} />
```

### Issue: Background scrolling with modal open
**Solution**: Already implemented! Body scroll is locked in useEffect

### Issue: Follow button not syncing across modals
**Solution**: Global event system is active by default

### Issue: Search not working
**Solution**: Check that search term state is properly connected
```jsx
const [searchTerm, setSearchTerm] = useState("");
```

### Issue: Profile picture not showing
**Solution**: Already handles multiple fallback formats and shows initials

---

## Testing Examples

```jsx
// Test Follow Button
<FollowButton userId="123" />

// Test with custom handlers
<FollowButton 
  userId="123"
  initialFollowing={true}
  onFollowStatusChange={(status) => console.log(status)}
/>

// Test Followers Modal
<FollowersModal
  userId="456"
  onClose={() => console.log("closed")}
  onFollowersCountUpdate={(count) => console.log("Count:", count)}
/>

// Test complete flow
<div>
  <button onClick={() => setShowFollowers(true)}>
    Followers ({followerCount})
  </button>
  {showFollowers && (
    <FollowersModal
      userId={currentUserId}
      onClose={() => setShowFollowers(false)}
      onFollowersCountUpdate={setFollowerCount}
    />
  )}
</div>
```

---

## Accessibility Features

- ARIA labels on buttons
- Semantic HTML structure
- Focus states on interactive elements
- Proper heading hierarchy
- Keyboard navigation support
- Screen reader friendly

---

## Browser Support

- ✅ Chrome/Chromium (Full)
- ✅ Firefox (Full)
- ✅ Safari (Full)
- ✅ Edge (Full)
- ✅ Mobile browsers (Full)

---

## Need Help?

Refer to:
1. Component JSDoc comments
2. Inline code comments
3. IMPROVEMENTS_SUMMARY.md for overview
4. IMPLEMENTATION_CHECKLIST.md for completed features

**Happy coding! 🚀**
