import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import ejs from 'ejs';
import { createUser, getUserByUsername } from '../modules/db.js';

const router = new Hono();

router.get('/', async (c) => {
  const html = await ejs.renderFile('./views/auth.ejs');
  return c.html(html);
});

router.post('/login', async (c) => {
  const body = await c.req.parseBody();

  const username = typeof body['username'] === 'string' ? body['username'].trim() : '';
  const password = typeof body['password'] === 'string' ? body['password'] : '';

  if (!username || !password) {
    return c.json({ error: 'Введите логин и пароль' }, 400);
  }

  const user = getUserByUsername(username);

  if (!user || user.password !== password) {
    return c.json({ error: 'Неверный логин или пароль' }, 401);
  }

  setCookie(c, 'user_id', String(user.id), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
    return c.redirect('/dashboard');
});

router.post('/register', async (c) => {
  const body = await c.req.parseBody();

  const name = typeof body['name'] === 'string' ? body['name'].trim() : '';
  const username = typeof body['username'] === 'string' ? body['username'].trim() : '';
  const password = typeof body['password'] === 'string' ? body['password'] : '';

  if (!name || !username || !password) {
    return c.json({ error: 'Заполните все поля' }, 400);
  }

  try {
    const result = createUser({
      name,
      username,
      password
    });

    const id = Number(result.lastInsertRowid);

    setCookie(c, 'user_id', String(id), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return c.json({ ok: true, id }, 201);
  } catch (err) {
    return c.json({ error: 'Такой логин уже занят' }, 409);
  }
});

router.post('/logout', (c) => {
  deleteCookie(c, 'user_id', { path: '/' });
  return c.json({ ok: true });
});

export default router;