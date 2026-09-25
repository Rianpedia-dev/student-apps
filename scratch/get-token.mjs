import { SignJWT } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "alazharsdsecretkey2026modernrebuild_at_least_32_chars_long!!"
);

async function run() {
  const token = await new SignJWT({
    id: "19",
    name: "Muhammad Rayhan",
    email: "siswa1@gmail.com",
    role: "siswa",
    status: "1",
    kelas: "Kelas 4 - Mehmed Al Fatih",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  console.log("TOKEN:" + token);
}

run();
