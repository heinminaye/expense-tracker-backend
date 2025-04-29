import { Router } from 'express';
import auth from './routes/auth';
import expense from './routes/expense';
import category from './routes/category';

// guaranteed to get dependencies
export default () => {
	const app = Router();
	auth(app);
	category(app);
	expense(app);
	
	return app
}