const Jimp = require("jimp");
const path = require("path");
const fs = require("fs/promises");

const compressImage = async (req, res, next) => {
  const draftPath = req.file.path;
  const file = await Jimp.read(draftPath);

  const newPath = path.join("./public/avatars", req.file.filename);
  file.cover(250, 250).quality(60).writeAsync(newPath);

  req.file.path = newPath.replace(/\\/g, "/");
  req.file.destination = "./public/avatars";

  await fs.unlink(draftPath);

  next();
};

module.exports = {
  compressImage,
};
