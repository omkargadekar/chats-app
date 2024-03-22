import bcrypt from "bcrypt";
import { newUser } from "../models/newUser.model.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await newUser.create({
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await newUser.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const user = await newUser.findById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updatedUser = await newUser.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await newUser.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
