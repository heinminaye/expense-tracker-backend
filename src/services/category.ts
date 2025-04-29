import { Service, Inject } from 'typedi';
import { Sequelize, Op, Transaction } from 'sequelize';
import sequelize from '../sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ICategoryResponse } from '../interfaces/category';
import { ICategory } from '../interfaces/category';

@Service()
export default class CategoryService {
    constructor(
        @Inject("userModel") private userModel: any,
        @Inject('categoryModel') private categoryModel: any,
        @Inject('expenseModel') private expenseModel: any,
        @Inject('breakdownItemModel') private breakdownModel: any
    ) { }

    /**
     * Get all categories in hierarchical format
     */
    public async getCategories({user_id}:{user_id:string}): Promise<ICategoryResponse> {
        let transaction: Transaction | null = null;
        try {
            transaction = await sequelize.transaction();
            const user = await this.userModel.services.findOne({
                where: { user_id: user_id, is_deleted: false },
                transaction
              });
              if (!user) {
                await transaction.rollback();
                return { success: false, message: "User not found" };
              }
            // Get all non-deleted categories
            const allCategories = await this.categoryModel.services.findAll({
                where: { is_deleted: false },
                transaction,
                raw: true
            });

            if (!allCategories.length) {
                await transaction.commit();
                return { success: true, message: 'No categories found', data: [] };
            }

            // Build hierarchy
            const buildHierarchy = (parentId: string | null): ICategory[] => {
                return allCategories
                    .filter((cat: any) => cat.parentId === parentId)
                    .map((cat: any) => ({
                        id: cat.id,
                        name: cat.name,
                        parentId: cat.parentId,
                        children: buildHierarchy(cat.id)
                    }));
            };

            const hierarchicalData = buildHierarchy(null);

            await transaction.commit();
            return {
                success: true,
                message: 'Categories retrieved successfully',
                data: hierarchicalData
            };
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error('Error in getCategories:', error);
            return { success: false, message: 'Failed to retrieve categories' };
        }
    }

    /**
     * Add new category
     */
    public async addCategory(categoryData: ICategory): Promise<ICategoryResponse> {
        let transaction: Transaction | null = null;
        try {
            transaction = await sequelize.transaction();

            // Validate parent exists if provided
            if (categoryData.parentId) {
                const parent = await this.categoryModel.services.findOne({
                    where: {
                        id: categoryData.parentId,
                        is_deleted: false
                    },
                    transaction
                });
                if (!parent) {
                    await transaction.rollback();
                    return { success: false, message: 'Parent category not found' };
                }
            }

            const newCategory = await this.categoryModel.services.create({
                id: uuidv4(),
                name: categoryData.name,
                parentId: categoryData.parentId || null,
                is_deleted: false
            }, { transaction });

            await transaction.commit();
            return {
                success: true,
                message: 'Category added successfully',
                data: {
                    id: newCategory.id,
                    name: newCategory.name,
                    parentId: newCategory.parentId,
                    children: []
                }
            };
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error('Error in addCategory:', error);
            return { success: false, message: 'Failed to add category' };
        }
    }
}