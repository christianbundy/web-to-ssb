const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { JSDOM } = require("jsdom");
const crossSpawn = require("cross-spawn");

function main(filePath, depth = 0) {
  const html = fs.readFileSync(filePath, "utf8");
  const dom = new JSDOM(html);
  dom.window.document.querySelectorAll("a").forEach((a) => {
    a.href = main(path.join(filePath, "..", a.href), depth + 1);
  });

  const result = dom.serialize();
  const hash = crypto.createHash("sha256").update(result).digest();

  const outPath = path.join(__dirname, "build", hash.toString("hex"));
  fs.writeFileSync(outPath, result);
  crossSpawn.sync("ssb-server", ["blobs.add", outPath]);
  const ssbLink = `&${hash.toString("base64")}.sha256`;

  if (depth === 0) {
    console.log(ssbLink);
  }

  return encodeURIComponent(ssbLink);
}

module.exports = main;

if (module.parent == null) {
  try {
    fs.mkdirSync(path.join(__dirname, "build"));
  } catch (e) {
    const ignored = "EEXIST";
    if (e.code !== ignored) {
      throw e;
    }
  }
  const index = path.join(__dirname, "example", "index.html");
  module.exports(index);
}
