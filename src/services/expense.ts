import { IExpense, IBreakdownItem } from "../interfaces/expense";
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
    @Inject("breakdownItemModel") private breakdownModel: any
  ) {}

  /**
   * Get expenses with their breakdown items
   */
  public async getExpensesWithBreakdown(
    expenseData: IExpense,
    page?: any
  ): Promise<{
    success: boolean;
    message: string;
    totalPages?: number;
    currentPage?: number;
    totalAmount?: number;
    data?: IExpense[];
  }> {
    let transaction: Transaction | null = null;
    try {
      transaction = await sequelize.transaction();
      // Validate user exists
      const user = await this.userModel.services.findAll({
        where: { user_id: expenseData.user_id, is_deleted: false },
        transaction
      });
      if (!user) {
        await transaction.rollback();
        return { success: false, message: "User not found" };
      }

      // Build where clause
      const where: any = { 
        is_deleted: false 
      };
      
      if (expenseData.search_value) {
        where[Op.or] = [
          { category: { [Op.iLike]: `%${expenseData.search_value}%` } },
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
      const totalRows = await this.expenseModel.services.count({ where, transaction });
      const totalAmountResult = await this.expenseModel.services.findOne({
        where,
        attributes: [
          [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('expense')), 0), 'total']
        ],
        raw: true,
        transaction
      });
      const totalAmount = parseFloat(totalAmountResult?.total) || 0;

      // Pagination
      const offset = page ? (page - 1) * this.itemsPerPage : 0;
      const limit = this.itemsPerPage;

      // Get expenses
      const expenses = await this.expenseModel.services.findAll({
        where,
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
          currentPage: page || 1,
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
        transaction
      });

      // Group breakdown items by expense_id
      const breakdownMap = breakdownItems.reduce((map: any, item: any) => {
        if (!map[item.expense_id]) {
          map[item.expense_id] = [];
        }
        map[item.expense_id].push({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity
        });
        return map;
      }, {});

      // Format response
      const formattedExpenses = expenses.map((expense: any) => ({
        id: expense.id,
        category: expense.category,
        expense: expense.expense,
        date: expense.date,
        note: expense.note,
        is_deleted: expense.is_deleted,
        breakdownItems: breakdownMap[expense.id] || []
      }));

      await transaction.commit();
      return {
        success: true,
        message: "Expenses retrieved successfully",
        totalPages: Math.ceil(totalRows / this.itemsPerPage),
        currentPage: page || 1,
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
        where: { user_id: expenseData.user_id, is_deleted: false },
        transaction
      });
      if (!user) {
        await transaction.rollback();
        return { success: false, message: "User not found" };
      }

      // Create expense
      const expenseId = uuidv4();
      const newExpense = await this.expenseModel.services.create({
        id: expenseId,
        user_id: expenseData.user_id,
        category: expenseData.category,
        expense: expenseData.expense,
        date: expenseData.date || dateFormat(new Date(), "yyyy-mm-dd"),
        note: expenseData.note,
        is_deleted: false
      }, { transaction });

      // Add breakdown items if they exist
      let breakdownItems: IBreakdownItem[] = [];
      if (expenseData.breakdownItems && expenseData.breakdownItems.length > 0) {
        const breakdownToCreate = expenseData.breakdownItems.map(item => ({
          id: uuidv4(),
          expense_id: expenseId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          is_deleted: false
        }));

        await this.breakdownModel.services.bulkCreate(breakdownToCreate, { transaction });
        
        // Get created items for response
        breakdownItems = breakdownToCreate.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));
      }

      await transaction.commit();
      return {
        success: true,
        message: "Expense with breakdown items added successfully",
        data: {
          id: newExpense.id,
          category: newExpense.category,
          expense: parseFloat(newExpense.expense),
          date: newExpense.date,
          note: newExpense.note,
          is_deleted: newExpense.is_deleted,
          breakdownItems
        }
      };

    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error in addExpenseWithBreakdown:", error);
      return { success: false, message: "Failed to add expense with breakdown items" };
    }
  }

}