const fs = require("fs");
const path = require("path");

const notFoundPage = fs.readFileSync(path.join(__dirname, "404.html"));

function resolvePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  return path.join(__dirname, clean, clean.endsWith("/") ? "index.html" : "");
}

module.exports = {
  server: { baseDir: "./" },
  files: ["**/*.html", "**/*.css", "**/*.js"],
  port: 47821,
  open: false,
  middleware: [
    (req, res, next) => {
      const filePath = resolvePath(req.url);
      fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) return next();
        fs.stat(filePath + ".html", (err2) => {
          if (!err2) return next();
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(notFoundPage);
        });
      });
    },
  ],
};
