import cookie from "cookie";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { AvailableChatEvents, ChatEventEnum } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

// Define unreadMessageCounts object to store unread message counts for each chat
let unreadMessageCounts = {};

const mountJoinChatEvent = (socket) => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
    console.log(`User joined the chat 🤝. chatId: `, chatId);

    socket.join(chatId);

    // Send unread message count for the chat to the client
    socket.emit(ChatEventEnum.UNREAD_MESSAGE_COUNT_EVENT, {
      chatId: chatId,
      unreadCount: unreadMessageCounts[chatId] || 0,
    });
  });
};

const mountParticipantTypingEvent = (socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};

const mountParticipantStoppedTypingEvent = (socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};

const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const token = socket.handshake.auth?.token;
      console.log(token);

      if (!token) {
        throw new ApiError(401, "Un-authorized handshake. Token is missing");
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
      );

      if (!user) {
        throw new ApiError(401, "Un-authorized handshake. Token is invalid");
      }

      socket.user = user;
      socket.join(user._id.toString());
      socket.emit(ChatEventEnum.CONNECTED_EVENT);
      console.log("User connected 🗼. userId: ", user._id.toString());

      // Common events that need to be mounted on initialization
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      // Function to handle disconnect event
      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log("user has disconnected 🚫. userId: " + socket.user?._id);
        if (socket.user?._id) {
          socket.leave(socket.user._id);
        }
      });

      // Function to handle new message event
      socket.on(ChatEventEnum.NEW_MESSAGE_EVENT, (message) => {
        // Check if the chat window is open for the recipient
        if (!chatWindows[message.chatId].isOpen) {
          // Increment unread message count for the chat
          unreadMessageCounts[message.chatId] =
            (unreadMessageCounts[message.chatId] || 0) + 1;

          // Emit unread message count to the client
          io.to(message.recipientUserId).emit(
            ChatEventEnum.UNREAD_MESSAGE_COUNT_EVENT,
            {
              chatId: message.chatId,
              unreadCount: unreadMessageCounts[message.chatId],
            }
          );
        }
      });

      // Function to handle chat opened event
      socket.on(ChatEventEnum.CHAT_OPENED_EVENT, (chatId) => {
        // Reset unread message count for the chat to zero
        unreadMessageCounts[chatId] = 0;
      });
    } catch (error) {
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        error?.message || "Something went wrong while connecting to the socket."
      );
    }
  });
};

const emitSocketEvent = (req, roomId, event, payload) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };
