import { Router } from 'express';
import auth from './routes/auth';
import expense from './routes/expense';

// guaranteed to get dependencies
export default () => {
	const app = Router();
	auth(app);
	expense(app);
	
	return app
}