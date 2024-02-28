import { Router } from "express";
import {
  createLicense,
  getAllLicenses,
  getSingleLicense,
} from "../controllers/license.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/add-license").post(createLicense);

router.route("/:id").get(getAllLicenses);

router.route("/:id").get(getSingleLicense);

export default router;
