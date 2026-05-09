// PM2 Ecosystem Config — planprom on VPS
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 reload ecosystem.config.js --update-env
//   pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: "planprom",
      script: ".next/standalone/server.js",
      cwd: "/var/www/planprom",

      instances: 1,
      exec_mode: "fork",

      node_args: "--max-old-space-size=600",

      watch: false,
      max_memory_restart: "1G",
      min_uptime: "30s",
      restart_delay: 3000,
      max_restarts: 10,

      out_file: "/var/log/planprom/out.log",
      error_file: "/var/log/planprom/error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      log_type: "json",

      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: "103.52.109.85",
      ref: "origin/main",
      repo: "git@github.com:yopinm/planprom.git",
      path: "/var/www/planprom",
      "post-deploy":
        "npm ci && npm run build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public && pm2 reload ecosystem.config.js --update-env && pm2 save",
      "pre-setup": "mkdir -p /var/log/planprom",
    },
  },
};
