import mongoose from "mongoose";
import { ChatEventEnum } from "../constants.js";
import { Chat } from "../models/chat.model.js";
import { ChatMessage } from "../models/message.model.js";
import { emitSocketEvent } from "../socket/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getLocalPath, getStaticFilePath } from "../utils/helpers.js";

const chatMessageCommonAggregation = () => {
  return [
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "sender",
        as: "sender",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        sender: { $first: "$sender" },
      },
    },
  ];
};

const getAllMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    throw new ApiError(404, "Chat does not exist");
  }

  if (!selectedChat.participants?.includes(req.user?._id)) {
    throw new ApiError(400, "User is not a part of this chat");
  }

  const messages = await ChatMessage.aggregate([
    {
      $match: {
        chat: new mongoose.Types.ObjectId(chatId),
      },
    },
    ...chatMessageCommonAggregation(),
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, messages || [], "Messages fetched successfully")
    );
});

const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;

  if (!content && !req.files?.attachments?.length) {
    throw new ApiError(400, "Message content or attachment is required");
  }

  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    throw new ApiError(404, "Chat does not exist");
  }
  console.log("Before updating unread counts:", selectedChat);
  const messageFiles = [];

  if (req.files && req.files.attachments?.length > 0) {
    req.files.attachments?.map((attachment) => {
      messageFiles.push({
        url: getStaticFilePath(req, attachment.filename),
        localPath: getLocalPath(attachment.filename),
      });
    });
  }

  const message = await ChatMessage.create({
    sender: new mongoose.Types.ObjectId(req.user._id),
    content: content || "",
    chat: new mongoose.Types.ObjectId(chatId),
    attachments: messageFiles,
  });

  // selectedChat.participants.forEach(async (participantId) => {
  //   if (participantId.toString() !== req.user._id.toString()) {
  //     console.log("Updating unread count for participant:", participantId);

  //     await Chat.updateOne(
  //       {
  //         _id: chatId,
  //         "unreadCounts.user": participantId,
  //       },
  //       {
  //         $inc: { "unreadCounts.$.count": 1 },
  //       }
  //     );

  //     console.log(
  //       "Unread count updated successfully for participant:",
  //       participantId
  //     );

  //     // Log the updated unread count for the participant
  //     const updatedChat = await Chat.findById(chatId);
  //     const unreadCount = updatedChat.unreadCounts.find(
  //       (unread) => unread.user.toString() === participantId.toString()
  //     )?.count;
  //     // ).count
  //     console.log(
  //       `Unread count for participant ${participantId}:`,
  //       unreadCount
  //     );
  //   }
  // });
  for (const participantId of selectedChat.participants) {
    if (participantId.toString() !== req.user._id.toString()) {
      console.log("Updating unread count for participant:", participantId);

      try {
        const updateResult = await Chat.updateOne(
          {
            _id: chatId,
            "unreadCounts.user": participantId,
          },
          {
            $inc: { "unreadCounts.$.count": 1 },
          }
        );

        console.log("Update result:", updateResult);

        if (updateResult.nModified === 0) {
          console.log(
            "Participant not found in unread counts. Adding new unread count entry."
          );
          await Chat.updateOne(
            { _id: chatId },
            { $push: { unreadCounts: { user: participantId, count: 1 } } }
          );
        }

        console.log(
          "Unread count updated successfully for participant:",
          participantId
        );
      } catch (error) {
        console.error("Error updating unread count:", error);
        // Handle the error as needed, e.g., log it, send an error response, etc.
      }

      // Log the updated unread count for the participant
      const updatedChat = await Chat.findById(chatId);
      const unreadCount = updatedChat.unreadCounts.find(
        (unread) => unread.user.toString() === participantId.toString()
      )?.count;

      console.log(
        `Unread count for participant ${participantId}:`,
        unreadCount
      );
    }
  }

  console.log("After updating unread counts:", selectedChat);

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: {
        lastMessage: message._id,
      },
    },
    { new: true }
  );

  const unreadCount = chat.unreadCounts.find(
    (unread) => unread.user.toString() === req.user._id.toString()
  )?.count;

  // ).count;
  // Update unread message count for all participants except the sender
  // await Chat.updateMany(
  //   {
  //     _id: chatId,
  //     participants: { $ne: req.user._id }, // Exclude the sender
  //   },
  //   {
  //     $inc: { "unreadCounts.$[].count": 1 }, // Increment unread count for all participants
  //   }
  // );

  // const updatedChat = await Chat.findById(chatId);

  // // Extract the unread count for the current user
  // const unreadCount =
  //   updatedChat.unreadCounts.find((unread) => unread.user.equals(req.user._id))
  //     ?.count || 0;
  // structure the message
  const messages = await ChatMessage.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(message._id),
      },
    },
    ...chatMessageCommonAggregation(),
  ]);

  // Store the aggregation result
  const receivedMessage = messages[0];

  if (!receivedMessage) {
    throw new ApiError(500, "Internal server error");
  }

  chat.participants.forEach((participantObjectId) => {
    if (participantObjectId.toString() === req.user._id.toString()) return;

    emitSocketEvent(
      req,
      participantObjectId.toString(),
      ChatEventEnum.MESSAGE_RECEIVED_EVENT,
      receivedMessage
    );
  });

  return res.status(201).json({
    statusCode: 201,
    data: receivedMessage,
    unreadCount: unreadCount,
    message: "Message saved successfully",
    success: true,
  });

  // return res;
  // .status(201)
  // .json(
  //   new ApiResponse(
  //     201,
  //     receivedMessage,
  //     unreadCount,
  //     "Message saved successfully"
  //   )
  // );
});

export { getAllMessages, sendMessage };
