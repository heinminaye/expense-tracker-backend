// import { celebrate, Joi } from 'celebrate';
const Joi = require('joi');

module.exports = (schema : any, req : any) => {

    return (req: any, res: any, next: any) => {

    const { error } = schema.validate(req.body);

    if (error != undefined) {
        const returncode = "300";
        const message = error.message
        res.status(200).json({
            returncode, 
            message,
            // errorCause: result.error.name,
        });
    }
    next();
}
};