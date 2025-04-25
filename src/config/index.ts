export default {
  JWT_SECRET: "p4sta.w1th-b0logn3s3-s@uce",
  JWT_ALGO: "HS256",

  port: 3000,

  LOG_LEVEL: "debug",

  jwtSecret: "p4sta.w1th-b0logn3s3-s@uce",
  jwtAlgorithm: "HS256",

  logs: {
    level: "silly",
  },

  // api config
  api: {
    prefix: "/api",
  },
  //Postgrpsql Local DB config
  HOST: "localhost",
  USER: "postgres",
  PASSWORD: "123456789",
  DB: "expense",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
