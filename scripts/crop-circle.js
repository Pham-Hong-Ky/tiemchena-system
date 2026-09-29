/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const srcPath = path.resolve(
  "C:/Users/ADMIN88/.gemini/antigravity-ide/brain/fd1bc0bd-13b9-41f8-9872-1a7fec1aaacc/.user_uploaded/media_1790661468172.png"
);

fs.createReadStream(srcPath)
  .pipe(new PNG({ filterType: 4 }))
  .on("parsed", function () {
    const width = this.width;
    const height = this.height;
    const centerX = width / 2;
    const centerY = height / 2;
    // Radius of the circle (minus 1px padding for clean border)
    const radius = Math.min(centerX, centerY) - 1.5;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radius + 1) {
          // Completely transparent
          this.data[idx + 3] = 0;
        } else if (dist > radius - 1) {
          // Anti-aliasing edge
          const factor = (radius + 1 - dist) / 2;
          this.data[idx + 3] = Math.round(this.data[idx + 3] * Math.max(0, Math.min(1, factor)));
        }
      }
    }

    const destinations = [
      path.resolve("public/logo.png"),
      path.resolve("public/icon.png"),
      path.resolve("public/favicon.ico"),
      path.resolve("src/app/icon.png"),
      path.resolve("src/app/apple-icon.png"),
      path.resolve("src/app/favicon.ico"),
    ];

    const buffer = PNG.sync.write(this);

    destinations.forEach((dest) => {
      fs.writeFileSync(dest, buffer);
      console.log(`Saved circular icon to: ${dest}`);
    });
    console.log("SUCCESS");
  })
  .on("error", function (err) {
    console.error("Error processing image:", err);
  });
