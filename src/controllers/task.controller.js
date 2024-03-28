import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getColor = (status) => {
  switch (status) {
    case "Completed":
      return "#008000";
    case "InComplete":
      return "#FF0000";
    case "InProcess":
      return "#FFA500";
    default:
      return "Unknown";
  }
};

const createTask = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { textContent, status } = req.body;

    let imageUrl = "";

    if (!textContent || !status) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    if (req.file) {
      const localFilePath = req.file.path;
      const uploadResponse = await uploadOnCloudinary(localFilePath);
      if (uploadResponse && uploadResponse.url) {
        imageUrl = uploadResponse.url;
      } else {
        return res
          .status(500)
          .json({ message: "Failed to upload image to Cloudinary." });
      }
    }

    const task = await Task.create({
      userId,
      textContent,
      imageUrl,
      status,
      color: getColor(status),
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
    console.log(userId);
    const tasks = await Task.find({ userId });
    res.status(200).json(tasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
});
const getAllTasksByUserId = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
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
    const { textContent, status } = req.body;
    let updateData = { textContent, status, color: getColor(status) };

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

const getSingleTask = asyncHandler(async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching task", error: error.message });
  }
});

export {
  createTask,
  getAllTasks,
  deleteTask,
  updateTask,
  getSingleTask,
  getAllTasksByUserId,
};
