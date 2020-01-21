const { isAbsolute, resolve, normalize } = require("path");

module.exports = function getAbsolutePath(path, directoryPath) {
  if (isAbsolute(path)) {
    return normalize(path);
  }

  return resolve(directoryPath, path);
};
