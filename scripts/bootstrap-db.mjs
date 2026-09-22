import { randomBytes, scryptSync } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = join(root, "db", "schema.sql");
const envPath = join(root, ".env");

function psqlPath() {
  const versions = ["18", "17", "16", "15"];
  for (const version of versions) {
    const file = `C:\\Program Files\\PostgreSQL\\${version}\\bin\\psql.exe`;
    if (existsSync(file)) return file;
  }
  return "";
}

function installPostgres(superPassword) {
  const result = spawnSync(
    "winget",
    [
      "install",
      "-e",
      "--id",
      "PostgreSQL.PostgreSQL.17",
      "--accept-package-agreements",
      "--accept-source-agreements",
      "--disable-interactivity",
      "--custom",
      `--mode unattended --unattendedmodeui none --superpassword ${superPassword} --serverport 5432 --enable-components server,commandlinetools`,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error("PostgreSQL installer did not finish. Allow the installer if Windows asks, then run npm run db:setup again.");
  }
}

function psql(psqlExe, superPassword, database, sql) {
  execFileSync(psqlExe, ["-h", "127.0.0.1", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    env: { ...process.env, PGPASSWORD: superPassword },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function waitForPostgres(psqlExe, superPassword) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      psql(psqlExe, superPassword, "postgres", "SELECT 1");
      return;
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
    }
  }
  throw new Error("PostgreSQL is installed but not accepting connections on localhost.");
}

function readEnv() {
  return existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
}

function upsertEnv(key, value) {
  const current = readEnv();
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const next = pattern.test(current)
    ? current.replace(pattern, line)
    : `${current.endsWith("\n") || current.length === 0 ? current : `${current}\n`}${line}\n`;
  writeFileSync(envPath, next);
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const existing = readEnv().match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
let superPassword = "";
let psqlExe = psqlPath();

if (!psqlExe) {
  superPassword = randomBytes(18).toString("hex");
  installPostgres(superPassword);
  psqlExe = psqlPath();
  if (!psqlExe) throw new Error("PostgreSQL installed, but psql.exe was not found.");
  waitForPostgres(psqlExe, superPassword);
}

let databaseUrl = existing?.replaceAll('"', "");
if (!databaseUrl) {
  if (!superPassword) {
    throw new Error("PostgreSQL is already installed. Add DATABASE_URL to .env, then run npm run db:setup again.");
  }
  const appPassword = randomBytes(18).toString("hex");
  psql(
    psqlExe,
    superPassword,
    "postgres",
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ppcc_app') THEN
         CREATE ROLE ppcc_app LOGIN PASSWORD ${sqlLiteral(appPassword)};
       END IF;
     END $$;`,
  );
  try {
    psql(psqlExe, superPassword, "postgres", "CREATE DATABASE ppcc OWNER ppcc_app");
  } catch (error) {
    const message = String(error.stderr || error.message || "");
    if (!message.includes("already exists")) throw error;
  }
  databaseUrl = `postgresql://ppcc_app:${appPassword}@127.0.0.1:5432/ppcc`;
  upsertEnv("DATABASE_URL", databaseUrl);
}

const pool = new pg.Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });
const schema = readFileSync(schemaPath, "utf8");
await pool.query(schema);

const username = "admin";
const email = "admin@ppcc.local";
const found = await pool.query("SELECT id FROM admins WHERE username = $1", [username]);
if (found.rowCount === 0) {
  const password = randomBytes(24).toString("base64url");
  await pool.query("INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3)", [
    username,
    email,
    hashPassword(password),
  ]);
  upsertEnv("PORTAL_ADMIN_USERNAME", username);
  upsertEnv("PORTAL_ADMIN_EMAIL", email);
  upsertEnv("PORTAL_ADMIN_PASSWORD", password);
  console.log("Portal admin created. Email and password were written to .env.");
} else {
  console.log("Portal admin already exists. Password in the database was left unchanged.");
}
await pool.end();
console.log("Database schema is ready.");
