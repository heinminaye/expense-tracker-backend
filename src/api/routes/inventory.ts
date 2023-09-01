import { Router, Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import AuthService from "../../services/auth";
import middlewares from "../middlewares";
import { IUser, UserLogin } from "../../interfaces/user";
import { celebrate, Joi } from "celebrate";
import { IInventory } from "../../interfaces/inventory";
import InventoryService from "../../services/inventory";
import io from "../../app";

const route = Router();

var GetInventorySchema = Joi.object().keys({
  user_id: Joi.string().required(),
});

var AddInventorySchema = Joi.object().keys({
  user_id: Joi.string().required(),
  item_amount: Joi.number().required(),
  item_code: Joi.allow(""),
  cash_amount: Joi.number().required(),
  customer_name: Joi.string().required(),
  nrc: Joi.allow(""),
  address: Joi.string().allow(""),
  remark: Joi.allow(""),
  price_rate: Joi.string().required(),
});

var EditInventorySchema = Joi.object().keys({
  user_id: Joi.string().required(),
  item_amount: Joi.number().allow(""),
  item_cash_id: Joi.string().required(),
  item_code: Joi.allow(""),
  cash_amount: Joi.number().allow(""),
  customer_name: Joi.string().allow(""),
  nrc: Joi.allow(""),
  address: Joi.string().allow(""),
  remark: Joi.allow(""),
  price_rate: Joi.string().required(),
});

var DeleteInventorySchema = Joi.object().keys({
  user_id: Joi.string().required(),
  delete_cash_ids: Joi.array().required(),
});

export default (app: Router) => {
  app.use(route);

  route.post(
    "/getinventory",
    middlewares.validation(GetInventorySchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const inventoryServiceInstance = Container.get(InventoryService);
        const { returncode, message, data } =
          await inventoryServiceInstance.GetInventories(req.body as IInventory);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/addinventory",
    middlewares.validation(AddInventorySchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const inventoryServiceInstance = Container.get(InventoryService);
        const { returncode, message, data } =
          await inventoryServiceInstance.AddInventory(
            req.body as IInventory,
            io
          );
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        next(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/editinventory",
    middlewares.validation(EditInventorySchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const inventoryServiceInstance = Container.get(InventoryService);
        const { returncode, message, data } =
          await inventoryServiceInstance.EditInventory(
            req.body as IInventory,
            io
          );
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);

        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/deleteinventory",
    middlewares.validation(DeleteInventorySchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const inventoryServiceInstance = Container.get(InventoryService);
        const { returncode, message, error, success } =
          await inventoryServiceInstance.DeleteInventories(
            req.body as IInventory,
            io
          );
        return res.status(200).json({ returncode, message, error, success });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );
};
