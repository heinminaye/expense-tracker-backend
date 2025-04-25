import { Sequelize } from 'sequelize';
import sequelize from '../sequelize';

const breakdownItemModel = (sequelize: any, Sequelize: any) => {
  const breakdownItems = sequelize.define('breakdown_items', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    expense_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'expenses',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    price: {
      type: Sequelize.INTEGER, 
      allowNull: false,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return breakdownItems;
};

const breakdownTable: any = {};
breakdownTable.Sequelize = Sequelize;
breakdownTable.sequelize = sequelize;
breakdownTable.services = breakdownItemModel(sequelize, Sequelize);

module.exports = breakdownTable;
