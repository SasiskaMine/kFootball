import { Hono } from 'hono';
import ejs from 'ejs';
import {getUserById} from '../modules/db.js';
import { getCookie } from 'hono/cookie';
const router = new Hono();

router.get('/',async (c) => {
    
});

export default router;