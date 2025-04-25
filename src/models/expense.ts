import { Sequelize } from 'sequelize';
import sequelize from '../sequelize';

const expenseModel = (sequelize: any, Sequelize: any) => {
  const expenses = sequelize.define('expenses', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    category: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expense: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    note: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    is_deleted: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return expenses;
};

const expenseTable: any = {};
expenseTable.Sequelize = Sequelize;
expenseTable.sequelize = sequelize;
expenseTable.services = expenseModel(sequelize, Sequelize);

module.exports = expenseTable;
