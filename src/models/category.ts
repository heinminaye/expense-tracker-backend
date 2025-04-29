// models/category.model.ts

import { Sequelize } from 'sequelize';
import sequelize from '../sequelize';

const categoryModel = (sequelize: any, Sequelize: any) => {
  const categories = sequelize.define('categories', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    parentId: {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    is_deleted: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return categories;
};

const categoryTable: any = {};
categoryTable.Sequelize = Sequelize;
categoryTable.sequelize = sequelize;
categoryTable.services = categoryModel(sequelize, Sequelize);

module.exports = categoryTable;
