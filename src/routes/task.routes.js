import { Router } from "express";
import {
  createTask,
  createTaskByUserParams,
  deleteTask,
  getAllTasks,
  getSingleTask,
  updateTask,
  getAllTasksByUserId,
} from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-task").post(upload.single("image"), createTask);
router
  .route("/create-task/:userId")
  .post(upload.single("image"), createTaskByUserParams);
router.route("/task").get(getAllTasks);
router.route("/task/:userId").get(getAllTasksByUserId);
router.route("/task/:taskId").get(getSingleTask);
router.route("/delete-task/:taskId").delete(deleteTask);
router.route("/update-task/:taskId").put(upload.single("image"), updateTask);

export default router;
