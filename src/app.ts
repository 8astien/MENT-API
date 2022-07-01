import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config(); // used to load config variables with .env trick
import config from "config";
import responseTime from "response-time";
import connect from "./utils/connect";
import logger from "./utils/logger";
import routes from "./routes/public/routes";
import deserializeUser from "./middleware/deserializeUser";
import { restResponseTimeHistogram, startMetricsServer } from "./utils/metrics";
import swaggerDocs from "./utils/swagger";

const port = config.get<number>("port");

const app = express();

// CORS VERCEL : https://exo-auth-frontend.vercel.app
// CORS LOCAL : *


app.use(express.json());
app.use(deserializeUser);
app.use(cors({
  origin: 'https://exo-auth-frontend.vercel.app'
}));

app.use(
  responseTime((req: Request, res: Response, time: number) => {
    if (req?.route?.path) {
      restResponseTimeHistogram.observe(
        {
          method: req.method,
          route: req.route.path,
          status_code: res.statusCode,
        },
        time * 1000 
      );
    }
  })
);

app.listen(port, async () => {
  logger.info(`App is running at http://localhost:${port}`);

  await connect();

  routes(app);

  startMetricsServer();

  swaggerDocs(app, port);
});
