import { IExpense, IBreakdownItem, IDeleteExpenseRequest } from "../interfaces/expense";
import { IUser } from "../interfaces/user";
import { Sequelize, Op, Transaction } from "sequelize";
import sequelize from "../sequelize";
import { v4 as uuidv4 } from "uuid";
import dateFormat from "dateformat";
import { Service, Inject } from "typedi";

@Service()
export default class ExpenseService {
  private readonly itemsPerPage: number = 10;

  constructor(
    @Inject("userModel") private userModel: any,
    @Inject("expenseModel") private expenseModel: any,
    @Inject("breakdownItemModel") private breakdownModel: any,
    @Inject("categoryModel") private categoryModel: any
  ) {}

  /**
   * Get expenses with their breakdown items
   */
  public async getExpensesWithBreakdown(
    expenseData: IExpense
  ): Promise<{
    success: boolean;
    message: string;
    totalPages?: number;
    currentPage?: number;
    totalRows?: number;
    totalAmount?: number;
    data?: IExpense[];
  }> {
    let transaction: Transaction | null = null;
    try {
      transaction = await sequelize.transaction();
      
      // Validate user exists
      const user = await this.userModel.services.findOne({
        where: { user_id : expenseData.user_id, is_deleted: false },
        transaction
      });
      if (!user) {
        await transaction.rollback();
        return { success: false, message: "User not found" };
      }

      const where: any = { 
        user_id: expenseData.user_id,
        is_deleted: false 
      };
      
      if (expenseData.search_value) {
        where[Op.or] = [
          { '$category.name$': { [Op.iLike]: `%${expenseData.search_value}%` } },
          { note: { [Op.iLike]: `%${expenseData.search_value}%` } }
        ];
      }

      // Date filtering
      if (expenseData.start_date && expenseData.end_date) {
        where.date = {
          [Op.between]: [expenseData.start_date, expenseData.end_date]
        };
      } else if (expenseData.date) {
        where.date = expenseData.date;
      }

      // Get total count and amount
      const totalRows = await this.expenseModel.services.count({ 
        where,
        include: [{
          model: this.categoryModel.services,
          as: 'category',
          attributes: []
        }],
        transaction 
      });
      
      const totalAmountResult = await this.expenseModel.services.findOne({
        where,
        include: [{
          model: this.categoryModel.services,
          as: 'category',
          attributes: []
        }],
        attributes: [
          [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('expense')), 0), 'total']
        ],
        raw: true,
        transaction
      });
      const totalAmount = parseFloat(totalAmountResult?.total) || 0;

      // Pagination
      const offset = expenseData.page ? (expenseData.page - 1) * this.itemsPerPage : 0;
      const limit = this.itemsPerPage;

      // Get expenses with category
      const expenses = await this.expenseModel.services.findAll({
        where,
        include: [{
          model: this.categoryModel.services,
          as: 'category',
          attributes: ['id', 'name']
        }],
        order: [['date', 'DESC']],
        offset,
        limit,
        transaction
      });

      if (!expenses.length) {
        await transaction.commit();
        return { 
          success: true, 
          message: "No expenses found",
          totalPages: 0,
          currentPage: expenseData.page || 1,
          totalRows: 0,
          totalAmount: 0,
          data: []
        };
      }

      // Get breakdown items for all expenses
      const expenseIds = expenses.map((exp: any) => exp.id);
      const breakdownItems = await this.breakdownModel.services.findAll({
        where: { 
          expense_id: expenseIds
        },
        include: [{
          model: this.categoryModel.services,
          as: 'category',
          attributes: ['id', 'name']
        }],
        transaction
      });

      // Group breakdown items by expense_id
      const breakdownMap = breakdownItems.reduce((map: any, item: any) => {
        if (!map[item.expense_id]) {
          map[item.expense_id] = [];
        }
        map[item.expense_id].push({
          id: item.id,
          name: item.name || item.category?.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          category_id: item.category_id,
          category: item.category ? {
            id: item.category.id,
            name: item.category.name
          } : null
        });
        return map;
      }, {});

      // Format response
      const formattedExpenses = expenses.map((expense: any) => ({
        id: expense.id,
        category_id: expense.category_id,
        category: expense.category ? {
          id: expense.category.id,
          name: expense.category.name
        } : null,
        expense: expense.expense,
        date: expense.date,
        note: expense.note,
        is_deleted: expense.is_deleted,
        user_id: expense.user_id,
        breakdownItems: breakdownMap[expense.id] || []
      }));

