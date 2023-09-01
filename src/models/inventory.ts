import { Sequelize } from "sequelize";
import sequelize from "../sequelize";

const inventoryModel = (sequelize: any, Sequelize: any) => {
  const inventories = sequelize.define("inventories", {
    item_cash_id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    item_amount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    item_code: {
      type: Sequelize.STRING,
      allowNull: true,
      default: null,
    },
    cash_amount: {
      type: Sequelize.NUMERIC(50, 10),
      allowNull: false,
    },
    invoice: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    customer_name: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    nrc: {
      allowNull: true,
      default: null,
      type: Sequelize.STRING,
    },
    price_rate:{
      type: Sequelize.STRING,
      allowNull: false,
    },
    address: {
      allowNull: true,
      default: null,
      type: Sequelize.STRING,
    },
    date_time: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    remark: {
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
    },
  });

  return inventories;
};

const inventoryTable: any = {};
inventoryTable.Sequelize = Sequelize;
inventoryTable.sequelize = sequelize;

inventoryTable.services = inventoryModel(sequelize, Sequelize);

module.exports = inventoryTable;
