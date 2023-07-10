import { Service, Inject } from 'typedi';
import jwt from 'jsonwebtoken';
import config from '../config';
import argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { Router, Request, Response, NextFunction } from 'express';
import jwt_decode from "jwt-decode";
import { IUser, UserLogin } from '../interfaces/user';
import { v4 as uuidv4 } from 'uuid';

declare module 'jsonwebtoken' {
  export interface UserIDJwtPayload extends jwt.JwtPayload {
    userid: string,
    exp: number,
  }
}

@Service()
export default class AuthService {
  constructor(
    @Inject('userModel') private userModel: any,
    // @Inject('noti_deviceModel') private noti_deviceModel: any,
  ) {
  }

  public async SignIn(UserLogin: UserLogin) {

    var userRecord: any;

    await this.userModel.services.findAll(
      { where: { user_id: UserLogin.user_id, is_deleted: false } }
    ).then((data: any) => {
      if (data.length > 0) {
        userRecord = data[0]
      }
    })

    if (!userRecord) {
      return { returncode: "300", message: "User Not Found" };
    }
    var decoded = Buffer.from(userRecord.password, 'base64').toString('utf8') 
    var validPassword: boolean = false;
    if(decoded == UserLogin.password){
      validPassword = true;
    }

    if (validPassword) {
      // update session expired to false
      await this.userModel.services
        .update({ sessionexpired: false }, {
          where: { user_id: UserLogin.user_id, is_deleted: false }
        })
        .then((data: any) => {
          if (data == 1) {
            console.log("session updated ----------")
          } else {
            console.log("error in updating session ------>")
          }
        });

      const token = this.generateToken(userRecord);
      const data = {
        "user_id": userRecord.user_id,
        "user_name": userRecord.user_name,
        "role": userRecord.role,
        "branch": userRecord.branch,
        "remark": userRecord.remark,
      };

      if (UserLogin.fcmtoken == undefined || "") {
        return { returncode: "200", message: "Success", data, token};
      }

      try {
        const noti_device_id = "noti_device_id_" + Math.floor(1000000000 + Math.random() * 9000000000) + Date.now();
        const notiDeviceData = {
          noti_device_id,
          ...UserLogin,
        }

        var dataCheck: any;

        // await this.noti_deviceModel.services.findAll(
        //   { where: { userid: UserLogin.userid, uuid: UserLogin.uuid } }
        // ).then((data: any) => {
        //   if (data.length > 0) {
        //     dataCheck = data[0];
        //   }
        // });

        if (!dataCheck) {
          var newRecord: any;
          // await this.noti_deviceModel.services.create(notiDeviceData).then(
          //   (data: any) => {
          //     newRecord = data
          //   }
          // )
          return { returncode: "200", message: "Success", data, token };
        }

        if (dataCheck) {

          try {

            var filter = { user_id : UserLogin.user_id, };
            var update = {
              user_id: UserLogin.user_id,
              fcmtoken: UserLogin.fcmtoken
            }

            console.log(update);

            // await this.noti_deviceModel.services
            //   .update(update, {
            //     where: filter,
            //   }).then((data: any) => {
            //     if (data) {
            //       if (data == 1) {
            //         return { returncode: "200", message: "Success", data, token };
            //       } else {
            //         return { returncode: "300", message: "Fail" };
            //       }
            //     }
            //   });
          } catch (e) {
            return { returncode: "300", message: "Fail" }
          }
        }
      }
      catch (e) {
        return { returncode: "300", message: "Fail" };
      }
      return { returncode: "200", message: "Success", data, token };
    } else {
      return { returncode: "300", message: "Invalid Phone Number or Password" };
    }
  }

  //refresh token -> useid, token
  public async RefreshToken(req: Request) {

    var token = req.body.token;

    try {
      var decodedToken = <jwt.UserIDJwtPayload>jwt_decode(token);
      var useridfromtoken = decodedToken.user_id;
      var exp = decodedToken.exp;
    }
    catch (e) {
      return { returncode: "300", message: "Invalid Token" };
    }
    if (req.body.user_id != useridfromtoken) {
      return { returncode: "300", message: "Unauthorized User" };
    }
    if (Date.now() >= exp * 1000) {

      var userRecord: any;

      await this.userModel.services.findAll(
        { where: { user_id : useridfromtoken, is_deleted: false } }
      ).then((data: any) => {
        if (data.length > 0) {
          userRecord = data[0]
        }
      })

      if (!userRecord) {
        return { returncode: "300", message: "User Not Found" };
      }
      else {
        const token = this.generateToken(userRecord);
        const data = {};
        return { returncode: "200", message: "Successfully generated token", data, token };
        // return { user, token };
      }
    } else {
      var data: any;
      return { returncode: "200", message: "Token is valid", data, token };
    }
  }

  private generateToken(user: any) {

    return jwt.sign(
      {
        user_id: user.user_id,
      },
      config.jwtSecret!,
      {
        expiresIn: "1d",
      }
    );
  }
}

