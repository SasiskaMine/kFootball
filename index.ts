import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import ejs from 'ejs';
import { serveStatic } from '@hono/node-server/serve-static';
import dashboard from './routes/dashboard.js';
import auth from './routes/auth.js';
import admin from './routes/admin.js'

const app = new Hono();

app.use('/*', serveStatic({ root: './public' }));

app.route('/',auth)
app.route('/dashboard', dashboard)
app.route('/logout',auth);
app.route('/admin',admin);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
