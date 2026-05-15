const path = require("path");

module.exports = {
  apps: [
    {
      name: "thangtinhoc-api",
      cwd: path.join(__dirname, "..", "server"),
      script: "index.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env_file: path.join(__dirname, "..", "server", ".env"),
    },
  ],
};