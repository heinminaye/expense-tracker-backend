import { Router, Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import AuthService from "../../services/auth";
import middlewares from "../middlewares";
import { IUser, UpdatePassword, UserLogin } from "../../interfaces/user";
import { celebrate, Joi } from "celebrate";
const route = Router();

var SignInSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  password: Joi.string().required(),
  uuid: Joi.string(),
  fcmtoken: Joi.string(),
});

var SignInSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  password: Joi.string().required(),
  uuid: Joi.string(),
  fcmtoken: Joi.string(),
});

export default (app: Router) => {
  app.use(route);

  route.post(
    "/signin",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authServiceInstance = Container.get(AuthService);
        const { returncode, message, data, token } =
          await authServiceInstance.SignIn(req.body as UserLogin);

        return res.json({ returncode, message, data, token }).status(200);
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );

  route.post(
    "/refreshtoken",
    // middlewares.isAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authServiceInstance = Container.get(AuthService);
        const { returncode, message, data, token } =
          await authServiceInstance.RefreshToken(req);

        return res.json({ returncode, message, data, token }).status(200);
      } catch (e) {
        console.log(e);
        return { returncode: "300", message: "Fail" };
      }
    }
  );
};
