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
      script: "server/socket-server.cjs",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      // Catatan: server socket memuat berkas .env di root proyek sendiri, sehingga
      // AUTH_SECRET otomatis identik dengan aplikasi Next.js. Tidak perlu diduplikasi
      // ke sini, kecuali bila Anda ingin nilainya berbeda dari .env.
      env: {
        NODE_ENV: "production",
        SOCKET_PORT: 3001,
      },
    },
  ],
};
