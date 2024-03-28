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

router.route("/all-events/:userId").get(getAllEvents);

router.route("/:eventId/show").get(getSingleEvent);

router.route("/:eventId/update").put(updateEvent);

router.route("/:eventId/delete").delete(deleteEvent);

export default router;
