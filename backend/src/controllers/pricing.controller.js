import * as pricingService from "../services/pricing.service.js";

const getProducts = async (
    req,
    res,
    next
) => {
    try {
        const products =
            await pricingService.getProducts();

        res.status(200).json({
            success: true,
            message:
                "Products retrieved successfully.",
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

const createPricedProduct = async (
    req,
    res,
    next
) => {
    try {
        const product =
            await pricingService.createPricedProduct(
                req.params.captureId,
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Product priced successfully.",
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

const getPricedProducts = async (
    req,
    res,
    next
) => {
    try {
        const products =
            await pricingService.getPricedProducts();

        res.status(200).json({
            success: true,
            message:
                "Priced products retrieved successfully.",
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

const updatePricedProduct =
    async (
        req,
        res,
        next
    ) => {
        try {
            const product =
                await pricingService.updatePricedProduct(
                    req.params.id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Priced product updated successfully.",
                data: product,
            });
        } catch (error) {
            next(error);
        }
    };

export {
    getProducts,
    createPricedProduct,
    getPricedProducts,
    updatePricedProduct,
};