      await transaction.commit();
      return {
        success: true,
        message: "Expenses retrieved successfully",
        totalPages: Math.ceil(totalRows / this.itemsPerPage),
        currentPage: expenseData.page || 1,
        totalRows: totalRows,
        totalAmount,
        data: formattedExpenses
      };

    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error in getExpensesWithBreakdown:", error);
      return { success: false, message: "Failed to retrieve expenses" };
    }
  }

  /**
   * Add expense with breakdown items
   */
  public async addExpenseWithBreakdown(
    expenseData: IExpense
  ): Promise<{
    success: boolean;
    message: string;
    data?: IExpense;
  }> {
    let transaction: Transaction | null = null;
    try {
      transaction = await sequelize.transaction();

      // Validate user exists
      const user = await this.userModel.services.findOne({
        where: { user_id : expenseData.user_id, is_deleted: false },
        transaction
      });
      if (!user) {
        await transaction.rollback();
        return { success: false, message: "User not found" };
      }

      // Validate category exists if provided
      if (expenseData.category_id) {
        const category = await this.categoryModel.services.findOne({
          where: { id: expenseData.category_id, is_deleted: false },
          transaction
        });
        if (!category) {
          await transaction.rollback();
          return { success: false, message: "Category not found" };
        }
      }

      // Create expense
      const expenseId = uuidv4();
      const newExpense = await this.expenseModel.services.create({
        id: expenseId,
        user_id: expenseData.user_id,
        category_id: expenseData.category_id,
        expense: expenseData.expense,
        date: expenseData.date || dateFormat(new Date(), "yyyy-mm-dd"),
        note: expenseData.note,
        is_deleted: false
      }, { transaction });

      // Add breakdown items if they exist
      let breakdownItems: IBreakdownItem[] = [];
      if (expenseData.breakdownItems && expenseData.breakdownItems.length > 0) {
        // Validate breakdown item categories if provided
        for (const item of expenseData.breakdownItems) {
          if (item.category_id) {
            const category = await this.categoryModel.services.findOne({
              where: { id: item.category_id, is_deleted: false },
              transaction
            });
            if (!category) {
              await transaction.rollback();
              return { success: false, message: `Category not found for breakdown item: ${item.name}` };
            }
          }
        }

        const breakdownToCreate = expenseData.breakdownItems.map(item => ({
          id: uuidv4(),
          expense_id: expenseId,
          category_id: item.category_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }));

        await this.breakdownModel.services.bulkCreate(breakdownToCreate, { transaction });
        
        // Get created items for response
        breakdownItems = breakdownToCreate.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category_id: item.category_id
        }));
      }

      // Get the category for response
      const category = expenseData.category_id ? await this.categoryModel.services.findOne({
        where: { id: expenseData.category_id },
        transaction
      }) : null;

      await transaction.commit();
      return {
        success: true,
        message: "Expense with breakdown items added successfully",
        data: {
          id: newExpense.id,
          category_id: newExpense.category_id,
          category: category ? {
            id: category.id,
            name: category.name
          } : null,
          expense: parseFloat(newExpense.expense),
          date: newExpense.date,
          note: newExpense.note,
          is_deleted: newExpense.is_deleted,
          user_id: newExpense.user_id,
          breakdownItems
        }
      };

    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error in addExpenseWithBreakdown:", error);
      return { success: false, message: "Failed to add expense with breakdown items" };
    }
  }

  public async softDeleteExpenses(
    expenseData: IDeleteExpenseRequest
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    let transaction: Transaction | null = null;
    try {
      transaction = await sequelize.transaction();
  
      // Validate user
      const user = await this.userModel.services.findOne({
        where: { user_id : expenseData.user_id, is_deleted: false },
        transaction
      });
  
      if (!user) {
        await transaction.rollback();
        return { success: false, message: "User not found" };
      }
  
      // Soft delete expenses (only those belonging to the user)
      await this.expenseModel.services.update(
        { is_deleted: true },
        {
          where: {
            id: { [Op.in]: expenseData.expense_ids },
            user_id: expenseData.user_id,
            is_deleted: false
          },
          transaction
        }
      );
  
      await transaction.commit();
      return {
        success: true,
        message: "Expenses deleted successfully"
      };
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error in softDeleteExpenses:", error);
      return { success: false, message: "Failed to delete expenses" };
    }
  }

  /**
   * Edit expense with breakdown items (only updates existing items and adds new ones)
   */
  public async editExpenseWithBreakdown(
    expenseData: IExpense
  ): Promise<{
    success: boolean;
    message: string;
    data?: IExpense;
  }> {
    let transaction: Transaction | null = null;
    try {
      transaction = await sequelize.transaction();

      // Validate user exists
      const user = await this.userModel.services.findOne({
        where: { user_id : expenseData.user_id, is_deleted: false },
        transaction
      });
      if (!user) {
        await transaction.rollback();
        return { success: false, message: "User not found" };
      }

      // Validate category exists if provided
      if (expenseData.category_id) {
        const category = await this.categoryModel.services.findOne({
          where: { id: expenseData.category_id, is_deleted: false },
          transaction
        });
        if (!category) {
          await transaction.rollback();
          return { success: false, message: "Category not found" };
        }
      }

      // Get existing expense (must belong to user)
      const existingExpense = await this.expenseModel.services.findOne({
        where: { 
          id: expenseData.id, 
          user_id: expenseData.user_id,
          is_deleted: false 
        },
        transaction
      });
      if (!existingExpense) {
        await transaction.rollback();
        return { success: false, message: "Expense not found" };
      }

      // Update expense
      await this.expenseModel.services.update(
        {
          category_id: expenseData.category_id,
          expense: expenseData.expense,
          date: expenseData.date,
          note: expenseData.note
        },
        {
          where: { 
            id: expenseData.id,
            user_id: expenseData.user_id 
          },
          transaction
        }
      );

      // Handle breakdown items
      let breakdownItems: IBreakdownItem[] = [];
      if (expenseData.breakdownItems && expenseData.breakdownItems.length > 0) {
        // Process each incoming item
        for (const item of expenseData.breakdownItems) {
          if (item.id) {
            // Update existing item
            await this.breakdownModel.services.update(
              {
                category_id: item.category_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
              },
              {
                where: { 
                  id: item.id,
                  expense_id: expenseData.id 
                },
                transaction
              }
            );
          } else {
            // Validate category for new item if provided
            if (item.category_id) {
              const category = await this.categoryModel.services.findOne({
                where: { id: item.category_id, is_deleted: false },
                transaction
              });
              if (!category) {
                await transaction.rollback();
                return { success: false, message: `Category not found for breakdown item: ${item.name}` };
              }
            }

            // Create new item
            const newItem = await this.breakdownModel.services.create({
              id: uuidv4(),
              expense_id: expenseData.id,
              category_id: item.category_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }, { transaction });
            breakdownItems.push({
              id: newItem.id,
              name: newItem.name,
              price: newItem.price,
              quantity: newItem.quantity,
              category_id: newItem.category_id
            });
          }
        }

        // Get all breakdown items for response
        const updatedBreakdownItems = await this.breakdownModel.services.findAll({
          where: { expense_id: expenseData.id },
          include: [{
            model: this.categoryModel.services,
            as: 'category',
            attributes: ['id', 'name']
          }],
          transaction
        });
        breakdownItems = updatedBreakdownItems.map((item: any) => ({
          id: item.id,
          name: item.name || item.category?.name,
          price: item.price, 
          quantity: item.quantity,
          category_id: item.category_id,
          category: item.category ? {
            id: item.category.id,
            name: item.category.name
          } : null
        }));
      }

      // Get the updated expense with category
      const updatedExpense = await this.expenseModel.services.findOne({
        where: { id: expenseData.id },
        include: [{
          model: this.categoryModel.services,
          as: 'category',
          attributes: ['id', 'name']
        }],
        transaction
      });

      await transaction.commit();
      return {
        success: true,
        message: "Expense with breakdown items updated successfully",
        data: {
          id: updatedExpense.id,
          category_id: updatedExpense.category_id,
          category: updatedExpense.category ? {
            id: updatedExpense.category.id,
            name: updatedExpense.category.name
          } : null,
          expense: updatedExpense.expense,
          date: updatedExpense.date,
          note: updatedExpense.note,
          is_deleted: updatedExpense.is_deleted,
          user_id: updatedExpense.user_id,
          breakdownItems
        }
      };
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error in editExpenseWithBreakdown:", error);
      return { 
        success: false, 
        message: "Failed to update expense with breakdown items" 
      };
    }
  }

  /**
   * Delete single breakdown item (hard delete)
   */
  public async deleteBreakdownItem(
    breakdownItemId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    let transaction: Transaction | null = null;
    try {
      transaction = await sequelize.transaction();

      // Validate user exists
      const user = await this.userModel.services.findOne({
        where: { user_id: userId, is_deleted: false },
        transaction
      });
      if (!user) {
        await transaction.rollback();
        return { success: false, message: "User not found" };
      }

      // Verify the breakdown item exists and belongs to user's expense
      const breakdownItem = await this.breakdownModel.services.findOne({
        where: { id: breakdownItemId },
        include: [{
          model: this.expenseModel.services,
          as: 'expense',
          where: { user_id: userId },
          attributes: []
        }],
        transaction
      });

      if (!breakdownItem) {
        await transaction.rollback();
        return { success: false, message: "Breakdown item not found or doesn't belong to user" };
      }

      // Hard delete the breakdown item
      await this.breakdownModel.services.destroy({
        where: { id: breakdownItemId },
        transaction
      });

      await transaction.commit();
      return {
        success: true,
        message: "Breakdown item deleted successfully"
      };
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error in deleteBreakdownItem:", error);
      return { 
        success: false, 
        message: "Failed to delete breakdown item" 
      };
    }
  }
}