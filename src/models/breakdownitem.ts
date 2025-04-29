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
    category_id: {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    price: {
      type: Sequelize.INTEGER, 
      allowNull: false,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  },{
    validate: {
      categoryOrName() {
        const self = this as any;
        if (!self.category_id && !self.name) {
          throw new Error('Either category or name must be provided.');
        }
      }
    }
  });

  return breakdownItems;
};

const breakdownTable: any = {};
breakdownTable.Sequelize = Sequelize;
breakdownTable.sequelize = sequelize;
breakdownTable.services = breakdownItemModel(sequelize, Sequelize);

module.exports = breakdownTable;
