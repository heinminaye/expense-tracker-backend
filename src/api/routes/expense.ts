import { Router, Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import ExpenseService from "../../services/expense";
import middlewares from "../middlewares";
import { IExpense, IBreakdownItem, IDeleteExpenseRequest } from "../../interfaces/expense";
import { Joi } from "celebrate";

const route = Router();

// Joi Schemas for validation
const ExpenseSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  category: Joi.string().required(),
  expense: Joi.number().required(),
  date: Joi.string().optional(),
  note: Joi.string().allow("").optional(),
  breakdownItems: Joi.array().items(
    Joi.object().keys({
      name: Joi.string().required(),
      price: Joi.number().required(),
      quantity: Joi.number().required()
    })
  ).optional()
});

const ExpenseQuerySchema = Joi.object().keys({
  user_id: Joi.string().required(),
  search_value: Joi.string().optional().allow(''),
  date_type: Joi.string().optional(),
  start_date: Joi.string().optional(),
  end_date: Joi.string().optional(),
  page: Joi.number().optional()
});

const ExpenseDeleteSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  expense_ids: Joi.array().items(Joi.string().uuid()).min(1).required()
});

export default (app: Router) => {
  app.use('/expenses', route);

  route.post(
    "/",
    middlewares.isAuth,
    middlewares.validation(ExpenseQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const expenseServiceInstance = Container.get(ExpenseService);
        const { success, message, totalPages, currentPage,totalRows, totalAmount, data } =
          await expenseServiceInstance.getExpensesWithBreakdown(req.body as IExpense);

        return res.json({ 
          returncode: success ? "200" : "300", 
          message, 
          totalPages, 
          currentPage, 
          totalRows,
          totalAmount, 
          data 
        }).status(200);
      } catch (e) {
        console.log(e);
        return res.json({ returncode: "300", message: "Failed to get expenses" }).status(500);
      }
    }
  );

  route.post(
    "/add",
    middlewares.isAuth,
    middlewares.validation(ExpenseSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const expenseServiceInstance = Container.get(ExpenseService);
        const { success, message, data } =
          await expenseServiceInstance.addExpenseWithBreakdown(req.body as IExpense);

        return res.json({ 
          returncode: success ? "200" : "300", 
          message, 
          data 
        }).status(success ? 200 : 400);
      } catch (e) {
        console.log(e);
        return res.json({ returncode: "300", message: "Failed to add expense" }).status(500);
      }
    }
  );

  route.post(
    "/delete",
    middlewares.isAuth,
    middlewares.validation(ExpenseDeleteSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const expenseServiceInstance = Container.get(ExpenseService);
  
        const { success, message } = await expenseServiceInstance.softDeleteExpenses(req.body as IDeleteExpenseRequest);
  
        return res.status(success ? 200 : 400).json({
          returncode: success ? "200" : "300",
          message
        });
      } catch (e) {
        console.error(e);
        return res.status(500).json({
          returncode: "300",
          message: "Failed to delete expenses"
        });
      }
    }
  );
};