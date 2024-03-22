import License from "../models/license.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createLicense = asyncHandler(async (req, res) => {
  const {
    licenseName,
    fullName,
    brokerageName,
    brokerageAddress,
    brokerageNumber,
    agentsTelephoneNumber,
  } = req.body;

  let agentImageUrl = "";
  if (req.files?.agentImage) {
    const agentImageLocalPath = req.files.agentImage[0]?.path;
    const uploadedImage = await uploadOnCloudinary(agentImageLocalPath);
    agentImageUrl = uploadedImage?.url || "";
  }

  // Create License object and save to the database
  const license = await License.create({
    licenseName,
    fullName,
    brokerageName,
    brokerageAddress,
    brokerageNumber: parseInt(brokerageNumber, 10),
    agentsTelephoneNumber: parseInt(agentsTelephoneNumber, 10),
    agentImage: {
      url: agentImageUrl,
      localPath: req.files?.agentImage[0]?.path || "",
    },
  });

  if (!license) {
    throw new ApiError(500, "Failed to create license");
  }

  return res.status(201).json({
    success: true,
    data: license,
    message: "License created successfully",
  });
});

const getSingleLicense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const license = await License.findById(id);

  if (!license) {
    throw new ApiError(404, "License not found");
  }

  return res.status(200).json({
    success: true,
    data: license,
    message: "License retrieved successfully",
  });
});

const getAllLicenses = asyncHandler(async (req, res) => {
  const licenses = await License.find({});

  return res.status(200).json({
    success: true,
    data: licenses,
    message: "Licenses retrieved successfully",
  });
});

export { createLicense, getSingleLicense, getAllLicenses };
