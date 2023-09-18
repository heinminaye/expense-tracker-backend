import { IInventory } from "./../interfaces/inventory";
import { IUser } from "./../interfaces/user";
import { Service, Inject } from "typedi";
import argon2 from "argon2";
import { randomBytes } from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import Sequelize, { FLOAT, INTEGER } from "sequelize";
import sequelize from "../sequelize";
var dateFormat = require("dateformat");
var Subtract = require("array-subtract");
import { v4 as uuidv4 } from "uuid";
import { format } from "path/posix";
import { any } from "joi";

@Service()
export default class InventoryService {
  constructor(
    @Inject("userModel") private userModel: any,
    @Inject("inventoryModel") private inventoryModel: any,
    @Inject("retailModel") private retailModel: any
  ) {}

  public async GetInventories(
    IInventory: IInventory
  ): Promise<{ returncode: string; message: string; data?: any }> {
    try {
      var userRecord: any;
      await this.userModel.services
        .findAll({ where: { user_id: IInventory.user_id, is_deleted: false } })
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
      var query = `SELECT * FROM inventories LEFT JOIN users ON inventories.user_id = users.user_id ORDER BY inventories.date_time DESC;`;
      await sequelize.query(query).then((data: any) => {
        if (data[0].length > 0) {
          var templist: any[] = [];
          data[0].map((item: any) => {
            var tempitem = {
              item_cash_id: item.item_cash_id,
              item_amount: item.item_amount,
              item_code: item.item_code,
              cash_amount: parseFloat(parseFloat(item.cash_amount).toFixed(2)),
              invoice: item.invoice,
              customer_name: item.customer_name,
              nrc: item.nrc,
              address: item.address,
              phone: item.phone,
              date_time: item.date_time,
              user_name: item.user_name,
              price_rate: item.price_rate,
              remark: item.remark,
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
            message: "Inventory Not Found",
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

  public async AddInventory(
    IInventory: IInventory,
    io: any
  ): Promise<{ returncode: string; message: string; data?: any }> {
    try {
      var result: any;
      var adminuserCheck: any;
      await this.userModel.services
        .findAll({ where: { user_id: IInventory.user_id, is_deleted: false } })
        .then((data: any) => {
          if (data.length > 0) {
            adminuserCheck = data[0];
          }
        });

      if (!adminuserCheck) {
        return { returncode: "300", message: "User Not Found" };
      }

      try {
        const now = new Date();
        const item_cash_id = uuidv4();
        const date_now = dateFormat(now, "isoDateTime");
        const getRandomId = (min = 0, max = 500000) => {
          min = Math.ceil(min);
          max = Math.floor(max);
          const num = Math.floor(Math.random() * (max - min + 1)) + min;
          return num.toString().padStart(6, "0");
        };
        var month = now.getUTCMonth() + 1;
        var day = now.getUTCDate();
        var year = now.getUTCFullYear();
        var invoice = `${day}${month}${year}` + getRandomId();

        const inventoryData = {
          ...IInventory,
          invoice: invoice,
          item_cash_id: item_cash_id,
          date_time: date_now,
        };

        var InventoryRecord: any;
        await this.inventoryModel.services
          .create(inventoryData)
          .then((data: any) => {
            InventoryRecord = data;
          });
        var emit = {
          item_cash_id: item_cash_id,
          item_amount: IInventory.item_amount,
          item_code: IInventory.item_code,
          cash_amount: IInventory.cash_amount,
          customer_name: IInventory.customer_name,
          nrc: InventoryRecord.nrc,
          invoice: invoice,
          address: InventoryRecord.address,
          phone: InventoryRecord.phone,
          date_time: date_now,
          user_name: adminuserCheck.user_name,
          price_rate: IInventory.price_rate,
          remark: IInventory.remark,
        };
        io.sockets.emit("getSocketInventory", emit);
        return { returncode: "200", message: "Success", data: emit };
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
    return result;
  }

  public async EditInventory(
    IInventory: IInventory,
    io: any
  ): Promise<{ returncode: string; message: string; data?: string }> {
    try {
      var result: any;
      var adminuserCheck: any;
      await this.userModel.services
        .findAll({ where: { user_id: IInventory.user_id, is_deleted: false } })
        .then((data: any) => {
          if (data.length > 0) {
            adminuserCheck = data[0];
          }
        });

      if (!adminuserCheck) {
        return { returncode: "300", message: "User Not Found" };
      }
      try {
        if (IInventory.item_cash_id == "" || IInventory.item_cash_id == null) {
          return { returncode: "300", message: "Inventory ID cannot be Blank" };
        }

        var inventoryCheck: any;
        var query = `SELECT * FROM inventories LEFT JOIN users ON inventories.user_id = users.user_id WHERE inventories.item_cash_id = '${IInventory.item_cash_id}';`;
        await sequelize.query(query).then((data: any) => {
          if (data[0].length > 0) {
            inventoryCheck = data[0];
          }
        });
        if (!inventoryCheck) {
          return { returncode: "300", message: "Inventory Not Exist" };
        }
        // var inventorySum: number = 0;
        // var retailSum: number = 0;d

        // var queryInventorySum = `SELECT CAST(SUM(item_amount) as INTEGER) FROM inventories;`;
        // await sequelize.query(queryInventorySum).then((data:any)=>{
        //   if(data[0].length > 0){
        //     inventorySum = data[0][0].sum;
        //   }
        //   else{
        //     return{ returncode: "300", message: "Inventory No Data"};
        //   }
        // })

        // var queryRetailSum = `SELECT CAST(SUM(item_amount) as INTEGER) FROM retails;`;
        // await sequelize.query(queryRetailSum).then((data:any)=>{
        //   if(data[0].length>0){
        //     retailSum = data[0][0].sum;
        //   }
        // })

        // var res: any;
        // var resSum = Number(inventorySum) - Number(retailSum);
        // if(IInventory.item_amount < inventoryCheck.item_amount){
        //   res = Number(inventoryCheck.item_amount) - Number(IInventory.item_amount)
        //   console.log(resSum - res)
        //   if((resSum - res) < 0){
        //     return{ returncode: "300", message: `No Reasonable amount`};
        //   }
        // }

        const filter = { item_cash_id: IInventory.item_cash_id };
        const update = {
          ...IInventory,
          user_id: inventoryCheck.user_id,
        };

        await this.inventoryModel.services
          .update(update, {
            where: filter,
            returning: true,
          })
          .then((data: any) => {
            var updateInventory = data[1];
            if (updateInventory) {
              const returncode = "200";
              const message = "Inventory Edited";
              var itemCode: any = null;
              var Code = updateInventory[0].item_code;
              if (Code) {
                itemCode = Code;
              }
              var emit = {
                item_cash_id: updateInventory[0].item_cash_id,
                item_amount: updateInventory[0].item_amount,
                item_code: itemCode,
                cash_amount: parseFloat(
                  parseFloat(updateInventory[0].cash_amount).toFixed(2)
                ),
                invoice: updateInventory[0].invoice,
                nrc: updateInventory[0].nrc,
                address: updateInventory[0].address,
                phone: updateInventory[0].phone,
                customer_name: updateInventory[0].customer_name,
                date_time: updateInventory[0].date_time,
                user_name: inventoryCheck[0].user_name,
                price_rate: updateInventory[0].price_rate,
                remark: updateInventory[0].remark,
              };

              data = emit;
              io.sockets.emit("editSocketInventory", emit);
              result = { returncode, message, data };
            } else {
              const returncode = "300";
              const message = "Inventory not found";
              result = { returncode, message };
            }
          });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
    return result;
  }

  public async DeleteInventories(
    IInventory: IInventory,
    io: any
  ): Promise<{
    returncode: string;
    message: string;
    error?: any;
    success?: any;
  }> {
    var userRecord: any;
    await this.userModel.services
      .findAll({ where: { user_id: IInventory.user_id, is_deleted: false } })
      .then((data: any) => {
        if (data.length > 0) {
          userRecord = data[0];
        }
      });

    if (!userRecord) {
      const returncode = "300";
      const message = "User Not Found";
      var data: any;
      return { returncode, message };
    }

    try {
      var result: any;
      var temp: any[] = [];
      var inventoryCheck: any[] = [];
      var searchQuery = `SELECT * FROM unnest('{${IInventory.delete_cash_ids}}'::text[]) EXCEPT ALL SELECT item_cash_id FROM inventories;`;
      await sequelize.query(searchQuery).then((data: any) => {
        if (data.length > 0) {
          var templist: string[] = [];
          data[0].map((item: any) => {
            templist.push(item.unnest);
          });
          temp = templist;
          var subtract = new Subtract((a: any, b: any) => {
            return a === b;
          });
          inventoryCheck = subtract.sub(IInventory.delete_cash_ids, temp);
          console.log(inventoryCheck);
        } else {
          result = {
            returncode: "200",
            message: "Inventory Not Found",
            data: data,
          };
        }
      });

      if (inventoryCheck.length > 0) {
        await this.inventoryModel.services
          .destroy({ where: { item_cash_id: inventoryCheck } })
          .then((data: any) => {
            if (data) {
              if (data >= 1) {
                result = {
                  returncode: "200",
                  message: "Inventory Deleted successfully",
                  error: `${temp}`,
                  success: `${inventoryCheck}`,
                };
                io.sockets.emit("deleteSocketInventory", {
                  data: inventoryCheck,
                });
              } else {
                result = {
                  returncode: "300",
                  message: "Error deleting Inventory",
                };
              }
            }
          });
        // var deleteInventorySum: number = 0;
        // var query = `SELECT * FROM unnest('{${inventoryCheck}}'::text[]) as u(id) JOIN inventories i on i.item_cash_id = u.id;`
        // await sequelize.query(query).then((data:any)=>{
        //   var templist: string[] = [];
        //   data[0].map((item:any)=>{
        //     deleteInventorySum += item.item_amount;
        //   })
        // })
        // var inventorySum: number = 0;
        // var retailSum: number = 0;

        // var queryInventorySum = `SELECT CAST(SUM(item_amount) as INTEGER) FROM inventories;`;
        // await sequelize.query(queryInventorySum).then((data:any)=>{
        //   if(data[0].length > 0){
        //     inventorySum = data[0][0].sum;
        //   }
        //   else{
        //     return{ returncode: "300", message: "Inventory No Data"};
        //   }
        // })

        // var queryRetailSum = `SELECT CAST(SUM(item_amount) as INTEGER) FROM retails;`;
        // await sequelize.query(queryRetailSum).then((data:any)=>{
        //   if(data[0].length>0){
        //     retailSum = data[0][0].sum;
        //   }
        // })
        // var resSum = Number(inventorySum) - Number(retailSum);
        // console.log(resSum - deleteInventorySum)
        // if((resSum - deleteInventorySum) < 0){
        //   return{ returncode: "300", message: `No Reasonable amount`};
        // }
      } else {
        result = { returncode: "300", message: "Inventory Not Found" };
      }
      return result;
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
  }
}
