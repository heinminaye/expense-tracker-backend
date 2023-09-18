import express from "express";
import cors from "cors";
import routes from "../api";
import config from "../config";
import bodyParser from "body-parser";
export default ({ app }: { app: express.Application }) => {
  /**
   * Health Check endpoints
   * @TODO Explain why they are here
   */
  app.get("/", function (req, res) {
    res.sendFile("../views/index.html");
  });

  // Enable Cross Origin Resource Sharing to all origins by default
  app.use(cors());

  //Header override
  app.use(require("method-override")());

  // Transforms the raw string of req.body into json
  app.use(express.json());

  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  // Load API routes
  app.use(config.api.prefix, routes());

  /// catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err: any = new Error("Not Found");
    err["status"] = 404;
    next(err);
  });

  /// error handlers
  app.use((err: any, req: any, res: any, next: any) => {
    /**
     * Handle 401 thrown by express-jwt library
     */

    if (err.name === "UnauthorizedError") {
      if (err.message == "No authorization token was found") {
        return res
          .status(err.status)
          .send({
            returncode: "300",
            message: "No authorization token was found",
          })
          .end();
      }

      if (
        err.message == "invalid signature" ||
        err.message == "jwt malformed"
      ) {
        return res
          .status(err.status)
          .send({ returncode: "300", message: "Invalid Token" })
          .end();
      }

      if (err.message == "jwt expired") {
        return res
          .status(err.status)
          .send({ returncode: "301", message: "Token Expired" })
          .end();
      }
    }
    return next(err);
  });
};
