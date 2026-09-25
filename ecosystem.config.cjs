module.exports = {
  apps: [
    {
      name: "student-apps",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "student-apps-socket",
      script: "socket-server.cjs",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        SOCKET_PORT: 3001,
      },
    },
  ],
};
