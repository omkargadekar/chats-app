import { Router } from "express";
import {
  registerUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
} from "../controllers/newUser.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Auth routes
router.route("/register").post(registerUser);

router.use(verifyJWT);

// User CRUD routes
router.route("/all-users").get(getAllUsers);

router.route("/:id").get(getSingleUser);

router.route("/:id").put(updateUser);

router.route("/:id").delete(deleteUser);

export default router;
