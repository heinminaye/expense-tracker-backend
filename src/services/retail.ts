import { IRetail } from "./../interfaces/retail";
import { IUser } from "./../interfaces/user";
import { Service, Inject } from "typedi";
import argon2 from "argon2";
import sequelize from "../sequelize";
var dateFormat = require("dateformat");
var Subtract = require("array-subtract");
import { v4 as uuidv4 } from "uuid";

@Service()
export default class RetailService {
  constructor(
    @Inject("userModel") private userModel: any,
    @Inject("retailModel") private retailModel: any,
    @Inject("inventoryModel") private inventoryModel: any,
    @Inject("branchModel") private branchModel: any
  ) {}

  public async GetRetails(
    IRetail: IRetail
  ): Promise<{ returncode: string; message: string; data?: any }> {
    try {
      var userRecord: any;
      await this.userModel.services
        .findAll({ where: { user_id: IRetail.user_id, is_deleted: false } })
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

      var branchCheck: any;
      await this.branchModel.services
        .findAll({ where: { branch_id: userRecord.branch } })
        .then((data: any) => {
          if (data.length > 0) {
            branchCheck = data[0];
          }
        });

      if (!branchCheck) {
        const returncode = "300";
        const message = "Branch Not Found";
        return { returncode, message };
      }

      var result: any;
      var queryOne = `SELECT * FROM retails LEFT JOIN users ON retails.user_id = users.user_id ORDER BY retails.date_time DESC;`;
      await sequelize.query(queryOne).then((data: any) => {
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
              receiving_branch: item.receiving_branch,
              date_time: item.date_time,
              user_name: item.user_name,
            };
            templist.push(tempitem);
          });
          data = templist;
          const returncode = "200";
          const message = "Success";

          result = { returncode, message, data: data };
        } else {
          result = { returncode: "200", message: "Retail Not Found", data: [] };
        }
      });
      return result;
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
  }

  public async AddRetail(
    IRetail: IRetail,
    io: any
  ): Promise<{ returncode: string; message: string; data?: any }> {
    try {
      var result: any;
      var adminuserCheck: any;
      await this.userModel.services
        .findAll({ where: { user_id: IRetail.user_id, is_deleted: false } })
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
        var branchCheck: any;
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
        // console.log(inventorySum)
        // console.log(retailSum)
        // if(IRetail.item_amount > resSum){
        //   return{ returncode: "300", message: `More than available quantity`};
        // }

        var query = `SELECT * FROM branches RIGHT JOIN users ON branches.branch_id = users.branch WHERE users.user_id = '${adminuserCheck.user_id}'`;
        await sequelize.query(query).then((data: any) => {
          if (data[0].length > 0) {
            branchCheck = data[0][0].branch_name;
          } else {
            result = { returncode: "300", message: "Branch Not Found" };
          }
        });
        if (!branchCheck) {
          const returncode = "300";
          const message = "Branch Not Found";
          result = { returncode, message };
        }

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

        const retailData = {
          ...IRetail,
          invoice: invoice,
          item_cash_id: item_cash_id,
          date_time: date_now,
          receiving_branch: branchCheck,
        };

        var RetailRecord: any;
        await this.retailModel.services.create(retailData).then((data: any) => {
          RetailRecord = data;
        });
        console.log(RetailRecord);
        var emit = {
          item_cash_id: item_cash_id,
          item_amount: IRetail.item_amount,
          item_code: IRetail.item_code,
          cash_amount: IRetail.cash_amount,
          customer_name: IRetail.customer_name,
          invoice: invoice,
          nrc: RetailRecord.nrc,
          address: RetailRecord.address,
          receiving_branch: branchCheck,
          date_time: date_now,
          user_name: adminuserCheck.user_name,
        };
        io.sockets.emit("getSocketRetail", emit);
        result = { returncode: "200", message: "Success", data: emit };
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

  public async editRetail(
    IRetail: IRetail,
    io: any
  ): Promise<{ returncode: string; message: string; data?: any }> {
    try {
      var result: any;
      var result: any;
      var adminuserCheck: any;
      await this.userModel.services
        .findAll({ where: { user_id: IRetail.user_id, is_deleted: false } })
        .then((data: any) => {
          if (data.length > 0) {
            adminuserCheck = data[0];
          }
        });

      if (!adminuserCheck) {
        return { returncode: "300", message: "User Not Found" };
      }
      try {
        if (IRetail.item_cash_id == "" || IRetail.item_cash_id == null) {
          return { returncode: "300", message: "Retail ID cannot be Blank" };
        }
        var retailCheck: any;
        var query = `SELECT * FROM retails LEFT JOIN users ON retails.user_id = users.user_id WHERE retails.item_cash_id = '${IRetail.item_cash_id}';`;
        await sequelize.query(query).then((data: any) => {
          if (data[0].length > 0) {
            retailCheck = data[0];
          } else {
            return { returncode: "300", message: "Retail Not Found" };
          }
        });
        const filter = { item_cash_id: IRetail.item_cash_id };
        const update = {
          ...IRetail,
          user_id: retailCheck.user_id,
        };

        await this.retailModel.services
          .update(update, {
            where: filter,
            returning: true,
          })
          .then((data: any) => {
            var updateRetail = data[1];
            if (updateRetail) {
              const returncode = "200";
              const message = "Retail Edited";
              var itemCode: any = null;
              var Code = updateRetail[0].item_code;
              if (Code) {
                itemCode = Code;
              }
              var emit = {
                item_cash_id: updateRetail[0].item_cash_id,
                item_amount: updateRetail[0].item_amount,
                item_code: itemCode,
                cash_amount: parseFloat(
                  parseFloat(updateRetail[0].cash_amount).toFixed(2)
                ),
                invoice: updateRetail[0].invoice,
                nrc: updateRetail[0].nrc,
                address: updateRetail[0].address,
                customer_name: updateRetail[0].customer_name,
                receiving_branch: updateRetail[0].receiving_branch,
                date_time: updateRetail[0].date_time,
                user_name: retailCheck[0].user_name,
              };
              io.sockets.emit("editSocketRetail", emit);
              result = { returncode, message, data: emit };
            } else {
              const returncode = "300";
              const message = "Retail Not Found";
              result = { returncode, message };
            }
          });
      } catch (e) {
        return { returncode: "300", message: "Fail" };
      }
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
    return result;
  }

  public async deleteRetail(
    IRetail: IRetail,
    io: any
  ): Promise<{ returncode: string; message: string; data?: any }> {
    try {
      var result: any;
      var adminuserCheck: any;
      await this.userModel.services
        .findAll({ where: { user_id: IRetail.user_id, is_deleted: false } })
        .then((data: any) => {
          if (data.length > 0) {
            adminuserCheck = data[0];
          }
        });

      if (!adminuserCheck) {
        return { returncode: "300", message: "User Not Found" };
      }

      try {
        var result: any;
        var temp: any[] = [];
        var retailCheck: any[] = [];
        var searchQuery = `SELECT * FROM unnest('{${IRetail.delete_cash_ids}}'::text[]) EXCEPT ALL SELECT item_cash_id FROM retails;`;
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
            retailCheck = subtract.sub(IRetail.delete_cash_ids, temp);
            console.log(retailCheck);
          } else {
            result = {
              returncode: "200",
              message: "Retail Not Found",
              data: data,
            };
          }
        });

        if (retailCheck.length > 0) {
          await this.retailModel.services
            .destroy({ where: { item_cash_id: retailCheck } })
            .then((data: any) => {
              if (data) {
                if (data >= 1) {
                  result = {
                    returncode: "200",
                    message: "Retail Deleted successfully",
                    error: `${temp}`,
                    success: `${retailCheck}`,
                  };
                  io.sockets.emit("deleteSocketRetail", {
                    data: retailCheck,
                  });
                } else {
                  result = {
                    returncode: "300",
                    message: "Error deleting Retail",
                  };
                }
              }
            });
        } else {
          result = { returncode: "300", message: "Retail Not Found" };
        }
        return result;
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    } catch (e) {
      console.log(e);
      return { returncode: "300", message: "Fail" };
    }
  }
}
