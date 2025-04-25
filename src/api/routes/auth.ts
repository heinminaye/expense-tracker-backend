import { Router, Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import AuthService from "../../services/auth";
import middlewares from "../middlewares";
import { UpdatePassword, UserLogin } from "../../interfaces/user";
import { Joi } from "celebrate";
const route = Router();

var SignInSchema = Joi.object().keys({
  user_id: Joi.string().required(),
  password: Joi.string().required()
});

export default (app: Router) => {
  app.use('/auth',route);

  route.post(
    "/signin",
    middlewares.validation(SignInSchema),
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
