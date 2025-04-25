import expressLoader from "./express";
import dependencyInjectorLoader from "./dependencyInjector";
import argon2 from "argon2";
import sequelize from "../sequelize";
import { v4 as uuidv4 } from "uuid";
var dateFormat = require("dateformat");

export default async ({ expressApp }: { expressApp: any }) => {
  const userModel = {
    name: "userModel",
    model: require("../models/user"),
  };
  const expenseModel = {
    name: "expenseModel",
    model: require("../models/expense"),
  };

  const breakdownItemModel = {
    name: "breakdownItemModel",
    model: require("../models/breakdownitem"),
  };


  

  // const encoded = Buffer.from("password", "utf8").toString("base64");

  // userModel.model.sequelize.sync().then(function () {
  //   userModel.model.services.findAll({}).then((data: any) => {
  //     if (data.length == 0) {
  //       userModel.model.services.create({
  //         user_id: "admin@gmail.com",
  //         user_name: "admin",
  //         password: encoded,
  //         role: "001",
  //       });
  //     }
  //   });
  // });

  expenseModel.model.services.hasMany(breakdownItemModel.model.services, {
    foreignKey: 'expense_id',
    as: 'breakdownItems',
  });
  
  breakdownItemModel.model.services.belongsTo(breakdownItemModel.model.services, {
    foreignKey: 'expense_id',
    as: 'expense',
  });

  // sequelize.sync({ alter: true });

  // Set Containers for Dependency Injection
  await dependencyInjectorLoader({
    models: [userModel, expenseModel, breakdownItemModel],
  });

  await expressLoader({ app: expressApp });
};
