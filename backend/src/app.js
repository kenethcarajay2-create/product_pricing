import express from "express";
import cors from "cors";

import pricingRoutes from "./routes/pricing.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

const allowedOrigins = [
    process.env.FRONTEND_URL,

    ...(process.env.NODE_ENV !== "production"
        ? [
              "http://localhost:5173",
              "http://127.0.0.1:5173",
          ]
        : []),
].filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Allow requests without an Origin header
            // such as Postman, health checks, etc.
            if (!origin) {
                return callback(
                    null,
                    true
                );
            }

            if (
                allowedOrigins.includes(
                    origin
                )
            ) {
                return callback(
                    null,
                    true
                );
            }

            console.warn(
                `Blocked CORS origin: ${origin}`
            );

            return callback(
                new Error(
                    "Origin not allowed by CORS."
                )
            );
        },

        credentials: true,
    })
);

app.use(express.json());

app.get(
    "/api/health",
    (req, res) => {
        res.status(200).json({
            success: true,
            message:
                "Pricing API is running",
        });
    }
);

app.use(
    "/api/pricing",
    pricingRoutes
);

app.use(errorHandler);

export default app;