import jwt from 'jsonwebtoken';
import jwt_decode from "jwt-decode";
const userModel = require('../../models/user');

declare module 'jsonwebtoken' {
    export interface UserIDJwtPayload extends jwt.JwtPayload {
        user_id: string,
        exp: number,
    }
}

module.exports = async (req: any, res: any, next: any) => {

    req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token' ||
        req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer'

    var token = req.headers.authorization.split(' ')[1];
    try {
        var decodedToken = <jwt.UserIDJwtPayload>jwt_decode(token);
        var useridfromtoken = decodedToken.user_id;

        var userCheck: any;
        var sessionexpired : any ;

        await userModel.services.findAll(
            { where: { user_id: req.body.user_id } }
        ).then((data: any) => {
            if (data.length > 0) {
                userCheck = data[0]
                console.log("<<<<<<<<<<"+useridfromtoken);
            }
        })

        if (req.body.user_id != useridfromtoken) {
            const returncode = "300";
            const message = "Invalid User ID and Token"
            res.status(200).json({
                returncode, message
            });
        }

        else {
            if (sessionexpired == true ) {
                const returncode = "302";
                const message = "Session Expired"
                res.status(200).json({
                    returncode, message
                });
            }
            else {
                next();
            }
        }

    }
    catch (e) {
        console.log(e);
        res.status(401).json({
            returncode: "301", message: "Invalid Token"
        })
    }
};