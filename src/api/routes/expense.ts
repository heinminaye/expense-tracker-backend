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
  category_id: Joi.string().required(),  // Changed from category to category_id
  expense: Joi.number().required(),
  date: Joi.string().optional(),
  note: Joi.string().allow("").optional(),
  breakdownItems: Joi.array().items(
    Joi.object().keys({
      id: Joi.string().optional(),
      name: Joi.string().optional(),  // Made optional since category_id can be used
      category_id: Joi.string().optional(),  // Added category_id
      price: Joi.number().required(),
      quantity: Joi.number().required()
    })
  ).optional()
});

const EditExpenseSchema = Joi.object().keys({
  id: Joi.string().required(),  // Made required for edit
  user_id: Joi.string().required(),
  category_id: Joi.string().required(),  // Changed from category to category_id
  expense: Joi.number().required(),
  date: Joi.string().optional(),
  note: Joi.string().allow("").optional(),
  is_deleted: Joi.boolean().optional(),
  breakdownItems: Joi.array().items(
    Joi.object().keys({
      id: Joi.string().optional(),
      name: Joi.string().optional(),  // Made optional
      category_id: Joi.string().optional(),  // Added category_id
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
  page: Joi.number().optional(),
  category_id: Joi.string().optional()  // Added for filtering by category
});

const ExpenseDeleteSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  expense_ids: Joi.array().items(Joi.string().uuid()).min(1).required()
});

const BreakdownItemDeleteSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  breakdown_item_id: Joi.string().uuid().required()
});

export default (app: Router) => {
  app.use('/expenses', route);

  // Get expenses with breakdown
  route.post(
    "/",
    middlewares.isAuth,
    middlewares.validation(ExpenseQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const expenseServiceInstance = Container.get(ExpenseService);
        const response = await expenseServiceInstance.getExpensesWithBreakdown(req.body as IExpense);

        return res.status(response.success ? 200 : 400).json({ 
          returncode: response.success ? "200" : "300", 
          message: response.message, 
          totalPages: response.totalPages, 
          currentPage: response.currentPage, 
          totalRows: response.totalRows,
          totalAmount: response.totalAmount, 
          data: response.data 
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({ 
          returncode: "300", 
          message: "Failed to get expenses" 
        });
      }
    }
  );

  // Add expense with breakdown
  route.post(
    "/add",
    middlewares.isAuth,
    middlewares.validation(ExpenseSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const expenseServiceInstance = Container.get(ExpenseService);
        const response = await expenseServiceInstance.addExpenseWithBreakdown(req.body as IExpense);

        return res.status(response.success ? 200 : 400).json({ 
          returncode: response.success ? "200" : "300", 
          message: response.message, 
          data: response.data 
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({ 
          returncode: "300", 
          message: "Failed to add expense" 
        });
      }
    }
  );

  // Edit expense with breakdown
  route.post(
    "/edit",
    middlewares.isAuth,
    middlewares.validation(EditExpenseSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const expenseServiceInstance = Container.get(ExpenseService);
        const response = await expenseServiceInstance.editExpenseWithBreakdown(req.body as IExpense);

        return res.status(response.success ? 200 : 400).json({ 
          returncode: response.success ? "200" : "300", 
          message: response.message, 
          data: response.data 
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({ 
          returncode: "300", 
          message: "Failed to edit expense" 
        });
      }
    }
  );

  // Soft delete expenses
  route.post(
    "/delete",
    middlewares.isAuth,
    middlewares.validation(ExpenseDeleteSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const expenseServiceInstance = Container.get(ExpenseService);
        const response = await expenseServiceInstance.softDeleteExpenses(req.body as IDeleteExpenseRequest);

        return res.status(response.success ? 200 : 400).json({
          returncode: response.success ? "200" : "300",
          message: response.message
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

  // Delete single breakdown item
  route.post(
    "/breakdown/delete",
    middlewares.isAuth,
    middlewares.validation(BreakdownItemDeleteSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const expenseServiceInstance = Container.get(ExpenseService);
        const response = await expenseServiceInstance.deleteBreakdownItem(
          req.body.breakdown_item_id, 
          req.body.user_id
        );

        return res.status(response.success ? 200 : 400).json({
          returncode: response.success ? "200" : "300",
          message: response.message
        });
      } catch (e) {
        console.error(e);
        return res.status(500).json({
          returncode: "300",
          message: "Failed to delete breakdown item"
        });
      }
    }
  );
};