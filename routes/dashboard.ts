import { Hono } from 'hono';
import ejs from 'ejs';
import { getUserById, getSetting } from '../modules/db.js';
import { getCookie } from 'hono/cookie';

const router = new Hono();

router.get('/', async (c) => {
  const userId = getCookie(c, 'user_id');
  if (!userId) {
    return c.redirect('/login');
  }
  const user = getUserById(Number(userId)); 
  if (!user) {
    return c.redirect('/login');
  }
  const { password, ...safeUser } = user;

  const clampPercent = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 0;
    return Math.min(100, Math.max(0, Math.round(Number(val) * 10)));
  };

  const userWithPercents = {
    ...safeUser,
    speedPercent: clampPercent(safeUser.speed),
    powerPercent: clampPercent(safeUser.power),
    shotPercent: clampPercent(safeUser.shot),
    passPercent: clampPercent(safeUser.pass),
    coordPercent: clampPercent(safeUser.coord),
    dribPercent: clampPercent(safeUser.drib)
  };

  const nextWorkout = getSetting('next_workout', '11.11.26');

  const html = await ejs.renderFile('./views/dashboard.ejs', {
    title: 'Главная | kFootball',
    user: userWithPercents,
    nextWorkout,
  });

  return c.html(html);
});

export default router;
