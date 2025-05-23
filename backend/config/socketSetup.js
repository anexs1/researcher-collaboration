// backend/config/socketSetup.js
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Adjust path if necessary

const { User, Message, Project, Member } = db;

const userSockets = new Map();
let ioInstance = null;

const getSocketRoomName = (projectId) => {
  if (!projectId) return null;
  return `project-${projectId}`;
};

const logUserSockets = (context) => {
  if (userSockets.size > 10 && process.env.NODE_ENV !== "development") {
    console.log(
      `[Socket INFO - ${context}] UserSockets map has ${userSockets.size} users connected.`
    );
    return;
  }
  const mapEntries = Array.from(userSockets.entries()).map(
    ([userId, socketSet]) =>
      `User ${userId}: Sockets(${Array.from(socketSet).join(", ")})`
  );
  const logString = `{ ${mapEntries.join("; ")} }`;
  const displayLog =
    logString.length > 500 ? logString.substring(0, 497) + "..." : logString;
  console.log(
    `[Socket INFO - ${context}] UserSockets (${userSockets.size} users): ${displayLog}`
  );
};

export const initSocketIO = (httpServer) => {
  const jwtSecret = process.env.JWT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (ioInstance) {
    console.warn(
      "[Socket.IO WARN] Socket.IO server instance is already initialized. Returning existing instance."
    );
    return ioInstance;
  }

  if (!jwtSecret) {
    console.error(
      "[Socket.IO FATAL] JWT_SECRET environment variable is not set."
    );
    throw new Error("FATAL ERROR: JWT_SECRET environment variable is missing.");
  }
  if (!httpServer) {
    console.error(
      "[Socket.IO FATAL] Valid Node.js HTTP server instance was not provided."
    );
    throw new Error("FATAL ERROR: Valid httpServer instance was not provided.");
  }
  if (!User || !Message || !Project || !Member) {
    const missingModels = [
      !User && "User",
      !Message && "Message",
      !Project && "Project",
      !Member && "Member",
    ]
      .filter(Boolean)
      .join(", ");
    console.error(
      `[Socket.IO FATAL] Required Sequelize models missing: ${missingModels}.`
    );
    throw new Error(`FATAL ERROR: Models (${missingModels}) not loaded.`);
  }

  console.log(
    "DEBUG [socketSetup Init]: All required Sequelize models appear to be loaded."
  );
  if (Member && typeof Member.getAttributes === "function") {
    console.log(
      "DEBUG [socketSetup Init]: Member Model PKs:",
      Member.primaryKeyAttributes,
      "Attrs:",
      Object.keys(Member.getAttributes())
    );
  } else {
    console.error("DEBUG [socketSetup Init]: Member model is invalid!");
  }
  if (Message && typeof Message.getAttributes === "function") {
    console.log(
      "DEBUG [socketSetup Init]: Message Model Attrs:",
      Object.keys(Message.getAttributes())
    );
    if (Message.associations && Message.associations.sender) {
      console.log(
        "DEBUG [socketSetup Init]: Message model has 'sender' association. Type:",
        Message.associations.sender.associationType,
        "Target:",
        Message.associations.sender.target.name
      );
    } else {
      console.warn(
        "DEBUG [socketSetup Init]: Message model DOES NOT appear to have 'sender' association or it's not named 'sender'. This is CRITICAL for chat history."
      );
    }
  } else {
    console.error("DEBUG [socketSetup Init]: Message model is invalid!");
  }

  try {
    ioInstance = new SocketIOServer(httpServer, {
      cors: {
        origin: frontendUrl.split(",").map((url) => url.trim()),
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      },
    });
    console.log(
      `[Socket.IO INFO] Socket.IO Server instance created. CORS for: ${frontendUrl}`
    );
  } catch (creationError) {
    console.error(
      "[Socket.IO FATAL] FAILED TO CREATE Socket.IO Server instance:",
      creationError
    );
    throw new Error(
      `Socket.IO Server creation failed: ${creationError.message}`
    );
  }

  ioInstance.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(
      `[Socket Auth] Attempting auth for socket ID: ${socket.id}. Token: ${
        token ? "Present" : "MISSING"
      }`
    );
    if (!token) {
      const err = new Error("Authentication error: No token provided.");
      err.data = { code: "NO_TOKEN" };
      return next(err);
    }
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findByPk(decoded.id, {
        attributes: ["id", "username", "profilePictureUrl", "role"],
      });
      if (!user) {
        const err = new Error(
          `Authentication error: User ${decoded.id} not found.`
        );
        err.data = { code: "USER_NOT_FOUND" };
        return next(err);
      }
      socket.user = user.toJSON();
      socket.userId = user.id.toString();
      socket.username = user.username;
      console.log(
        `[Socket Auth INFO] User ${socket.username} (ID: ${socket.userId}, Role: ${socket.user.role}) authenticated for socket ${socket.id}.`
      );
      if (!userSockets.has(socket.userId))
        userSockets.set(socket.userId, new Set());
      userSockets.get(socket.userId).add(socket.id);
      logUserSockets("Socket Middleware - User Socket Added");
      next();
    } catch (err) {
      console.error(
        `[Socket Auth FAIL] Socket ${socket.id}. Error: ${err.message}`,
        err
      );
      const authError = new Error(
        `Auth error: ${
          err.name === "TokenExpiredError"
            ? "Token expired"
            : `Invalid token (${err.name})`
        }`
      );
      authError.data = { code: "INVALID_TOKEN", reason: err.name };
      next(authError);
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = socket.userId;
    const username = socket.username;
    if (!userId || !username) {
      console.error(
        `[Socket CRITICAL] Socket ${socket.id} connected but user details missing post-auth. Disconnecting.`
      );
      socket.disconnect(true);
      return;
    }
    console.log(
      `[Socket INFO] User ${username} (ID: ${userId}, Socket ID: ${socket.id}) connection event processed.`
    );

    socket.on("joinChatRoom", async ({ roomName }, callback) => {
      console.log(
        `[Socket Event joinChatRoom] User ${username} (Socket: ${socket.id}) attempting to join: '${roomName}'`
      );
      const sendCallback = (data) => {
        if (typeof callback === "function") callback(data);
        else
          console.warn(
            `[Socket Event joinChatRoom WARN] No callback from client (Socket: ${socket.id}) for room: '${roomName}'`
          );
      };

      if (!roomName || !roomName.startsWith("project-")) {
        return sendCallback({
          success: false,
          error: "Invalid room name format.",
        });
      }
      const projectIdStr = roomName.split("-")[1];
      const projectId = parseInt(projectIdStr, 10);
      if (isNaN(projectId) || projectId <= 0) {
        return sendCallback({
          success: false,
          error: "Invalid project ID in room name.",
        });
      }

      try {
        const project = await Project.findByPk(projectId, {
          attributes: ["id", "ownerId"],
        });
        if (!project)
          return sendCallback({ success: false, error: "Project not found." });

        const isOwner = project.ownerId === parseInt(userId, 10);
        let isMember = false;
        if (!isOwner) {
          const memberRecord = await Member.findOne({
            where: {
              projectId,
              userId: parseInt(userId, 10),
              status: "active",
            },
            attributes: ["userId"],
          });
          isMember = !!memberRecord;
        }
        console.log(
          `[Socket Event joinChatRoom] Auth for project ${projectId}: User ${userId}, Owner: ${isOwner}, Member: ${isMember}, Role: ${socket.user.role}`
        );
        if (!isOwner && !isMember && socket.user.role !== "admin") {
          return sendCallback({
            success: false,
            error: "Not authorized for this project chat.",
          });
        }

        socket.join(roomName);
        console.log(
          `[Socket INFO] User ${username} (Socket: ${socket.id}) joined room: ${roomName}`
        );

        console.log(
          `[Socket Event joinChatRoom] Fetching history for project ${projectId}...`
        );
        const messagesFromDB = await Message.findAll({
          where: { projectId },
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "username", "profilePictureUrl"],
              required: false,
            },
          ],
          order: [["createdAt", "ASC"]],
          limit: 50,
        });
        console.log(
          `[Socket Event joinChatRoom] Found ${messagesFromDB.length} messages in DB for history for project ${projectId}.`
        );

        const historyForClient = messagesFromDB.map((msgInstance, index) => {
          const msg = msgInstance.toJSON();
          if (index === 0) {
            // Log details for the first message to check include
            if (msgInstance.sender)
              console.log(
                `[Socket Event joinChatRoom DEBUG] Raw msgInstance.sender (Sequelize) for 1st msg:`,
                JSON.stringify(msgInstance.sender.toJSON(), null, 2)
              );
            else
              console.log(
                `[Socket Event joinChatRoom DEBUG] Raw msgInstance.sender for 1st msg is NULL. senderId: ${msgInstance.senderId}`
              );
          }
          if (!msg.sender && msg.senderId) {
            msg.sender = {
              id: msg.senderId,
              username: `User ${msg.senderId}`,
              profilePictureUrl: null,
            };
          } else if (!msg.sender && !msg.senderId) {
            msg.sender = {
              id: null,
              username: "System/Unknown",
              profilePictureUrl: null,
            };
          } else if (msg.sender && (!msg.sender.id || !msg.sender.username)) {
            msg.sender = {
              id: msg.senderId || msg.sender.id,
              username: `User ${msg.senderId || msg.sender.id || "Error"}`,
              profilePictureUrl: msg.sender.profilePictureUrl || null,
            };
          }
          return msg;
        });

        if (historyForClient.length > 0) {
          const firstMsg = historyForClient[0];
          console.log(
            "[Socket Event joinChatRoom] DETAILED First history item for client (post-map):",
            JSON.stringify(firstMsg, null, 2)
          );
          console.log(
            "[Socket Event joinChatRoom] Type of firstMsg.sender:",
            typeof firstMsg.sender,
            "Keys:",
            firstMsg.sender ? Object.keys(firstMsg.sender) : "N/A",
            "Values:",
            firstMsg.sender
          );
        } else {
          console.log("[Socket Event joinChatRoom] historyForClient is empty.");
        }

        sendCallback({
          success: true,
          message: `Joined room ${roomName}.`,
          history: historyForClient,
        });
      } catch (error) {
        console.error(
          `[Socket Event joinChatRoom CRITICAL ERROR] User ${username} (Socket: ${socket.id}) joining ${roomName}: ${error.message}`,
          error
        );
        sendCallback({
          success: false,
          error: `Server error joining room: ${error.message}`,
        });
      }
    });

    socket.on("leaveChatRoom", ({ roomName }) => {
      if (roomName && roomName.startsWith("project-")) {
        socket.leave(roomName);
        console.log(
          `[Socket INFO] User ${username} (Socket: ${socket.id}) left room: ${roomName}`
        );
      } else {
        console.warn(
          `[Socket Event leaveChatRoom WARN] Invalid roomName '${roomName}', Socket ${socket.id}.`
        );
      }
    });

    socket.on("typing", ({ roomName }) => {
      if (roomName && socket.rooms.has(roomName)) {
        socket.to(roomName).emit("userTyping", { userId, username });
      }
    });

    socket.on("stopTyping", ({ roomName }) => {
      if (roomName && socket.rooms.has(roomName)) {
        socket.to(roomName).emit("userStopTyping", { userId });
      }
    });

    socket.on("sendMessage", async (data, callback) => {
      const tempIdFromClient = data._tempId;
      console.log(
        `[Socket Event sendMessage] User ${username} (Socket: ${socket.id}) sending. Client tempId: ${tempIdFromClient}. Data:`,
        JSON.stringify(data).substring(0, 300) + "..."
      );
      const sendCallback = (ackData) => {
        if (typeof callback === "function") callback(ackData);
        else
          console.warn(
            `[Socket Event sendMessage WARN] No callback from client (Socket: ${socket.id}) for data:`,
            data
          );
      };

      try {
        const {
          projectId,
          content,
          messageType = "text",
          fileName,
          fileUrl,
          mimeType,
          fileSize,
        } = data;
        if (!projectId)
          return sendCallback({
            success: false,
            error: "Project ID required.",
            _tempIdConfirm: tempIdFromClient,
          });

        const parsedProjectId = parseInt(projectId, 10);
        if (isNaN(parsedProjectId) || parsedProjectId <= 0) {
          return sendCallback({
            success: false,
            error: "Invalid Project ID format.",
            _tempIdConfirm: tempIdFromClient,
          });
        }
        const targetRoomName = getSocketRoomName(parsedProjectId);

        if (
          messageType === "text" &&
          (!content || String(content).trim() === "")
        ) {
          return sendCallback({
            success: false,
            error: "Message content empty.",
            _tempIdConfirm: tempIdFromClient,
          });
        }
        if (messageType === "file" && (!fileUrl || !fileName)) {
          return sendCallback({
            success: false,
            error: "File info incomplete.",
            _tempIdConfirm: tempIdFromClient,
          });
        }

        const project = await Project.findByPk(parsedProjectId, {
          attributes: ["id", "ownerId"],
        });
        if (!project)
          return sendCallback({
            success: false,
            error: "Target project not found.",
            _tempIdConfirm: tempIdFromClient,
          });

        let isAuthorized = project.ownerId === parseInt(userId, 10);
        if (!isAuthorized) {
          const memberRecord = await Member.findOne({
            where: {
              projectId: parsedProjectId,
              userId: parseInt(userId, 10),
              status: "active",
            },
          });
          isAuthorized = !!memberRecord;
        }
        console.log(
          `[Socket Event sendMessage] Auth for send: User ${userId} to Proj ${parsedProjectId}. Auth: ${isAuthorized}, Role: ${socket.user.role}`
        );
        if (!isAuthorized && socket.user.role !== "admin") {
          return sendCallback({
            success: false,
            error: "Not authorized for this project.",
            _tempIdConfirm: tempIdFromClient,
          });
        }

        let newMessageData = {
          projectId: parsedProjectId,
          senderId: parseInt(userId, 10),
          content:
            messageType === "text"
              ? String(content).trim()
              : content || `File: ${fileName}`.substring(0, 255),
          messageType: messageType,
        };
        if (messageType === "file") {
          newMessageData = {
            ...newMessageData,
            fileName,
            fileUrl,
            mimeType,
            fileSize: fileSize !== undefined ? parseInt(fileSize, 10) : null,
          };
        }

        console.log(
          "[Socket Event sendMessage] Creating Message in DB:",
          newMessageData
        );
        const newMessageInstance = await Message.create(newMessageData);
        console.log(
          `[Socket Event sendMessage INFO] Message created in DB. ID: ${newMessageInstance.id}`
        );

        const messageToSendToClients = {
          ...newMessageInstance.toJSON(),
          sender: {
            id: socket.user.id,
            username: socket.user.username,
            profilePictureUrl: socket.user.profilePictureUrl,
          },
          _tempIdConfirm: tempIdFromClient,
        };
        console.log(
          "[Socket Event sendMessage] Broadcasting 'newMessage'. Sender obj:",
          JSON.stringify(messageToSendToClients.sender)
        );

        if (targetRoomName) {
          ioInstance
            .to(targetRoomName)
            .emit("newMessage", messageToSendToClients);
          console.log(
            `[Socket INFO] Broadcasted 'newMessage' (DB ID: ${newMessageInstance.id}) to room ${targetRoomName}`
          );
        } else {
          console.error(
            `[Socket Event sendMessage CRITICAL ERROR] targetRoomName null for projectId ${parsedProjectId}. NOT BROADCASTED.`
          );
        }

        sendCallback({
          success: true,
          message: "Message processed.",
          sentMessage: messageToSendToClients,
        });
      } catch (error) {
        console.error(
          `[Socket Event sendMessage CRITICAL ERROR] User ${username} (Socket: ${socket.id}): ${error.message}`,
          error
        );
        sendCallback({
          success: false,
          error: `Server error: ${
            error.message || "Failed to process message."
          }`,
          _tempIdConfirm: tempIdFromClient,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket INFO] User ${username} (Socket: ${socket.id}) disconnected. Reason: ${reason}`
      );
      if (userSockets.has(userId)) {
        const userSocketSet = userSockets.get(userId);
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
          console.log(
            `[Socket INFO] User ${userId} no longer has active sockets.`
          );
        }
      }
      logUserSockets("Socket Disconnect - User Socket Removed/Updated");
    });

    socket.on("connect_error", (err) => {
      console.error(
        `[Socket connect_error EVENT] Socket ${socket.id} (User ${
          username || "PENDING_AUTH"
        }): ${err.message}.`
      );
    });

    socket.on("error", (err) => {
      console.error(
        `[Socket ERROR EVENT] Error on socket ${socket.id} (User ${
          username || "N/A"
        }): ${err.message}`,
        err
      );
    });
  });

  console.log(
    "[Socket.IO INFO] ✅ Socket.IO server initialized and global event handlers configured."
  );
  return ioInstance;
};

export const getIo = () => {
  if (!ioInstance) {
    console.error(
      "[Socket.IO FATAL] Attempted to get ioInstance BEFORE initSocketIO completion!"
    );
    throw new Error("Socket.io instance is not initialized!");
  }
  return ioInstance;
};

export const emitToUser = (targetUserId, eventName, data) => {
  if (!ioInstance) {
    console.warn(
      "[emitToUser WARN] Socket.IO 'ioInstance' not initialized. Cannot emit."
    );
    return false;
  }
  if (!targetUserId) {
    console.warn(`[emitToUser WARN] No targetUserId for event '${eventName}'.`);
    return false;
  }
  const userIdStr = targetUserId.toString();
  const userSocketIds = userSockets.get(userIdStr);

  if (userSocketIds && userSocketIds.size > 0) {
    const socketIdsArray = Array.from(userSocketIds);
    ioInstance.to(socketIdsArray).emit(eventName, data);
    console.log(
      `[emitToUser INFO] Emitted '${eventName}' to user ${userIdStr} (Sockets: ${socketIdsArray.join(
        ", "
      )}). Data:`,
      JSON.stringify(data).substring(0, 100) + "..."
    );
    return true;
  } else {
    console.log(
      `[emitToUser INFO] No active sockets for user ${userIdStr} for event '${eventName}'.`
    );
    return false;
  }
};
