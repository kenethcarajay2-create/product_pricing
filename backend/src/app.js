import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import pricingRoutes from "./routes/pricing.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

app.use(
    cors({
        origin: true,
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

const frontendDistPath =
    path.resolve(
        __dirname,
        "../../frontend/dist"
    );

app.use(
    express.static(
        frontendDistPath
    )
);

// React/Vite SPA fallback
app.get(
    "/{*splat}",
    (req, res) => {
        res.sendFile(
            path.join(
                frontendDistPath,
                "index.html"
            )
        );
    }
);

app.use(errorHandler);

export default app;