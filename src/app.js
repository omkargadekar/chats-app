import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocketIO } from "./socket/index.js";
import { ApiError } from "./utils/ApiError.js";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import YAML from "yaml";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = fs.readFileSync(path.resolve(__dirname, "./swagger.yaml"), "utf8");
const swaggerDocument = YAML.parse(file);

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3030",
      "*",
      "https://chatsapp-nw05.onrender.com",
      "http://ec2-52-206-76-43.compute-1.amazonaws.com:8000",
    ],
    credentials: true,
  },
});
app.set("io", io);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3030",
      "*",
      "https://chatsapp-nw05.onrender.com",
      "http://ec2-52-206-76-43.compute-1.amazonaws.com:8000",
    ], // Add other domains as needed
    credentials: true,
  })
);

initializeSocketIO(io);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});
// Apply the rate limiting middleware to all requests
app.use(limiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    Mesaage: "Server is running ",
    currentTime: new Date(),
    status: "Active",
  });
});

//routes import
import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import eventRouter from "./routes/event.routes.js";
import newUserRoute from "./routes/newUser.routes.js";
import licenseRute from "./routes/license.routes.js";
import taskRoute from "./routes/task.routes.js";
import dashMessageRoute from "./routes/dashMessage.routes.js";
import dashChatRoute from "./routes/dashChat.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/chat-app/chats", chatRouter);
app.use("/api/v1/chat-app/messages", messageRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v2/users", newUserRoute);
app.use("/api/v2/license", licenseRute);
app.use("/api/v1/tasks", taskRoute);
app.use("/api/v1/dashMsg", dashMessageRoute);
app.use("/api/v1/dashChat", dashChatRoute);

// app.post("/api/v1/seed/chat-app", seedUsers, seedChatApp);

app.use(
  "/swag",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      docExpansion: "none", // keep all the sections collapsed by default
    },
    customSiteTitle: "CHAT APP Darren",
  })
);

io.on("dashconnection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("dashtyping", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

// http://localhost:8000/api/v1/users/register

export { app, httpServer };
