// ===================================================================
// k6 Load Testing Script for Student Apps Al-Azhar Cairo Palembang
// Merujuk ke plan-update-.md Bagian 5.2 & Fase 4 Task 4.2
// Jalankan dengan: k6 run -e BASE_URL=http://localhost:3000 test/load/smoke-test.js
// ===================================================================

import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 50 },    // Ramp up ke 50 pengguna bersamaan
    { duration: "2m", target: 200 },   // Naik ke 200 concurrent users
    { duration: "3m", target: 500 },   // Beban reguler jam sekolah 500 users
    { duration: "2m", target: 1500 },  // Puncak ujian / absensi serentak 1500 users
    { duration: "2m", target: 1500 },  // Tahan di 1500 users
    { duration: "1m", target: 0 },     // Ramp down kembali ke 0
  ],
  thresholds: {
    // 95% request harus selesai di bawah 2 detik
    http_req_duration: ["p(95)<2000"],
    // Error rate maksimal di bawah 1%
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // 1. Health Probe
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "health check 200 OK": (r) => r.status === 200,
    "health latency < 200ms": (r) => r.timings.duration < 200,
  });

  // 2. Login Page Access
  const loginPageRes = http.get(`${BASE_URL}/login`);
  check(loginPageRes, {
    "login page 200 OK": (r) => r.status === 200,
    "login page latency < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 2 + 1);
}
