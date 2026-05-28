# MongoDB & Mongoose Reference Guide (Momentia)

This guide documents every MongoDB and Mongoose method, keyword, operator, and schema option utilized across the **Momentia** backend codebase. 

---

## 📌 Table of Contents
1. [Schema & Model Definition](#1-schema--model-definition)
2. [Standard Mongoose Query & Database Methods](#2-standard-mongoose-query--database-methods)
3. [Mongoose Chainable Query Helpers](#3-mongoose-chainable-query-helpers)
4. [MongoDB Atomic Update Operators](#4-mongodb-atomic-update-operators)
5. [MongoDB Update Options & Modifiers](#5-mongodb-update-options--modifiers)
6. [Aggregation Pipeline Stages](#6-aggregation-pipeline-stages)
7. [Aggregation Expressions & Logical Operators](#7-aggregation-expressions--logical-operators)
8. [Other important Methods not Discussed in this project](#8)

---

## 1. Schema & Model Definition

These constructs from the `mongoose` library are used to design the database architecture, validate inputs, enforce relational constraints, and register models.

### `mongoose.Schema(definition, options)`
*   **Purpose:** Defines the structure of documents within a MongoDB collection, specifying fields, data types, validators, and hooks.
*   **Momentia Example ([Comment.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/models/Comment.js)):**
    ```javascript
    const CommentSchema = new mongoose.Schema({
        content: { type: String, required: true },
        totalLikes: { type: Number, default: 0 }
    }, { timestamps: true });
    ```

### `mongoose.model(name, schema)`
*   **Purpose:** Registers a schema with Mongoose, creating a wrapper model that enables querying, updating, and inserting documents in the target collection.
*   **Momentia Example ([User.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/models/User.js)):**
    ```javascript
    module.exports = mongoose.model('user', UserSchema);
    ```

### `mongoose.Schema.Types.ObjectId`
*   **Purpose:** A 12-byte identifier type used to store unique database references to documents in other collections (enabling relations/joins).
*   **Momentia Example ([Like.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/models/Like.js)):**
    ```javascript
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
    ```

### `ref`
*   **Purpose:** Tells Mongoose which model to reference when performing `.populate()` or lookup joins.
*   **Momentia Example ([Follow.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/models/Follow.js)):**
    ```javascript
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    ```

### `index: true`
*   **Purpose:** Tells MongoDB to create a B-Tree index on the field, which drastically speeds up lookup operations (queries) at the cost of slight write overhead.
*   **Momentia Example ([Comment.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/models/Comment.js)):**
    ```javascript
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "comment", default: null, index: true }
    ```

### `{ expires: N }` / TTL Index
*   **Purpose:** Creates a Time-To-Live index that automatically deletes documents after a certain duration (e.g., after they read notifications).
*   **Momentia Example ([Notification.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/models/Notification.js)):**
    ```javascript
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // Document will expire when current time matches or exceeds expiresAt
    }
    ```

### `timestamps: true`
*   **Purpose:** Mongoose schema option that automatically adds and manages `createdAt` and `updatedAt` Date fields for every document.
*   **Momentia Example ([Post.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/models/Post.js)):**
    ```javascript
    const PostSchema = new mongoose.Schema({ ... }, { timestamps: true });
    ```

### `enum`
*   **Purpose:** A validator that restricts a string field to a predefined set of allowed values.
*   **Momentia Example ([Notification.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/models/Notification.js)):**
    ```javascript
    notificationType: {
      type: String,
      enum: ["post", "comment", "follow"],
      required: true
    }
    ```

---

## 2. Standard Mongoose Query & Database Methods

These methods are called directly on models to run Create, Read, Update, and Delete (CRUD) operations.

### `new Model(data).save()`
*   **Purpose:** Instantiates a new document in memory and saves it to the database, firing pre-save hooks and validations.
*   **Momentia Example ([commentRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/commentRoutes.js)):**
    ```javascript
    const comment = new Comment(commentData);
    await comment.save();
    ```

### `Model.find(query)`
*   **Purpose:** Queries the collection and returns an array of all documents matching the specified filter criteria.
*   **Momentia Example ([feedRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/feedRoutes.js)):**
    ```javascript
    const followingRelationships = await Follow.find({ host: user._id }).select('target');
    ```

### `Model.findOne(query)`
*   **Purpose:** Queries the collection and returns the *first* document that matches the criteria, or `null` if none match.
*   **Momentia Example ([followRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/followRoutes.js)):**
    ```javascript
    const isFollowing = await Follow.findOne({ host: user._id, target: targetId });
    ```

### `Model.findById(id)`
*   **Purpose:** Shorthand method for finding a single document by its unique hexadecimal `_id`.
*   **Momentia Example ([followRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/followRoutes.js)):**
    ```javascript
    const targetUser = await User.findById(targetId);
    ```

### `Model.findOneAndUpdate(query, update, options)`
*   **Purpose:** Finds a single document matching the query, applies updates, and returns either the old or modified document (determined by options). Used extensively in Momentia for atomic notification updates.
*   **Momentia Example ([notificationService.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/services/notificationService.js)):**
    ```javascript
    const oldNotification = await Notification.findOneAndUpdate(
      { recipient: data.postAuthor, notificationType: "post", isRead: false },
      { $inc: { actorCount: 1 }, $push: { actors: { $each: [data.author], $slice: 3 } } },
      { upsert: true, returnDocument: "before" }
    );
    ```

### `Model.findByIdAndUpdate(id, update, options)`
*   **Purpose:** Shorthand for finding a document by `_id` and applying updates.
*   **Momentia Example ([commentRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/commentRoutes.js)):**
    ```javascript
    await Comment.findByIdAndUpdate(parent, { $inc: { totalReplies: 1 } });
    ```

### `Model.findOneAndDelete(query)`
*   **Purpose:** Finds a single document matching the criteria, deletes it from the database, and returns the deleted document.
*   **Momentia Example ([followRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/followRoutes.js)):**
    ```javascript
    const followRecord = await Follow.findOneAndDelete({ host: user._id, target: targetId });
    ```

### `Model.findByIdAndDelete(id)`
*   **Purpose:** Shorthand to find a document by `_id` and delete it.
*   **Momentia Example ([commentRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/commentRoutes.js)):**
    ```javascript
    await Comment.findByIdAndDelete(commentId);
    ```

### `Model.updateMany(query, update, options)`
*   **Purpose:** Modifies all documents in the collection that match the query filter using the specified update operations.
*   **Momentia Example ([notificationRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/notificationRoutes.js)):**
    ```javascript
    await Notification.updateMany(
      { _id: { $in: seenNotifications }, isRead: false },
      { $set: { isRead: true, expiresAt: expiryDate } }
    );
    ```

### `Model.countDocuments(query)`
*   **Purpose:** Counts the number of documents in the collection that match the query parameters.
*   **Momentia Example ([feedRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/feedRoutes.js)):**
    ```javascript
    const count = await Post.countDocuments({ author: { $in: followingList } });
    ```

---

## 3. Mongoose Chainable Query Helpers

These helper methods are chained onto standard Mongoose queries to refine, sort, page, or shape the returned document objects.

### `.populate(path, select)`
*   **Purpose:** Replaces specified ObjectIds in a document with the actual matching documents from another collection.
*   **Momentia Example ([notificationService.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/services/notificationService.js)):**
    ```javascript
    const notificationData = await Notification.findOne({ ... })
      .populate("actors", "_id username profilePicture")
      .populate({ path: "targetEntityId", model: "post", select: "_id caption thumbImage" });
    ```

### `.select(fields)`
*   **Purpose:** Specifies which fields should be returned (inclusion) or excluded (exclusion) in the query results to save bandwidth and memory.
*   **Momentia Example ([feedRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/feedRoutes.js)):**
    ```javascript
    const following = await Follow.find({ host: user._id }).select('target'); // Retrieves only target field
    ```

### `.sort(criteria)`
*   **Purpose:** Sets the sorting order of the query results. Use `1` for ascending and `-1` for descending.
*   **Momentia Example ([messageRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/messageRoutes.js)):**
    ```javascript
    const messages = await Message.find(query).sort({ messageNumber: -1 });
    ```

### `.skip(number)`
*   **Purpose:** Skips the first `N` documents in the query results, used for offset-based pagination.
*   **Momentia Example ([notificationRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/notificationRoutes.js)):**
    ```javascript
    const notifications = await Notification.find({ ... }).skip(skip).limit(limit);
    ```

### `.limit(number)`
*   **Purpose:** Constrains the query results to return a maximum number of documents.
*   **Momentia Example ([messageRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/messageRoutes.js)):**
    ```javascript
    const messages = await Message.find(query).limit(50);
    ```

### `.toObject()`
*   **Purpose:** Converts a Mongoose document (which contains built-in internal state, methods, and getters) into a plain JavaScript Object. Useful for dynamically modifying or extending the response before sending it.
*   **Momentia Example ([notificationService.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/services/notificationService.js)):**
    ```javascript
    const responseData = {
      ...notificationData.toObject(),
      actorDetails: notificationData.actors
    };
    ```

---

## 4. MongoDB Atomic Update Operators

Atomic operators perform data modifications directly inside the MongoDB engine, preventing concurrent race conditions and ensuring database integrity.

### `$inc`
*   **Purpose:** Increments or decrements a numeric field by a specified value.
*   **Momentia Example ([followRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/followRoutes.js)):**
    ```javascript
    await User.findByIdAndUpdate(user._id, { $inc: { following: 1 } });
    ```

### `$set`
*   **Purpose:** Replaces the value of a field with the specified new value, creating the field if it does not exist.
*   **Momentia Example ([notificationRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/notificationRoutes.js)):**
    ```javascript
    { $set: { isRead: true, expiresAt: expiryDate } }
    ```

### `$push`
*   **Purpose:** Appends a specified value to an array field.
*   **Momentia Example ([notificationService.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/services/notificationService.js)):**
    ```javascript
    $push: { actors: data.author }
    ```

### `$pull`
*   **Purpose:** Removes all occurrences of a value or matching criteria from an array field.
*   **Momentia Example ([postRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/postRoutes.js)):**
    ```javascript
    await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postid } });
    ```

---

## 5. MongoDB Update Options & Modifiers

These modifiers customize behavior during write/update operations, particularly for arrays and advanced positional updates.

### `$each`
*   **Purpose:** A modifier used with `$push` to append multiple items to an array in a single operation.
*   **Momentia Example ([notificationService.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/services/notificationService.js)):**
    ```javascript
    $push: { actors: { $each: [data.author] } }
    ```

### `$position`
*   **Purpose:** A modifier used with `$push` and `$each` to specify where to insert elements in the array (e.g., `0` prepends at the beginning).
*   **Momentia Example ([notificationService.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/services/notificationService.js)):**
    ```javascript
    $push: { actors: { $each: [data.author], $position: 0 } }
    ```

### `$slice`
*   **Purpose:** A modifier used with `$push` to limit the total number of items in the array, trimming off older or excess elements. Used in Momentia to keep only the 3 most recent notification actors.
*   **Momentia Example ([notificationService.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/services/notificationService.js)):**
    ```javascript
    $push: { actors: { $each: [data.author], $slice: 3 } }
    ```

### Positional Operator `$`
*   **Purpose:** Acts as a placeholder for the first array element matching the query filter, allowing direct updates to that element without knowing its index.
*   **Momentia Example ([messageRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/messageRoutes.js)):**
    ```javascript
    await Room.updateOne(
      { _id: roomId, "members.memberId": user._id },
      { $set: { "members.$.lastSeenMessage": room.currentMessageCount } }
    );
    ```

### Filtered Positional Operator `$[<identifier>]`
*   **Purpose:** Targets specific elements in an array that match conditions defined in `arrayFilters` options, allowing precise multi-element or variable-based array updates.
*   **Momentia Example ([messageRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/messageRoutes.js)):**
    ```javascript
    await Room.findOneAndUpdate(
      { _id: roomId, "members.memberId": userId },
      { $set: { "members.$[elem].lastSeenMessage": parseInt(latestMessageNumber) } },
      { arrayFilters: [{ "elem.memberId": userId }] }
    );
    ```

### `arrayFilters`
*   **Purpose:** An option that defines conditions determining which elements in an array the `$[<identifier>]` operator updates.
*   **Momentia Example:** See the filtered positional operator example above.

### Deep Dive: Array Filtering & Positional Updates

In high-concurrency environments, modifying nested array elements inside a MongoDB document safely is a major challenge. MongoDB offers two positional update strategies:

1.  **The Positional Operator (`$`)**:
    *   **Syntax**: `"arrayField.$.nestedField"`
    *   **Mechanism**: Replaces the positional placeholder with the index of the **first** array element that matches the query stage.
    *   **Limitation**: The matching criteria must be explicitly defined in the query stage itself, and you can only update the first-matching element in the array.
    *   **Use Case in Momentia**: Used in message routes to update a user's `lastSeenMessage` by matching `{ _id: roomId, "members.memberId": user._id }` and setting `"members.$.lastSeenMessage"`.

2.  **The Filtered Positional Operator (`$[<identifier>]`)**:
    *   **Syntax**: `"arrayField.$[elem].nestedField"`
    *   **Mechanism**: Iterates over every element in the array and applies the update only if the element satisfies the conditions specified in the `arrayFilters` array.
    *   **Why we need it**: It decouples the document-selection query from the array-element-selection query. This lets us update specific elements based on dynamic variables or identifiers without relying on what was matched in the main query filter.
    *   **Use Case in Momentia**: Used during real-time sequence updates to target only the active user's member object in a room:
        ```javascript
        await Room.findOneAndUpdate(
          { _id: roomId, "members.memberId": userId },
          { $set: { "members.$[elem].lastSeenMessage": parseInt(latestMessageNumber) } },
          {
            new: true,
            arrayFilters: [{ "elem.memberId": userId }]
          }
        );
        ```
        Here, the query locates the correct Room document. The update operator `$set` uses `$[elem]` to evaluate each member object in the `members` array. The `arrayFilters` defines `elem` as the object where `elem.memberId` equals the `userId`, updating ONLY that member's read sequence number atomically.

### `upsert: true`
*   **Purpose:** Tell MongoDB to create a new document if no document matches the search query.
*   **Momentia Example:** Used when creating notifications that might not exist yet.

### `returnDocument: 'before' | 'after'` (or `new: true`)
*   **Purpose:** Configures whether the original (`before`/`false`) or modified (`after`/`true`) document is returned by `findOneAndUpdate`.
*   **Momentia Example:** `returnDocument: 'before'` is used in notification rate-limiting to check the `updatedAt` timestamp *prior* to updating it.

---

## 6. Aggregation Pipeline Stages

The MongoDB Aggregation Framework processes data records through a multi-stage pipeline to perform complex queries, transformations, and joins.

### `$match`
*   **Purpose:** Filters documents to pass only those matching the search criteria to the next stage.
*   **Momentia Example ([commentRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/commentRoutes.js)):**
    ```javascript
    { $match: { post: new mongoose.Types.ObjectId(postid), parent: null } }
    ```

### `$sort`
*   **Purpose:** Sorts the incoming stream of documents by the specified key(s).
*   **Momentia Example ([profileRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/profileRoutes.js)):**
    ```javascript
    { $sort: { followers: -1 } }
    ```

### `$skip`
*   **Purpose:** Skips the first `N` documents in the aggregation stream.
*   **Momentia Example ([commentRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/commentRoutes.js)):**
    ```javascript
    { $skip: skip }
    ```

### `$limit`
*   **Purpose:** Restricts the number of documents passed to the next stage in the pipeline.
*   **Momentia Example ([profileRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/profileRoutes.js)):**
    ```javascript
    { $limit: 6 }
    ```

### `$lookup`
*   **Purpose:** Performs a left outer join to combine documents from another collection on matching fields. Can be used in simple format or complex pipeline format.
*   **Momentia Example (Simple Join in [commentRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/commentRoutes.js)):**
    ```javascript
    {
        $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDetails'
        }
    }
    ```
*   **Momentia Example (Complex Join in [feedRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/feedRoutes.js)):**
    ```javascript
    {
        $lookup: {
            from: 'likes',
            let: { postId: '$_id' },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$postTarget', '$$postId'] },
                                { $eq: ['$author', new mongoose.Types.ObjectId(user._id)] }
                            ]
                        }
                    }
                }
            ],
            as: 'likedStatus'
        }
    }
    ```

### Deep Dive: Aggregation Pipelines & Complex `$lookup` Joins

While basic Mongoose queries are fast for fetching simple documents, social feeds and notification pages require complex joins, post checks, and conditional logic. This is where the MongoDB Aggregation Pipeline excels.

#### Understanding `$lookup` Variants:

1.  **Standard `$lookup` (Equality Join)**:
    *   **How it works**: Compares a field in the input document (`localField`) directly to a field in the target collection (`foreignField`) for equality.
    *   **Syntax**:
        ```javascript
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDetails'
          }
        }
        ```
    *   **Process**: MongoDB runs an index scan on the target collection (`users._id`) matching the value of `author`, returning the array of matches.

2.  **Advanced `$lookup` (Custom Sub-Pipeline Join)**:
    *   **How it works**: Instead of simple field matching, it runs an entire independent query pipeline inside the target collection for every input document.
    *   **Key Fields**:
        *   `let`: Declares variable names and binds them to fields of the parent document (prefixed with `$` in `let`).
        *   `pipeline`: The array of aggregation stages to run inside the foreign collection.
        *   `$expr`: An expression operator that evaluates aggregation operators (like `$eq`, `$and`) within a `$match` stage. Crucially, it allows comparing fields in the foreign collection (prefixed with `$`) against the parent variables declared in `let` (prefixed with `$$`).
    *   **Momentia Example (Checking Post Liked Status)**:
        ```javascript
        {
            $lookup: {
                from: 'likes',
                let: { postId: '$_id' }, // Binds parent post '_id' to local variable 'postId'
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$postTarget', '$$postId'] }, // Foreign field '$postTarget' equals parent '$$postId'
                                    { $eq: ['$author', new mongoose.Types.ObjectId(user._id)] } // Matches current user
                                ]
                            }
                        }
                    }
                ],
                as: 'likedStatus'
            }
        }
        ```
    *   **Execution flow**:
        1.  For each post in the pipeline, MongoDB binds the post's `_id` to a variable named `$$postId`.
        2.  It executes the sub-pipeline inside the `likes` collection.
        3.  The `$match` stage uses `$expr` to evaluate logic: it checks if the like's `postTarget` matches `$$postId` and the like's `author` matches the current logged-in user.
        4.  If a matching like exists, it populates `likedStatus` with that Like document.
        5.  The next pipeline stage converts `likedStatus` length into a boolean: `isLiked: { $gt: [{ $size: '$likedStatus' }, 0] }`.

### `$unwind`
*   **Purpose:** Deconstructs an array field from the input documents to output a document for each element of the array.
*   **Momentia Example ([commentRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/commentRoutes.js)):**
    ```javascript
    { $unwind: '$authorDetails' } // Flattens authorDetails array into a single object
    ```

### `$addFields`
*   **Purpose:** Appends new fields or overrides existing fields in the output documents.
*   **Momentia Example ([feedRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/feedRoutes.js)):**
    ```javascript
    {
        $addFields: {
            isLiked: { $gt: [{ $size: '$likedStatus' }, 0] }
        }
    }
    ```

### `$project`
*   **Purpose:** Filters, renames, or formats output fields (e.g., `1` to include, `0` to exclude sensitive fields).
*   **Momentia Example ([feedRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/feedRoutes.js)):**
    ```javascript
    {
        $project: {
            likedStatus: 0,
            'authorDetails.password': 0,
            'authorDetails.email': 0
        }
    }
    ```

---

## 7. Aggregation Expressions & Logical Operators

These expressions are evaluated during pipeline execution to perform conditional logic, comparisons, or math operations on documents.

### `$expr`
*   **Purpose:** Allows the use of aggregation expressions within a `$match` stage, which enables comparing fields from different tables/variables inside lookup pipelines.
*   **Momentia Example:** (See `$lookup` complex example above).

### `$eq`
*   **Purpose:** Compares two values and returns `true` if they are equal.
*   **Momentia Example:** `{ $eq: ['$likeType', 'comment'] }`

### `$ne`
*   **Purpose:** Compares two values and returns `true` if they are NOT equal.
*   **Momentia Example:** `{ $match: { _id: { $ne: currentUserId } } }`

### `$gt`
*   **Purpose:** Compares two values and returns `true` if the first value is greater than the second.
*   **Momentia Example:** `isLiked: { $gt: [{ $size: '$likedStatus' }, 0] }`

### `$gte`
*   **Purpose:** Compares two values and returns `true` if the first value is greater than or equal to the second.
*   **Momentia Example:** `createdAt: { $gte: twoDaysAgo }`

### `$lt`
*   **Purpose:** Compares two values and returns `true` if the first value is less than the second.
*   **Momentia Example:** `createdAt: { $lt: new Date(cursor.createdAt) }`

### `$and`
*   **Purpose:** Evaluates one or more expressions and returns `true` only if all expressions resolve to `true`.
*   **Momentia Example:** 
    ```javascript
    $and: [
      { $eq: ["$_id", "$$targetId"] },
      { $eq: ["$$type", "post"] }
    ]
    ```

### `$or`
*   **Purpose:** Evaluates one or more expressions and returns `true` if any expression resolves to `true`.
*   **Momentia Example:**
    ```javascript
    $or: [
      { author: { $nin: priorityAuthors } },
      { createdAt: { $lt: twoDaysAgo } }
    ]
    ```

### `$in`
*   **Purpose:** Checks if a specified value is present within an array (returns `true` if found).
*   **Momentia Example:** `{ $in: ['$$postId', '$savedPosts'] }`

### `$nin`
*   **Purpose:** Checks if a specified value is NOT present within an array (returns `true` if absent).
*   **Momentia Example:** `{ author: { $nin: priorityAuthors } }`

### `$size`
*   **Purpose:** Counts and returns the number of elements in an array.
*   **Momentia Example:** `{ $size: '$likedStatus' }`

### `$arrayElemAt`
*   **Purpose:** Returns the element at the specified array index. Used in Momentia to flatten joined arrays (e.g., getting the first matching lookup result).
*   **Momentia Example ([notificationRoutes.js](file:///C:/Users/blued/Desktop/4-team/insta-clone-momentia/backend/routes/notificationRoutes.js)):**
    ```javascript
    postDetails: { $arrayElemAt: ["$postDetails", 0] }
    ```

---

## 8. Other Important MongoDB & Mongoose Concepts (Not Used in This Project)

For a complete mastery of MongoDB and Mongoose, it is important to understand several advanced features and architectural tools that are not actively used in the current version of Momentia.

### A. ACID Transactions & Sessions
*   **Concept**: Runs multiple operations inside a transaction block. If any single query fails, the entire transaction is rolled back, preventing partial writes.
*   **Syntax & Structure**:
    ```javascript
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Pass the session object to every database query
      await User.updateOne({ _id: userId }, { $inc: { balance: -10 } }, { session });
      await Order.create([{ userId, item: 'premium' }], { session });
      
      await session.commitTransaction(); // Save changes permanently
    } catch (error) {
      await session.abortTransaction(); // Undo all changes if any fail
    } finally {
      session.endSession();
    }
    ```
*   **When to use**: Financial systems, shopping carts, checkout logic, or multi-step operations where data integrity is critical.

### B. Mongoose Middleware (Pre/Post Hooks)
*   **Concept**: Intercepts actions at specific lifecycle events (like `save`, `validate`, `remove`, `update`) to run custom pre-processing or post-processing logic automatically.
*   **Example (Hashing Passwords pre-save)**:
    ```javascript
    UserSchema.pre('save', async function (next) {
      if (!this.isModified('password')) return next();
      this.password = await bcrypt.hash(this.password, 12);
      next();
    });
    ```
*   **When to use**: Automatic password hashing, cascade deletes (e.g., deleting all comments when a post is deleted), or maintaining statistics.

### C. Mongoose Virtuals
*   **Concept**: Defines document properties that can be read and written but are **not** persisted to the MongoDB database. They are computed dynamically on the fly.
*   **Example (Concatenating Full Name)**:
    ```javascript
    UserSchema.virtual('fullName').get(function () {
      return `${this.firstName} ${this.lastName}`;
    });
    ```
*   **When to use**: Computed values, client-only formatting properties, or cleaner UI mapping without bloating database storage.

### D. Schema Discriminators (Inheritance)
*   **Concept**: An inheritance mechanism that allows you to define multiple models with overlapping schemas on top of the same underlying MongoDB collection.
*   **Example**:
    ```javascript
    const User = mongoose.model('User', UserSchema);
    
    // Admin inherits everything from User schema and adds specific fields
    const Admin = User.discriminator('Admin', new mongoose.Schema({
      adminRoles: [String],
      superUser: Boolean
    }));
    ```
*   **When to use**: Polymorphic models (e.g., a Single `Notification` collection with distinct payload shapes for `LikeNotification`, `FollowNotification`, `MessageNotification`).

### E. Custom Instance Methods & Statics
*   **Concept**: Adds custom helper functions directly to schema instances (methods) or model classes (statics) to encapsulate domain logic.
*   **Example (Instance Method vs. Static Method)**:
    ```javascript
    // Instance Method (called on a single document instance)
    UserSchema.methods.comparePassword = async function (candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };
    
    // Static Method (called directly on the Model class)
    UserSchema.statics.findByUsername = function (username) {
      return this.findOne({ username: new RegExp(username, 'i') });
    };
    ```

### F. Advanced Aggregations (`$group` & `$facet`)
*   **`$group`**: Groups documents by a specific key and runs accumulator operations (like `$sum`, `$avg`, `$max`, `$push`).
    ```javascript
    {
      $group: {
        _id: "$author",
        totalLikesReceived: { $sum: "$totalLikes" },
        postIds: { $push: "$_id" }
      }
    }
    ```
*   **`$facet`**: Runs multiple parallel aggregation pipelines within a single aggregation call, useful for generating paginated records and summaries simultaneously.
    ```javascript
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: 10 }, { $limit: 10 }]
      }
    }
    ```

