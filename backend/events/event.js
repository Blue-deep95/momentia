// THE MAIN CONFIG FILE FOR INITIALIZING EVENT EMITTERS
// This file is for initialization of a Notification emitter that handles
// all events related to notifications
// Here we are using node js internal event emitter to handle notifications and handle
// tasks such as sending notifications and saving notifications to an event handler
const EventEmitter = require("events");

// create a new notification and chat events emitter to handle their respective
// events
class NotificationEmitter extends EventEmitter {}
class ChatEmitter extends EventEmitter {}
const notificationBus = new NotificationEmitter();
const chatBus = new ChatEmitter();

module.exports = { notificationBus, chatBus };
