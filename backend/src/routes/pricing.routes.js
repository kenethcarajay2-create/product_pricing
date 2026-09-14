import express from "express";

import * as pricingController from "../controllers/pricing.controller.js";

const router =
    express.Router();

router.get(
    "/products",
    pricingController.getProducts
);

router.post(
    "/products/:captureId",
    pricingController.createPricedProduct
);

router.get(
    "/priced",
    pricingController.getPricedProducts
);

router.patch(
    "/priced/:id",
    pricingController.updatePricedProduct
);

router.delete(
    "/priced/:id",
    pricingController.deletePricedProduct
);

export default router;