// This file is mainly used to store the number of online users currently on the server specifically for websockets only
// if the user is online we send the notification or message.
const onlineUsers = new Map();

// export it to use it anywhere

module.exports = { onlineUsers };
