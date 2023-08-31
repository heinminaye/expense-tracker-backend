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

  const branchModel = {
    name: "branchModel",
    model: require("../models/branch"),
  };

  const inventoryModel = {
    name: "inventoryModel",
    model: require("../models/inventory"),
  };

  const retailModel = {
    name: "retailModel",
    model: require("../models/retail"),
  };

  // sequelize.sync({ alter: true });

  // const encoded = Buffer.from("password", "utf8").toString("base64");

  // userModel.model.sequelize.sync().then(function () {
  //   userModel.model.services.findAll({}).then((data: any) => {
  //     if (data.length == 0) {
  //       userModel.model.services.create({
  //         user_id: "09123456789",
  //         user_name: "msi",
  //         password: encoded,
  //         role: "001",
  //         branch: "001",
  //       });
  //     }
  //   });
  // });

  userModel.model.services.hasMany(inventoryModel.model.services, {
    foreignKey: {
      name: "user_id",
      unique: false,
    },
  });

  userModel.model.services.hasMany(retailModel.model.services, {
    foreignKey: {
      name: "user_id",
      unique: false,
    },
  });

  // Set Containers for Dependency Injection
  await dependencyInjectorLoader({
    models: [userModel, branchModel, inventoryModel, retailModel],
  });

  await expressLoader({ app: expressApp });
};
