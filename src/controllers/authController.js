const sgMail = require("@sendgrid/mail");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { v4: uuidv4 } = require("uuid");

const { User } = require("../db/userModel");
const { registration, login } = require("../services/authService");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const registrationController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const avatarURL = gravatar.url(
      email,
      { s: "250", r: "x", d: "retro" },
      false
    );
    const verificationToken = uuidv4();

    await registration(email, password, avatarURL, verificationToken);
    res.status(201).json({
      user: {
        email: email,
        subscription: "starter",
        avatarURL: avatarURL,
        verificationToken: verificationToken,
      },
    });

    const msg = {
      to: email,
      from: "aliska.nofear@gmail.com",
      subject: "Thank you for registration!",
      text: `Please, confirm your email address GET http://localhost:3000/api/users/verify/${verificationToken}`,
      html: `Please, confirm your email address GET http://localhost:3000/api/users/verify/${verificationToken}`,
    };

    await sgMail.send(msg);
  } catch (error) {
    return res.status(409).json({ message: "Email in use" });
  }
};

const verificationUserToken = async (req, res) => {
  const { verificationToken } = req.params;

  const verifyUser = await User.findOne({
    verificationToken: verificationToken,
  });

  if (verifyUser) {
    const msg = {
      to: verifyUser.email,
      from: "aliska.nofear@gmail.com",
      subject: "Thank you for registration",
      text: `Thank you for registration`,
      html: `Thank you for registration`,
    };
    await sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });

    res.status(200).json({ message: "Verification successful" });
    return await User.findByIdAndUpdate(
      { _id: verifyUser._id },
      { verificationToken: null, verify: true },
      {
        new: true,
      }
    );
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

const verifyUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "missing required field email" });
  }

  const user = await User.findOne({ email: email, verify: false });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Verification has already been passed" });
  }

  const msg = {
    to: email,
    from: "aliska.nofear@gmail.com",
    subject: "Thank you for registration!",
    text: `Please, confirm your email address GET http://localhost:3000/api/users/verify/${user.verificationToken}`,
    html: `Please, confirm your email address GET http://localhost:3000/api/users/verify/${user.verificationToken}`,
  };

  await sgMail.send(msg);
  res.status(200).json({ message: `Verification email sent to ${email}` });
};

const loginController = async (req, res) => {
  const { email, password } = req.body;

  const { token, user } = await login(email, password);
  const isVerifiedUser = await User.findOne({ _id: user._id, verify: true });

  if (!isVerifiedUser) {
    res.status(404).json({ message: "User not verified" });
  }
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
  verificationUserToken,
  verifyUser,
};
