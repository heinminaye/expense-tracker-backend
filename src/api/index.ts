import { Router } from 'express';
import auth from './routes/auth';
import user from './routes/user';
import inventory from './routes/inventory'
import retail from './routes/retail';

// guaranteed to get dependencies
export default () => {
	const app = Router();
	auth(app);
	user(app);
	inventory(app);
	retail(app);
	
	return app
}