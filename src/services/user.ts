import { IUser } from "./../interfaces/user";
import { Service, Inject } from "typedi";
import argon2 from "argon2";
import { randomBytes } from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import Sequelize from "sequelize";
import sequelize from "../sequelize";
import * as bcrypt from "bcrypt";
const crypto = require("crypto");
const Op = require("sequelize").Op;
@Service()
export default class UserService {
  constructor(
    @Inject("userModel") private userModel: any,
    @Inject("inventoryModel") private inventoryModel: any,
    @Inject("retailModel") private retailModel: any
  ) {}

  public async GetUsers(
    IUser: IUser
  ): Promise<{ returncode: string; message: string; data?: any }> {
    try {
      var userRecord: any;
      await this.userModel.services
        .findAll({ where: { user_id: IUser.user_id, is_deleted: false } })
        .then((data: any) => {
          if (data.length > 0) {
            userRecord = data[0];
          }
        });

      if (!userRecord) {
        const returncode = "300";
        const message = "User Not Found";
        return { returncode, message };
      }
      var result: any;
      var query = `SELECT * FROM users WHERE users.role != '001' AND users.user_id != '${IUser.user_id}' AND users.is_deleted = 'false';`;
      await sequelize.query(query).then((data: any) => {
        if (data[0].length > 0) {
          var templist: any[] = [];
          data[0].map((item: any) => {
            const decoded = Buffer.from(item.password, "base64").toString(
              "utf8"
            );
            var tempitem = {
              user_id: item.user_id,
              user_name: item.user_name,
              role: item.role,
              password: decoded,
              // assigned_manager: item.assigned_manager
            };
            templist.push(tempitem);
          });
          data = templist;
          const returncode = "200";
          const message = "Success";

          result = { returncode, message, data: data };
        } else {
          result = {
            returncode: "200",
            message: "Staff Users Not Found",
            data: [],
          };
        }
      });
      return result;
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
  }

  public async CreateUser(
    IUser: IUser,
    io: any
  ): Promise<{ returncode: string; message: string; data?: any }> {
    var adminuserCheck: any;
    await this.userModel.services
      .findAll({ where: { user_id: IUser.user_id, is_deleted: false } })
      .then((data: any) => {
        if (data.length > 0) {
          adminuserCheck = data[0];
        }
      });

    if (!adminuserCheck) {
      return { returncode: "300", message: "User Not Found" };
    }

    if (adminuserCheck.role != "001" && adminuserCheck.role != "002") {
      return {
        returncode: "300",
        message: "User has no authorization to create new user.",
      };
    }
    var result: any;

    try {
      var encoded = Buffer.from(IUser.password, "utf8").toString("base64");
      const userData = {
        ...IUser,
        user_id: IUser.staff_id,
        password: encoded
      };
      var userCheck: any;
      await this.userModel.services
        .findAll({
          where: { user_id: IUser.staff_id },
        })
        .then((data: any) => {
          if (data.length > 0) {
            userCheck = data[0];
          }
        });
      var checkDelete: boolean = false;

      if (userCheck) {
        if (!userCheck.is_deleted) {
          checkDelete = userCheck.is_deleted;
          return { returncode: "300", message: "User Already Registered" };
        } else {
          checkDelete = true;
        }
      }

      var newRecord: any;
      if (checkDelete) {
        var filter = { user_id: IUser.staff_id };
        const update = {
          user_name: IUser.user_name,
          role: IUser.role,
          password: encoded,
          is_deleted: "false",
        };
        await this.userModel.services
          .update(update, {
            where: filter,
            returning: true,
          })
          .then((data: any) => {
            var newRecord = data[1];
            if (newRecord) {
              const returncode = "200";
              const message = "Success";
              var decoded = Buffer.from(
                newRecord[0].password,
                "base64"
              ).toString("utf8");
              var emit = {
                user_id: newRecord[0].user_id,
                user_name: newRecord[0].user_name,
                role: newRecord[0].role,
                password: decoded,
              };
              io.sockets.emit("getStaffSocket", emit);

              result = { returncode, message, data: emit };
            } else {
              const returncode = "300";
              const message = "Fail";
              var data: any;
              result = { returncode, message };
            }
          });
      } else {
        var userRecord: any;
        await this.userModel.services.create(userData).then((data: any) => {
          userRecord = data;
        });
        if (!userRecord) {
          return { returncode: "300", message: "Fail" };
        }
        var emit = {
          user_id: userRecord.user_id,
          user_name: userRecord.user_name,
          role: userRecord.role,
          password: Buffer.from(userRecord.password, "base64").toString("utf8"),
        };
        io.sockets.emit("getStaffSocket", emit);
        result = { returncode: "200", message: "Success", data: emit };
      }
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
    return result;
  }

  public async EditUser(
    IUser: IUser,
    io: any
  ): Promise<{ returncode: string; message: string; data?: any }> {
    var userRecord: any;
    await this.userModel.services
      .findAll({ where: { user_id: IUser.user_id, is_deleted: false } })
      .then((data: any) => {
        if (data.length > 0) {
          userRecord = data[0];
        }
      });

    if (!userRecord) {
      const returncode = "300";
      const message = "User Not Found";
      return { returncode, message };
    }

    try {
      // var editCheck: any
      // await this.userModel.services.findAll(
      //   { where: { user_id: IUser.staff_id }, user_id:{[Op.not]: IUser.user_id} }
      // ).then((data: any) => {
      //   if (data.length > 0) {
      //     editCheck = data[0];
      //   }
      // });

      // if (editCheck) {
      //   const returncode = "300";
      //   const message = "User Already Exits"
      //   return { returncode, message };
      // }
      var encoded = Buffer.from(IUser.password, "utf8").toString("base64");

      var result: any;
      var filter = { user_id: IUser.staff_id };
      const update = {
        user_name: IUser.user_name,
        role: IUser.role,
        password: encoded,
      };
      await this.userModel.services
        .update(update, {
          where: filter,
          returning: true,
        })
        .then((data: any) => {
          var newRecord = data[1];
          console.log(newRecord);
          if (newRecord) {
            const returncode = "200";
            const message = "User Edited";
            var decoded = Buffer.from(newRecord[0].password, "base64").toString(
              "utf8"
            );
            var emit = {
              user_id: newRecord[0].user_id,
              user_name: newRecord[0].user_name,
              role: newRecord[0].role,
              password: decoded,
            };
            console.log(emit);
            io.sockets.emit("editStaffSocket", emit);

            result = { returncode, message, data: emit };
          } else {
            const returncode = "300";
            const message = "User not found";
            var data: any;
            result = { returncode, message };
          }
        });
      return result;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  public async DeleteUser(
    IUser: IUser,
    io: any
  ): Promise<{ returncode: string; message: string; data?: any }> {
    var userRecord: any;
    await this.userModel.services
      .findAll({ where: { user_id: IUser.user_id, is_deleted: false } })
      .then((data: any) => {
        if (data.length > 0) {
          userRecord = data[0];
        }
      });

    if (!userRecord) {
      const returncode = "300";
      const message = "User Not Found";
      return { returncode, message };
    }
    try {
      if (IUser.delete_user_id == "" || IUser.delete_user_id == null) {
        return { returncode: "300", message: "User ID cannot be blank" };
      }

      var deleteUserRecord: any;
      await this.userModel.services
        .findAll({
          where: { user_id: IUser.delete_user_id, is_deleted: false },
        })
        .then((data: any) => {
          if (data.length > 0) {
            deleteUserRecord = data[0];
          }
        });

      if (!deleteUserRecord) {
        const returncode = "300";
        const message = "User Not Found";
        return { returncode, message };
      }

      var result: any;
      var filter = { user_id: IUser.delete_user_id };
      var inventoryCheck: any;
      await this.inventoryModel.services
        .findAll({ where: { user_id: IUser.delete_user_id } })
        .then((data: any) => {
          if (data.length > 0) {
            inventoryCheck = data[0];
          }
        });

      var retailCheck: any;
      await this.inventoryModel.services
        .findAll({ where: { user_id: IUser.delete_user_id } })
        .then((data: any) => {
          if (data.length > 0) {
            retailCheck = data[0];
          }
        });

      const update = {
        is_deleted: true,
      };
      var newRecord: any;
      if (inventoryCheck || retailCheck) {
        await this.userModel.services
          .update(update, {
            where: filter,
            returning: true,
          })
          .then((data: any) => {
            newRecord = data[1];
          });

        if (newRecord) {
          const returncode = "200";
          const message = "User Deleted Successfully";
          io.sockets.emit("deleteStaffSocket", IUser.delete_user_id);
          return { returncode, message };
        } else {
          const returncode = "300";
          const message = "User not found";
          return { returncode, message };
        }
      }
      await this.userModel.services
        .destroy({ where: filter })
        .then((data: any) => {
          if (data) {
            if (data == 1) {
              result = {
                returncode: "200",
                message: "User Deleted successfully",
              };
              io.sockets.emit("deleteStaffSocket", IUser.delete_user_id);
            } else {
              result = { returncode: "300", message: "Error Deleting User" };
            }
          }
        });
      return result;
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
  }
}
