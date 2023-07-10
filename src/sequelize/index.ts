import config from '../config';
import { Sequelize } from 'sequelize';
import tedious from 'tedious';
//create connection
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: "postgres",
  dialectModule: tedious,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
  dialectOptions: {
    encrypt: true
  }
});

export default sequelize;