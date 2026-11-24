import { Hono } from 'hono';
import ejs from 'ejs';
import {
  getUserById,
  getAllUsers,
  updateUser,
  createUser,
  calculateSpeed,
  calculatePower,
  getSetting,
  setSetting,
  type UserData
} from '../modules/db.js';
import { getCookie } from 'hono/cookie';

const router = new Hono();

router.get('/', async (c) => {
  const currentUserId = getCookie(c, 'user_id');
  const currentUser = currentUserId ? getUserById(Number(currentUserId)) : null;

  const users = getAllUsers();

  const requestedUserId = c.req.query('userId');
  let selectedUser = requestedUserId
    ? users.find((u) => u.id === Number(requestedUserId)) || null
    : null;

  if (!selectedUser && users.length > 0) {
    selectedUser = users[0];
  }

  const saved = c.req.query('saved') === '1';
  const nextWorkout = getSetting('next_workout', '11.11.26');

  const html = await ejs.renderFile('./views/admin.ejs', {
    title: 'Панель тренера | kFootball',
    users,
    selectedUser,
    currentUser,
    saved,
    nextWorkout
  });

  return c.html(html);
});

router.post('/workout', async (c) => {
  const body = await c.req.parseBody();
  const nextWorkout = typeof body['next_workout'] === 'string' ? body['next_workout'].trim() : '';
  if (nextWorkout) {
    setSetting('next_workout', nextWorkout);
  }
  const userId = body['userId'] ? `?userId=${body['userId']}&saved=1` : '?saved=1';
  return c.redirect(`/admin${userId}`);
});

router.post('/update', async (c) => {
  const body = await c.req.parseBody();

  const id = Number(body['id']);
  if (!id) {
    return c.json({ error: 'Не указан ID игрока' }, 400);
  }

  const parseNumberOrNull = (val: unknown): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const name = typeof body['name'] === 'string' ? body['name'].trim() : '';
  const position = typeof body['position'] === 'string' ? body['position'].trim() : null;
  const avatar = typeof body['avatar'] === 'string' ? body['avatar'].trim() : null;
  const rating = parseNumberOrNull(body['rating']) ?? 40;

  const run_20 = parseNumberOrNull(body['run_20']);
  const jump_length = parseNumberOrNull(body['jump_length']);
  const ideal_pass = parseNumberOrNull(body['ideal_pass']);
  const coordination_value = parseNumberOrNull(body['coordination_value']);

  let speed = parseNumberOrNull(body['speed']);
  let power = parseNumberOrNull(body['power']);
  const shot = parseNumberOrNull(body['shot']);
  const pass = parseNumberOrNull(body['pass']);
  const coord = parseNumberOrNull(body['coord']);
  const drib = parseNumberOrNull(body['drib']);

  // Если флаг авторасчета включен или значения не введены вручную:
  const autoCalc = body['auto_calc'] === '1' || body['auto_calc'] === 'true' || body['auto_calc'] === 'on';

  if ((autoCalc || speed === null) && run_20 !== null) {
    const calc = calculateSpeed(run_20);
    if (calc !== null) speed = calc;
  }

  if ((autoCalc || power === null) && jump_length !== null) {
    const calc = calculatePower(jump_length);
    if (calc !== null) power = calc;
  }

  // 10 - максимальное значение для характеристик
  const clampStat = (val: number | null): number | null => {
    if (val === null) return null;
    return Math.min(10, Math.max(0, val));
  };

  speed = clampStat(speed);
  power = clampStat(power);
  const clampedShot = clampStat(shot);
  const clampedPass = clampStat(pass);
  const clampedCoord = clampStat(coord);
  const clampedDrib = clampStat(drib);

  const updatePayload: Partial<UserData> = {
    rating,
    run_20,
    jump_length,
    ideal_pass,
    coordination_value,
    speed: speed ?? undefined,
    power,
    shot: clampedShot,
    pass: clampedPass,
    coord: clampedCoord,
    drib: clampedDrib
  };

  if (name) updatePayload.name = name;
  if (position !== null) updatePayload.position = position;
  if (avatar !== null) updatePayload.avatar = avatar;

  updateUser(id, updatePayload);

  // Если клиент запрашивает json
  const isAjax = c.req.header('accept')?.includes('application/json') || c.req.header('x-requested-with') === 'XMLHttpRequest';
  if (isAjax) {
    const updated = getUserById(id);
    return c.json({ ok: true, user: updated });
  }

  return c.redirect(`/admin?userId=${id}&saved=1`);
});

router.post('/user/create', async (c) => {
  const body = await c.req.parseBody();
  const name = typeof body['name'] === 'string' ? body['name'].trim() : '';
  const position = typeof body['position'] === 'string' ? body['position'].trim() : 'НАП';
  const username = typeof body['username'] === 'string' ? body['username'].trim() : `player_${Date.now()}`;
  const password = typeof body['password'] === 'string' ? body['password'].trim() : '123456';

  if (!name) {
    return c.json({ error: 'Имя обязательно' }, 400);
  }

  const result = createUser({
    name,
    position,
    username,
    password,
    rating: 50,
    speed: 3
  });

  const newId = Number(result.lastInsertRowid);
  return c.redirect(`/admin?userId=${newId}`);
});

export default router;
