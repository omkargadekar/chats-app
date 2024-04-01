import { Router } from "express";

import {
  allMessages,
  sendMessage,
} from "../controllers/dashMessage.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);

export default router;
