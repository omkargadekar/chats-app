import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createTask = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id; // Extracted from JWT after successful verification
    const { textContent, status, completionPercentage } = req.body;
    let imageUrl = ""; // Default value in case there's no image

    // Validate required fields
    if (!textContent || !status || !completionPercentage) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // Handle image upload if file is present
    if (req.file) {
      const localFilePath = req.file.path; // Path where multer temporarily stores the file
      const uploadResponse = await uploadOnCloudinary(localFilePath); // Upload the image to Cloudinary
      if (uploadResponse && uploadResponse.url) {
        imageUrl = uploadResponse.url; // Use the URL from the Cloudinary response
      } else {
        return res
          .status(500)
          .json({ message: "Failed to upload image to Cloudinary." });
      }
    }

    // Create the task with the provided details and the image URL (if any)
    const task = await Task.create({
      userId,
      textContent,
      imageUrl,
      status,
      completionPercentage,
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating task", error: error.message });
  }
});

const getAllTasks = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ userId });
    res.status(200).json(tasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
});

const updateTask = asyncHandler(async (req, res) => {
  try {
    const { taskId } = req.params;
    const { textContent, status, completionPercentage } = req.body;
    let updateData = { textContent, status, completionPercentage };

    // Optionally handle image replacement
    if (req.file) {
      const localFilePath = req.file.path;
      const uploadResponse = await uploadOnCloudinary(localFilePath);
      if (uploadResponse && uploadResponse.url) {
        updateData.imageUrl = uploadResponse.url;
      } else {
        return res
          .status(500)
          .json({ message: "Failed to upload new image to Cloudinary." });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
    });
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res
      .status(200)
      .json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating task", error: error.message });
  }
});

const deleteTask = asyncHandler(async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting task", error: error.message });
  }
});

export { createTask, getAllTasks, deleteTask, updateTask };
