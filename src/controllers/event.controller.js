import Event from "../models/event.model.js";

async function getAllEvents(req, res) {
  const { userId } = req.params;
  try {
    const events = await Event.find({ userId });
    res.status(200).json(events);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching events", error: err.message });
  }
}

async function getSingleEvent(req, res) {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching event", error: err.message });
  }
}

async function createEvent(req, res) {
  const { userId, title, start, end, describe } = req.body;
  const newEvent = new Event({ userId, title, start, end, describe });
  try {
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating event", error: err.message });
  }
}

async function updateEvent(req, res) {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.eventId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(updatedEvent);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating event", error: err.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.eventId);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting event", error: err.message });
  }
}

export { getAllEvents, getSingleEvent, createEvent, updateEvent, deleteEvent };
