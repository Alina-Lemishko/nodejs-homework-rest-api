const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { User } = require("../db/userModel");
const { registration, login } = require("../services/authService");

const registrationController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const avatarURL = gravatar.url(
      email,
      { s: "250", r: "x", d: "retro" },
      false
    );

    await registration(email, password, avatarURL);
    return res.status(201).json({
      user: {
        email: email,
        subscription: "starter",
        avatarURL: avatarURL,
      },
    });
  } catch (error) {
    return res.status(409).json({ message: "Email in use" });
  }
};

const loginController = async (req, res) => {
  const { email, password } = req.body;

  const { token, user } = await login(email, password);
  await User.findByIdAndUpdate({ _id: user._id }, { token: token });
  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
      avatarURL: user.avatarURL,
    },
  });
};

const logoutController = async (req, res) => {
  const token = await req.token;
  const user = jwt.decode(token, process.env.JWT_SECRET);

  if (token) {
    await User.findByIdAndUpdate({ _id: user._id }, { token: null });
    res.status(204).json({ message: "No Content" });
  } else {
    res.status(401).json({ message: "Not authorized" });
  }
};

const currentUserController = async (req, res) => {
  const token = await req.token;
  const user = jwt.decode(token, process.env.JWT_SECRET);
  const isUser = await User.find({ _id: user._id, token: token });
  console.log("req.user", req.user);
  if (isUser.length > 0) {
    return res.status(200).json({
      email: req.user.email,
      subscription: req.user.subscription,
      avatarURL: req.user.avatarURL,
    });
  } else {
    return res.status(401).json({ message: "Not authorized" });
  }
};

const changeAvatarController = async (req, res) => {
  const token = await req.token;
  const user = jwt.decode(token, process.env.JWT_SECRET);
  const { path } = req.file;
  if (token) {
    await User.findByIdAndUpdate(
      { _id: user._id },
      { avatarURL: path.replace(/\\/g, "/") }
    );
    res.status(200).json({ avatarURL: `${path}` });
  } else {
    res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = {
  registrationController,
  loginController,
  logoutController,
  currentUserController,
  changeAvatarController,
};
