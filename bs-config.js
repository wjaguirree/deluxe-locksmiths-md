const fs = require("fs");
const path = require("path");

const notFoundPage = fs.readFileSync(path.join(__dirname, "404.html"));

function resolvePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  return path.join(__dirname, clean);
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
        if (!err && stats.isDirectory()) {
          const urlPath = req.url.split("?")[0];
          if (!urlPath.endsWith("/")) {
            res.writeHead(302, { Location: urlPath + "/" });
            return res.end();
          }
          return fs.stat(path.join(filePath, "index.html"), (err2) => {
            if (!err2) return next();
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end(notFoundPage);
          });
        }
        fs.stat(filePath + ".html", (err3) => {
          if (!err3) return next();
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(notFoundPage);
        });
      });
    },
  ],
};
