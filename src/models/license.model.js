import mongoose from "mongoose";

const licenseSchema = new mongoose.Schema(
  {
    licenseName: {
      type: String,
    },
    fullName: {
      type: String,
    },
    brokerageName: {
      type: String,
    },
    brokerageAddress: {
      type: String,
    },
    brokerageNumber: {
      type: Number,
    },
    agentsTelephoneNumber: {
      type: Number,
    },
    agentImage: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: `https://via.placeholder.com/200x200.png`,
        localPath: "",
      },
    },
  },
  { timestamps: true }
);

const License = mongoose.model("License", licenseSchema);
export default License;
