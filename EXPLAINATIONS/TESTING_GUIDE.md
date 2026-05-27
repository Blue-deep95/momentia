# Testing Guide - Followers & Following System

## Pre-Testing Checklist

Before testing, ensure:
- [ ] All files are saved (Ctrl+S in VS Code)
- [ ] No errors in the terminal
- [ ] npm install completed successfully
- [ ] Backend server is running
- [ ] Frontend dev server is running (`npm run dev`)

---

## Quick Smoke Tests (5 minutes)

### Test 1: Open Followers Modal
**Steps:**
1. Navigate to any user's profile
2. Click on the followers count
3. Modal should open with smooth animation

**Expected:**
- ✅ Modal appears smoothly
- ✅ Followers list loads
- ✅ Search box is visible
- ✅ Count displays correctly
- ✅ Background is blurred

### Test 2: Search in Followers
**Steps:**
1. Type a username in search box
2. List should filter in real-time

**Expected:**
- ✅ List filters instantly
- ✅ Only matching users show
- ✅ "No results" appears if none match
- ✅ Search is case-insensitive

### Test 3: Close Modal
**Steps:**
1. Click X button or backdrop
2. Modal should close

**Expected:**
- ✅ Modal closes smoothly
- ✅ Can scroll background again
- ✅ No animation glitches

### Test 4: Follow/Unfollow User
**Steps:**
1. Open any modal
2. Click follow/unfollow button
3. Check for notifications

**Expected:**
- ✅ Button state changes immediately
- ✅ Toast notification appears
- ✅ Success message shown
- ✅ User removed from modal if unfollowing

### Test 5: Navigate to Profile
**Steps:**
1. Click on any user card
2. Modal closes and navigates

**Expected:**
- ✅ Modal closes automatically
- ✅ Profile page loads
- ✅ Correct user profile displayed

---

## Detailed Functional Tests (20 minutes)

### Followers Modal Tests

#### Test F1: Load Followers
```
✅ Empty followers list - shows "No followers yet"
✅ Has followers - displays all followers (except self)
✅ Follower count updates
✅ Loading spinner shows during fetch
✅ Error message on API failure
```

#### Test F2: Search Functionality
```
✅ Search by username - filters correctly
✅ Search by full name - filters correctly
✅ Search is real-time - no debounce delay needed
✅ Clear search - list restores
✅ Case insensitive - "JOHN" matches "john"
✅ Partial match - "joh" matches "john"
✅ No results - shows appropriate message
```

#### Test F3: Follow/Unfollow
```
✅ Follow button works from modal
✅ Toast shows on follow success
✅ User status updates (Follow → Following)
✅ Unfollow works (hover shows "Unfollow")
✅ Toast shows on unfollow success
✅ Count updates after follow/unfollow
```

#### Test F4: Remove Follower (Own Profile Only)
```
✅ Remove button only shows on own profile
✅ Remove button removes user from list
✅ Count updates after remove
✅ Optimistic update happens
✅ Error reverts change if API fails
```

### Following Modal Tests

#### Test L1: Load Following
```
✅ Empty following list - shows "Not following anyone"
✅ Has following - displays all following (except self)
✅ Following count updates
✅ Loading spinner shows during fetch
✅ Error message on API failure
```

#### Test L2: Search Following (NEW!)
```
✅ Search works (was missing before!)
✅ Filters by username
✅ Filters by name
✅ Real-time filtering
✅ Shows "No results" when none match
```

#### Test L3: Unfollow from Following
```
✅ Unfollow button works
✅ User removed from list immediately
✅ Toast shows success
✅ Count decreases
✅ Button shows error if unfollow fails
```

### Follow Button Tests

#### Test B1: Basic Follow
```
✅ Shows "Follow" when not following
✅ Shows "Following" when following
✅ Shows "Unfollow" on hover when following
✅ Updates instantly on click
✅ Toast notification appears
```

#### Test B2: Loading State
```
✅ Button disabled while loading
✅ Spinner shows
✅ Button text grayed out
✅ Can't click multiple times
```

#### Test B3: Error Handling
```
✅ API error shows toast
✅ State reverts on error
✅ Error message is user-friendly
✅ Can retry after error
```

#### Test B4: Size Variants
```
✅ Small size (sm) - compact
✅ Medium size (md) - standard
✅ Styling correct for each
```

### User Card Tests

#### Test U1: Display
```
✅ Avatar shows correctly
✅ Username displays
✅ Name/handle displays
✅ Online indicator works (if enabled)
✅ Status pill shows (Follow/Following)
```

#### Test U2: Images
```
✅ Valid image loads
✅ Broken image shows initials fallback
✅ Missing image shows initials
✅ Lazy loading works
```

#### Test U3: Navigation
```
✅ Click user card opens profile
✅ Modal closes on click
✅ Correct profile loads
✅ Can go back with browser back button
```

### Modal UI Tests

#### Test M1: Design
```
✅ Gradient border looks good
✅ Header is sticky
✅ Content scrolls properly
✅ Scrollbar is visible and styled
```

#### Test M2: Animations
```
✅ Modal slides in smoothly
✅ Modal fades out smoothly
✅ Buttons have hover effects
✅ Follow status change animates
```

