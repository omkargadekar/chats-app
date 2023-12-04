import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // if (!avatarLocalPath) {
  //     throw new ApiError(400, "Avatar file is required")
  // }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log(avatar);

  // if (!avatar) {
  //     throw new ApiError(400, "Avatar file is required")
  // }

  const user = await User.create({
    fullName,
    avatar: avatar.url || avatar, //avatar.url
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user exists: email
  // check if password matches
  // generate and store a new refresh token
  // remove password field from response
  // return res

  const { email, password } = req.body;

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate and store a new refresh token
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();

  // Generate access token
  const accessToken = user.generateAccessToken();

  // Remove sensitive fields from the response
  const userWithoutSensitiveInfo = {
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar,
    watchHistory: user.watchHistory,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userWithoutSensitiveInfo,
        accessToken,
        refreshToken,
      },
      "User logged in successfully"
    )
  );
});

export { registerUser, loginUser };
