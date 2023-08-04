import { Router, Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import AuthService from "../../services/auth";
import middlewares from "../middlewares";
import { IUser, UserLogin } from "../../interfaces/user";
import { celebrate, Joi } from "celebrate";
import { IInventory } from "../../interfaces/inventory";
import InventoryService from "../../services/inventory";
import io from "../../app";
import RetailService from "../../services/retail";
import { IRetail } from "../../interfaces/retail";

const route = Router();

var GetRetailSchema = Joi.object().keys({
  user_id: Joi.string().required(),
});

var addRetailSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  item_amount: Joi.number().required(),
  item_code: Joi.allow(""),
  cash_amount: Joi.number().required(),
  customer_name: Joi.string().required(),
  phone: Joi.allow(""),
  nrc: Joi.allow(""),
  address: Joi.string().allow(""),
});

var EditRetailSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  item_amount: Joi.number().allow(""),
  item_cash_id: Joi.string().required(),
  item_code: Joi.allow(""),
  cash_amount: Joi.number().allow(""),
  customer_name: Joi.string().allow(""),
  phone: Joi.allow(""),
  nrc: Joi.allow(""),
  address: Joi.string().allow(""),
});

var deleteRetailSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  delete_cash_ids: Joi.array().required(),
});

export default (app: Router) => {
  app.use(route);

  route.post(
    "/getretail",
    middlewares.validation(GetRetailSchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const retailServiceInstance = Container.get(RetailService);
        const { returncode, message, data } =
          await retailServiceInstance.GetRetails(req.body as IRetail);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/addretail",
    middlewares.validation(addRetailSchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const retailServiceInstance = Container.get(RetailService);
        const { returncode, message, data } =
          await retailServiceInstance.AddRetail(req.body as IRetail, io);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/editretail",
    middlewares.validation(EditRetailSchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const retailServiceInstance = Container.get(RetailService);
        const { returncode, message, data } =
          await retailServiceInstance.editRetail(req.body as IRetail, io);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/deleteretail",
    middlewares.validation(deleteRetailSchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const retailServiceInstance = Container.get(RetailService);
        const { returncode, message, data } =
          await retailServiceInstance.deleteRetail(req.body as IRetail, io);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );
};
