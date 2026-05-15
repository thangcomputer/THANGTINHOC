/** PM2 - chay tu thu muc goc repo: pm2 start deploy/ecosystem.config.cjs */
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
      env: { NODE_ENV: "production", PORT: 5000 },
    },
  ],
};
