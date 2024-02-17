import { Router } from "express";
import {
  getAllEvents,
  getSingleEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-event").post(createEvent);

router.route("/all-events").get(getAllEvents);

router.route("/:id/show").get(getSingleEvent);

router.route("/:id/update").put(updateEvent);

router.route("/:id/delete").delete(deleteEvent);

export default router;
