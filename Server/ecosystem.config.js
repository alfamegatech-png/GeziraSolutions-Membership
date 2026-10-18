module.exports = {
  apps: [
    {
      name: "gezira-membership",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=4096",
      },
      max_memory_restart: "3500M",
      exp_backoff_restart_delay: 1000,
    },
  ],
};
