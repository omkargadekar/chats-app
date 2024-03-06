import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    textContent: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Started Working",
        "Completed Backend",
        "Completed Backend Testing",
        "Completed Frontend Testing",
        "Integration Completed",
      ],
      default: "Started Working",
    },
    completionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;
