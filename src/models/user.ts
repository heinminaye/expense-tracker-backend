import { Sequelize } from 'sequelize';
import sequelize from '../sequelize';
import { v4 as uuidv4 } from 'uuid';

const userModel = (sequelize: any, Sequelize: any) => {
  const users = sequelize.define('users', {
    user_id: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    },
    user_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    is_deleted: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    remark:{
      type: Sequelize.STRING,
    },
    sessionexpired: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    t1:{
      type: Sequelize.STRING,
    },
    t2:{
      type: Sequelize.STRING,
    },
    t3:{
      type: Sequelize.STRING,
    }
  });

  return users;
};


const userTable: any = {};
userTable.Sequelize = Sequelize;
userTable.sequelize = sequelize;

userTable.services = userModel(sequelize, Sequelize);

module.exports = userTable;
