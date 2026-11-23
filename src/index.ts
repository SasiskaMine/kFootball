import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import ejs from 'ejs';
import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();

app.use('/*', serveStatic({ root: './public' }));

app.get('/', async (c) => {
  const user = {
    name: 'АНУРОВ КИРИЛЛ',
    rating: 63,
    position: 'НАП', // ВРТ ЗАЩ УНИ ЛК ПП
    avatar: '/images/player.png',
    speed: 10,
    shot: null,
    pass: null,
    coord: 10,
    drib: null,
    power: 10,
    run_20:3.85,
    jump_length: 175,
    ideal_pass: 10,
    coordination_value: 35
  };

  const html = await ejs.renderFile('./views/index.ejs', {
    title: 'Главная',
    user,

  });

  return c.html(html);
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
