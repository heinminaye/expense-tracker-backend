import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { Joi } from 'celebrate';
import middlewares from '../middlewares';
import CategoryService from '../../services/category';
import { ICategory } from '../../interfaces/category';

const route = Router();

const CategorySchema = Joi.object().keys({ 
  user_id: Joi.string().required(),  
  name: Joi.string().required(),
  parentId: Joi.string().optional().allow(null),
});

export default (app: Router) => {
    app.use('/categories', route);

    route.post(
        '/',
        middlewares.isAuth,
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const categoryServiceInstance = Container.get(CategoryService);
                const response = await categoryServiceInstance.getCategories(req.body as { user_id: string });
        
                return res.status(response.success ? 200 : 400).json({
                    returncode: response.success ? "200" : "300",
                    message: response.message,
                    data: response.data
                });
            } catch (e) {
                console.error(e);
                return res.status(500).json({ 
                  returncode: "300", 
                  message: "Failed to get categories" 
                });
            }
        }
    );

    route.post(
        '/add',
        middlewares.isAuth,
        middlewares.validation(CategorySchema),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const categoryServiceInstance = Container.get(CategoryService);
                const response = await categoryServiceInstance.addCategory(req.body as ICategory);
        
                return res.status(response.success ? 201 : 400).json({
                    returncode: response.success ? "200" : "300",
                    message: response.message,
                    data: response.data
                });
            } catch (e) {
                console.error(e);
                return res.status(500).json({ 
                    returncode: "300", 
                    message: "Failed to add category" 
                  });
            }
        }
    );
}