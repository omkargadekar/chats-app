// import mongoose, { Schema } from "mongoose";

// const EventSchema = new Schema(
//   {
//     title: {
//       type: String,
//       required: [true, "Please write a title for your event"],
//     },
//     start: {
//       type: Date,
//       required: [true, "Please Insert The Start of your event"],
//       min: [new Date(), "can't be before now!!"],
//     },
//     end: {
//       type: Date,
//       //setting a min function to accept any date one hour ahead of start
//       min: [
//         function () {
//           const date = new Date(this.start);
//           const validDate = new Date(date.setHours(date.getHours() + 1));
//           return validDate;
//         },
//         "Event End must be at least one hour a head of event time",
//       ],
//       default: function () {
//         const date = new Date(this.start);
//         return date.setDate(date.getDate() + 1);
//       },
//     },
//     describe: { type: String },
//   },
//   { timestamps: true }
// );
// const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

// export default Event;

import mongoose, { Schema } from "mongoose";

const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please write a title for your event"],
    },
    start: {
      type: Date,
      required: [true, "Please Insert The Start of your event"],
      // Set a minimum value of the current date and time
      min: [new Date(), "Event start can't be before now!!"],
    },
    end: {
      type: Date,
      validate: {
        validator: function (value) {
          // Ensure start is defined and value is at least one hour ahead of start
          return (
            this.start && value >= new Date(this.start.getTime() + 3600000)
          );
        },
        message: "Event End must be at least one hour ahead of the start time",
      },
      // Other properties...
    },
    describe: { type: String },
  },
  { timestamps: true }
);

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default Event;
