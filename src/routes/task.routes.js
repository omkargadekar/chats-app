import { Router } from "express";
import {
  createTask,
  deleteTask,
  getAllTasks,
  getSingleTask,
  updateTask,
} from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-task").post(
  upload.single("image"), //  task images should be uploaded with the form field name 'image'.
  createTask
);
router.route("/task").get(getAllTasks);
router.route("/task/:taskId").get(getSingleTask);
router.route("/delete-task/:taskId").delete(deleteTask);
router.route("/update-task/:taskId").put(upload.single("image"), updateTask);

export default router;
