import { Sequelize } from "sequelize";
import sequelize from "../sequelize";

const retailModel = (sequelize: any, Sequelize: any) => {
  const retails = sequelize.define("retails", {
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
    customer_name: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    invoice: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    nrc: {
      type: Sequelize.STRING,
      default: null,
    },
    address: {
      type: Sequelize.STRING,
      default: null,
    },
    phone: {
      type: Sequelize.STRING,
      default: null,
    },
    price_rate:{
      type: Sequelize.STRING,
      allowNull: false,
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

  return retails;
};

const inventoryTable: any = {};
inventoryTable.Sequelize = Sequelize;
inventoryTable.sequelize = sequelize;

inventoryTable.services = retailModel(sequelize, Sequelize);

module.exports = inventoryTable;
