import { Sequelize } from 'sequelize';
import sequelize from '../sequelize';

const branchModel = (sequelize: any, Sequelize: any) => {
  const branches = sequelize.define('branches', {
    branch_id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false
    },
    branch_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    branch_address: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    assigned_manager: {
      type: Sequelize.STRING,
      default: null
    },
    remark:{
      type: Sequelize.STRING,
    },
    t1: {
      type: Sequelize.STRING,
    },
    t2: {
      type: Sequelize.STRING,
    },
    t3: {
      type: Sequelize.STRING,
    }
  });

  return branches;
};


const branchTable: any = {};
branchTable.Sequelize = Sequelize;
branchTable.sequelize = sequelize;

branchTable.services = branchModel(sequelize, Sequelize);

module.exports = branchTable;
