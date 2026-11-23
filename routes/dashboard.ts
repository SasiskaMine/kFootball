import { Hono } from 'hono';
import ejs from 'ejs';
import {getUserById} from '../modules/db.js';
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
  /*const user = {
    name: 'АНУРОВ КИРИЛЛ',
    rating: 63,
    position: 'НАП',
    avatar: '/images/player.png',
    speed: 10,
    shot: null,
    pass: null,
    coord: 10,
    drib: null,
    power: 10,
    run_20: 3.85,
    jump_length: 175,
    ideal_pass: 10,
    coordination_value: 35
  }; */

  const html = await ejs.renderFile('./views/dashboard.ejs', {
    title: 'Главная',
    user: safeUser,
  });

  return c.html(html);
});

export default router;
