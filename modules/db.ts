import { DatabaseSync } from 'node:sqlite';

export interface UserData {
  name: string;
  username?: string | null;
  password?: string | null;
  rating?: number;
  position?: string | null;
  avatar?: string | null;
  speed?: number;
  shot?: number | null;
  pass?: number | null;
  coord?: number | null;
  drib?: number | null;
  power?: number | null;
  run_20?: number | null;
  jump_length?: number | null;
  ideal_pass?: number | null;
  coordination_value?: number | null;
}

const db = new DatabaseSync('./data.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    password TEXT,
    rating INTEGER DEFAULT 40,
    position TEXT,
    avatar TEXT,
    speed INTEGER DEFAULT 3,
    shot INTEGER,
    pass INTEGER,
    coord INTEGER,
    drib INTEGER,
    power INTEGER,
    run_20 REAL,
    jump_length INTEGER,
    ideal_pass INTEGER,
    coordination_value INTEGER
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

const insertUserStmt = db.prepare(`
  INSERT INTO users (
    name, username, password, rating, position, avatar, speed,
    shot, pass, coord, drib, power, run_20, jump_length, ideal_pass, coordination_value
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function createUser(user: UserData) {
  return insertUserStmt.run(
    user.name,
    user.username ?? null,
    user.password ?? null,
    user.rating ?? 40,
    user.position ?? null,
    user.avatar ?? null,
    user.speed ?? 3,
    user.shot ?? null,
    user.pass ?? null,
    user.coord ?? null,
    user.drib ?? null,
    user.power ?? null,
    user.run_20 ?? null,
    user.jump_length ?? null,
    user.ideal_pass ?? null,
    user.coordination_value ?? null
  );
}

const allowedFields: (keyof UserData)[] = [
  'name', 'username', 'password', 'rating', 'position', 'avatar',
  'speed', 'shot', 'pass', 'coord', 'drib', 'power',
  'run_20', 'jump_length', 'ideal_pass', 'coordination_value'
];

export function updateUser(id: number, data: Partial<UserData>) {
  const entries = Object.entries(data).filter(
    ([key, value]) => allowedFields.includes(key as keyof UserData) && value !== undefined
  );

  if (entries.length === 0) return;

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, value]) => value);

  const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
  return stmt.run(...values, id);
}
const getUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');

export function getUserByUsername(username: string) {
  return getUserByUsernameStmt.get(username) as (UserData & { id: number }) | undefined;
}
const getUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');

export function getUserById(id: number) {
  return getUserByIdStmt.get(id) as (UserData & { id: number }) | undefined;
}


export function calculateSpeed(run20: number | null | undefined): number | null {
  if (run20 === null || run20 === undefined || isNaN(Number(run20)) || Number(run20) <= 0) {
    return null;
  }
  const time = Number(run20);
  const score = (4 / time) * 10;
  const rounded = Math.round(score * 10) / 10;
  return Math.min(10, Math.max(0, rounded));
}

export function calculatePower(jumpLength: number | null | undefined): number | null {
  if (jumpLength === null || jumpLength === undefined || isNaN(Number(jumpLength)) || Number(jumpLength) <= 0) {
    return null;
  }
  let length = Number(jumpLength);
  // Если ввели в метрах (например 1.65 или 1.7), переводим в сантиметры
  if (length <= 5) {
    length = length * 100;
  }
  const benchmark = 165; // ориентир 165 см
  const score = (length / benchmark) * 10;
  const rounded = Math.round(score * 10) / 10;
  return Math.min(10, Math.max(0, rounded));
}

const getAllUsersStmt = db.prepare('SELECT * FROM users ORDER BY id ASC');

export function getAllUsers() {
  return getAllUsersStmt.all() as unknown as (UserData & { id: number })[];
}

const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?');

export function deleteUser(id: number) {
  return deleteUserStmt.run(id);
}

const getSettingStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
const setSettingStmt = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

export function getSetting(key: string, defaultValue: string = ''): string {
  const row = getSettingStmt.get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

export function setSetting(key: string, value: string) {
  return setSettingStmt.run(key, value);
}

export default db;