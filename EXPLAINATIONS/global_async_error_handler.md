# Global Async Error Handler Implementation Guide

This document explains the architecture, design pattern, and usage of the global async error handling system in the Momentia backend.

---

## 📌 Problem & Motivation

Before this implementation, every route in the Express backend was manually wrapped in repetitive `try/catch` blocks:

```javascript
// ❌ Old Repetitive Pattern
router.get("/get-something", async (req, res) => {
  try {
    const data = await Model.find();
    res.status(200).json({ data });
  } catch (err) {
    console.error("Error in get-something route:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
```

### Issues with the old pattern:
1. **Boilerplate Bloat**: Hundreds of identical `try/catch` blocks duplicated across 9 route files.
2. **Inconsistent Error Responses**: Different routes returned slightly different error payloads or status codes when unhandled exceptions occurred.
3. **Risk of Silent Crashes**: If an async route omitted a `try/catch` block, uncaught rejected promises would go unhandled in Node.js.

---

## 🏗 Architecture & Design Pattern

We implemented a two-part solution following Express best practices:
1. **`asyncHandler` Wrapper** (`backend/middleware/asyncHandler.js`)
2. **Centralized `errorHandler` Middleware** (`backend/middleware/errorHandler.js`)

```
+------------------+       +-------------------+       +-----------------------+
|  Client Request  | ----> |   asyncHandler    | ----> |    Route Controller   |
+------------------+       +-------------------+       +-----------------------+
                                     |                             |
                               (On Exception)                (DB Query / Logic)
                                     v                             |
                           +-------------------+                   v
                           |   next(error)     | <------------- (Throws Error)
                           +-------------------+
                                     |
                                     v
                           +-------------------+
                           |   errorHandler    | ----> Returns 400/500 JSON
                           +-------------------+       { message, stack }
```

---

## 🛠 File Implementations

### 1. `backend/middleware/asyncHandler.js`

```javascript
/**
 * Higher-order function to wrap asynchronous Express route handlers.
 * Catches any thrown errors or rejected promises and passes them to next(err).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

**How it works**: `asyncHandler` takes an async route function `fn`, executes it inside `Promise.resolve()`, and automatically passes any caught rejection directly to Express's `next(err)` pipeline.

---

### 2. `backend/middleware/errorHandler.js`

```javascript
/**
 * Global Express error handling middleware.
 * Placed after all route definitions to catch unhandled errors from asyncHandler.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Global Error Handler] Error on ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
```

**How it works**: Express identifies a middleware as an error handler when it accepts **4 parameters** `(err, req, res, next)`. When `next(err)` is called anywhere in the app, Express skips normal middleware and invokes `errorHandler`.

---

### 3. Server Registration (`backend/index.js`)

```javascript
const errorHandler = require('./middleware/errorHandler.js')

// All routes mounted here...
app.use("/api/user", userRoutes)
app.use("/api/profile", protect, profileRoutes)
app.use("/api/post", protect, postRoutes)
// ...

// Global error handler MUST be mounted AFTER all route definitions
app.use(errorHandler)
```

---

## 🚀 How to Write New Routes

When creating new routes in the backend, wrap the route handler with `asyncHandler`:

```javascript
// ✅ New Clean Pattern
const asyncHandler = require("../middleware/asyncHandler");

router.get("/my-new-route", asyncHandler(async (req, res) => {
  const result = await MyModel.find();
  
  if (!result) {
    res.status(404);
    throw new Error("Item not found"); // Automatically caught by errorHandler and returns 404
  }

  res.status(200).json({ result, message: "Success" });
}));
```

---

## ✅ Summary of Benefits

- **Zero Boilerplate**: Eliminated redundant `try/catch` blocks across all 9 route files (`userRoutes`, `profileRoutes`, `postRoutes`, `commentRoutes`, `followRoutes`, `feedRoutes`, `searchRoutes`, `notificationRoutes`, `messageRoutes`).
- **Consistent Responses**: All unhandled errors return uniform `{ message, stack? }` JSON objects.
- **Safe Execution**: Every async route failure is safely intercepted by `next(err)` without crashing the server.
