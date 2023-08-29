import { Router, Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import middlewares from "../middlewares";
import UserService from "../../services/user";
import { IUser } from "../../interfaces/user";
import { celebrate, Joi } from "celebrate";
import io from "../../app";

const route = Router();

var GetUserSchema = Joi.object().keys({
  user_id: Joi.string().required(),
});

var EditUserSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  staff_id: Joi.string().required(),
  user_name: Joi.string().allow(""),
  role: Joi.string().allow(""),
  password: Joi.string().allow(""),
});

var AddUserSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  staff_id: Joi.string().required(),
  password: Joi.string().required(),
  user_name: Joi.string().required(),
  role: Joi.string().required(),
});

var DeleteUserSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  delete_user_id: Joi.string().required(),
});

export default (app: Router) => {
  app.use(route);

  route.post(
    "/getuser",
    middlewares.validation(GetUserSchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userServiceInstance = Container.get(UserService);
        const { returncode, message, data } =
          await userServiceInstance.GetUsers(req.body as IUser);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/createuser",
    middlewares.validation(AddUserSchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userServiceInstance = Container.get(UserService);
        const { returncode, message, data } =
          await userServiceInstance.CreateUser(req.body as IUser, io);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/edituser",
    middlewares.validation(EditUserSchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userServiceInstance = Container.get(UserService);
        const { returncode, message, data } =
          await userServiceInstance.EditUser(req.body as IUser, io);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/deleteuser",
    middlewares.validation(DeleteUserSchema),
    middlewares.isAuth,
    middlewares.tokenCheck,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userServiceInstance = Container.get(UserService);
        const { returncode, message, data } =
          await userServiceInstance.DeleteUser(req.body as IUser, io);
        return res.status(200).json({ returncode, message, data });
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );
};