#### Test M3: Responsive
```
✅ Desktop (1920px) - full width
✅ Tablet (768px) - proper sizing
✅ Mobile (375px) - fills screen width
✅ Landscape - works correctly
```

### Edge Case Tests

#### Test E1: Empty States
```
✅ Empty followers - shows proper message
✅ Empty following - shows proper message
✅ User has no followers - displays correctly
```

#### Test E2: Data Issues
```
✅ Missing profile picture - shows initials
✅ Missing username - shows "Unknown"
✅ Broken API response - shows error
✅ Network timeout - shows error
```

#### Test E3: State Consistency
```
✅ Counts stay in sync
✅ No duplicate users appear
✅ Follow status consistent across modals
✅ Self user filtered out
```

---

## Mobile Testing (10 minutes)

### Device Testing
```
✅ iPhone SE (375px) - all features work
✅ iPhone 12 (390px) - proper layout
✅ iPad (768px) - tablet view works
✅ Android phone (360px) - responsive
```

### Touch Interaction
```
✅ Buttons are easy to tap
✅ Modal can be swiped closed (if implemented)
✅ Search input works on touch
✅ Scrolling is smooth
```

### Portrait/Landscape
```
✅ Portrait mode - proper layout
✅ Landscape mode - optimized layout
✅ Orientation change works smoothly
```

---

## Performance Tests

### Speed Tests
```
✅ Modal opens in <300ms
✅ Search filters in <100ms
✅ Follow/unfollow updates in <1s
✅ Images lazy load properly
✅ No jank or stuttering
```

### Memory Tests
```
✅ No memory leaks after open/close cycles
✅ Large follower lists handle well
✅ Search with many items works
```

---

## Error Scenario Tests

### Network Issues
```
✅ No internet - shows error message
✅ Slow network - shows loading state
✅ API timeout - shows error
✅ API returns error - handled gracefully
```

### Data Issues
```
✅ Missing fields - uses fallbacks
✅ Null values - handled
✅ Undefined - handled
✅ Malformed response - shows error
```

### User Issues
```
✅ Rapid clicking - no double follows
✅ Close modal mid-fetch - no crash
✅ Navigate away - cleanup happens
```

---

## Browser Compatibility Tests

### Desktop Browsers
```
✅ Chrome/Chromium - all features
✅ Firefox - all features
✅ Safari - all features
✅ Edge - all features
```

### Mobile Browsers
```
✅ iOS Safari - all features
✅ Chrome Mobile - all features
✅ Firefox Mobile - all features
✅ Samsung Internet - all features
```

---

## Accessibility Tests

### Keyboard Navigation
```
✅ Tab through buttons - works
✅ Enter to activate - works
✅ Escape to close - works (if implemented)
✅ Focus visible - clear indicator
```

### Screen Reader
```
✅ ARIA labels read correctly
✅ Buttons labeled properly
✅ Icons have descriptions
✅ Status updates announced
```

### Visual
```
✅ High contrast - readable
✅ Focus indicators - visible
✅ Animations - not disabled by default
```

---

## Regression Tests (Before Deployment)

### Existing Features Still Work
```
✅ Profile page loads
✅ Other modals work
✅ Navigation works
✅ Posts display correctly
✅ Comments work
✅ Likes work
```

### No Breaking Changes
```
✅ Component props unchanged
✅ API calls same format
✅ Redux store untouched
✅ Socket.io still works
✅ Other components unaffected
```

---

## Final Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] No console warnings
- [ ] Mobile works
- [ ] Desktop works
- [ ] Animations smooth
- [ ] Performance good
- [ ] Accessibility ok
- [ ] No memory leaks
- [ ] Ready to deploy!

---

## Test Results Template

```markdown
## Test Run: [DATE]

### Overall Status: ✅ PASS / ❌ FAIL

### Desktop (Chrome)
- Followers Modal: ✅ PASS
- Following Modal: ✅ PASS
- Follow Button: ✅ PASS
- User Card: ✅ PASS
- Search: ✅ PASS
- Animations: ✅ PASS

### Mobile (iPhone)
- Followers Modal: ✅ PASS
- Following Modal: ✅ PASS
- Touch Interaction: ✅ PASS
- Responsive: ✅ PASS

### Edge Cases
- Empty Lists: ✅ PASS
- Error Handling: ✅ PASS
- Network Issues: ✅ PASS
- Images: ✅ PASS

### Performance
- Load Time: < 300ms ✅
- Search Speed: < 100ms ✅
- Memory: Good ✅

### Notes:
[Any issues or observations]

### Conclusion:
✅ READY FOR PRODUCTION
```

---

## Troubleshooting

### Modal doesn't open
- Check console for errors
- Verify `userId` prop is provided
- Check Redux auth store has user data

### Search not working
- Verify search input has value
- Check filtering logic
- Clear browser cache

### Follow button not updating
- Check network tab for API response
- Verify API endpoint is correct
- Check browser console for errors

### Images not loading
- Check image URLs are valid
- Verify CORS is configured
- Check browser network tab

### Modal won't close
- Check `onClose` prop is connected
- Verify close button is clickable
- Try backdrop click

---

**Good luck with testing! 🚀**
