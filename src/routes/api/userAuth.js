const express = require("express");
const {
  registrationController,
  loginController,
  logoutController,
  currentUserController,
  changeAvatarController,
  verificationUserToken,
  verifyUser,
} = require("../../controllers/authController");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { compressImage } = require("../../middlewares/compressMiddleware");
const { uploadMiddleware } = require("../../middlewares/uploadMiddleware");
const { authValidation } = require("../../middlewares/validationMiddleware");
const router = new express.Router();

router.post("/register", authValidation, registrationController);
router.get("/verify/:verificationToken", verificationUserToken);
router.post("/verify", verifyUser);
router.post("/login", authValidation, loginController);
router.post("/logout", authMiddleware, logoutController);
router.post("/current", authMiddleware, currentUserController);
router.patch(
  "/avatars",
  authMiddleware,
  uploadMiddleware.single("avatar"),
  compressImage,
  changeAvatarController
);

module.exports = { authRouter: router };
