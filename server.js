const http = require("http");

require("dotenv").config();

process.env.TZ = "UTC";
const app = require("./config/app");

http.createServer(app).listen(app.get("port"), () => {
  console.log(`FanAnyWhere server listening on port ${app.get("port")}`);
});
