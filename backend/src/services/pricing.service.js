import ProductCapture from "../models/productCapture.model.js";
import PricedProduct from "../models/pricedProduct.model.js";

const getProducts = async () => {
    const pricedProducts = await PricedProduct.find({})
        .select("sourceCaptureId")
        .lean();

    const pricedCaptureIds = pricedProducts.map(
        (product) => product.sourceCaptureId
    );

    return ProductCapture.find({
        _id: {
            $nin: pricedCaptureIds,
        },
    })
        .sort({
            createdAt: 1,
        })
        .lean();
};

const createPricedProduct = async (
    captureId,
    payload
) => {
    const capture = await ProductCapture.findById(
        captureId
    ).lean();

    if (!capture) {
        const error = new Error(
            "Captured product not found."
        );
        error.statusCode = 404;
        throw error;
    }

    const existing = await PricedProduct.findOne({
        $or: [
            {
                sourceCaptureId: capture._id,
            },
            {
                barcode: capture.barcode,
            },
        ],
    }).lean();

    if (existing) {
        const error = new Error(
            "This product has already been priced."
        );
        error.statusCode = 409;
        throw error;
    }

    const sellingPrice = Number(
        payload.sellingPrice
    );

    if (
        !Number.isFinite(sellingPrice) ||
        sellingPrice <= 0
    ) {
        const error = new Error(
            "Selling price must be greater than 0."
        );
        error.statusCode = 400;
        throw error;
    }

    let costPrice = null;

    if (
        payload.costPrice !== undefined &&
        payload.costPrice !== null &&
        payload.costPrice !== ""
    ) {
        costPrice = Number(
            payload.costPrice
        );

        if (
            !Number.isFinite(costPrice) ||
            costPrice < 0
        ) {
            const error = new Error(
                "Cost price must be 0 or greater."
            );
            error.statusCode = 400;
            throw error;
        }
    }

    const bulkPricing = Array.isArray(
        payload.bulkPricing
    )
        ? payload.bulkPricing
        : [];

    const pricing = [
        {
            quantity: 1,
            price: sellingPrice,
        },
    ];

    for (const tier of bulkPricing) {
        const quantity = Number(
            tier.quantity
        );

        const price = Number(
            tier.price
        );

        if (
            !Number.isInteger(quantity) ||
            quantity < 2
        ) {
            const error = new Error(
                "Bulk quantity must be 2 or greater."
            );
            error.statusCode = 400;
            throw error;
        }

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {
            const error = new Error(
                "Bulk price must be greater than 0."
            );
            error.statusCode = 400;
            throw error;
        }

        pricing.push({
            quantity,
            price,
        });
    }

    const quantities = pricing.map(
        (tier) => tier.quantity
    );

    if (
        new Set(quantities).size !==
        quantities.length
    ) {
        const error = new Error(
            "Pricing quantities must be unique."
        );
        error.statusCode = 400;
        throw error;
    }

    pricing.sort(
        (a, b) =>
            a.quantity - b.quantity
    );

    try {
        return await PricedProduct.create({
            sourceCaptureId:
                capture._id,

            barcode:
                capture.barcode,

            name:
                capture.name,

            costPrice,

            pricing,

            stock: 99,
            baseUnit:
                payload.baseUnit ||
                "Piece",
        });
    } catch (error) {
        if (error?.code === 11000) {
            const duplicateError =
                new Error(
                    "This product has already been priced."
                );

            duplicateError.statusCode = 409;

            throw duplicateError;
        }

        throw error;
    }
};

const getPricedProducts = async () => {
    return PricedProduct.find({})
        .sort({
            updatedAt: -1,
        })
        .lean();
};

const updatePricedProduct = async (
    id,
    payload
) => {
    const product =
        await PricedProduct.findById(id);

    if (!product) {
        const error = new Error(
            "Priced product not found."
        );
        error.statusCode = 404;
        throw error;
    }

    if (
        payload.costPrice !== undefined
    ) {
        if (
            payload.costPrice === null ||
            payload.costPrice === ""
        ) {
            product.costPrice = null;
        } else {
            const costPrice =
                Number(
                    payload.costPrice
                );

            if (
                !Number.isFinite(
                    costPrice
                ) ||
                costPrice < 0
            ) {
                const error =
                    new Error(
                        "Cost price must be 0 or greater."
                    );
                error.statusCode = 400;
                throw error;
            }

            product.costPrice =
                costPrice;
        }
    }

    if (
        payload.sellingPrice ===
            undefined ||
        payload.sellingPrice ===
            null ||
        payload.sellingPrice === ""
    ) {
        const error = new Error(
            "Selling price is required."
        );
        error.statusCode = 400;
        throw error;
    }

    const sellingPrice =
        Number(
            payload.sellingPrice
        );

    if (
        !Number.isFinite(
            sellingPrice
        ) ||
        sellingPrice <= 0
    ) {
        const error = new Error(
            "Selling price must be greater than 0."
        );
        error.statusCode = 400;
        throw error;
    }

    const bulkPricing =
        Array.isArray(
            payload.bulkPricing
        )
            ? payload.bulkPricing
            : [];

    const pricing = [
        {
            quantity: 1,
            price: sellingPrice,
        },
    ];

    const quantities =
        new Set([1]);

    for (const tier of bulkPricing) {
        const quantity =
            Number(
                tier.quantity
            );

        const price =
            Number(
                tier.price
            );

        if (
            !Number.isInteger(
                quantity
            ) ||
            quantity < 2
        ) {
            const error =
                new Error(
                    "Bulk quantity must be 2 or greater."
                );
            error.statusCode = 400;
            throw error;
        }

        if (
            quantities.has(
                quantity
            )
        ) {
            const error =
                new Error(
                    "Pricing quantities must be unique."
                );
            error.statusCode = 400;
            throw error;
        }

        if (
            !Number.isFinite(
                price
            ) ||
            price <= 0
        ) {
            const error =
                new Error(
                    "Bulk price must be greater than 0."
                );
            error.statusCode = 400;
            throw error;
        }

        quantities.add(
            quantity
        );

        pricing.push({
            quantity,
            price,
        });
    }

    pricing.sort(
        (a, b) =>
            a.quantity -
            b.quantity
    );

    product.pricing = pricing;

    if (
        typeof payload.baseUnit ===
            "string" &&
        payload.baseUnit.trim()
    ) {
        product.baseUnit =
            payload.baseUnit.trim();
    }

    if (
        payload.stock !==
        undefined
    ) {
        const stock =
            Number(
                payload.stock
            );

        if (
            !Number.isFinite(stock) ||
            stock < 0
        ) {
            const error =
                new Error(
                    "Stock must be 0 or greater."
                );
            error.statusCode = 400;
            throw error;
        }

        product.stock =
            stock;
    }

    if (
        typeof payload.isActive ===
        "boolean"
    ) {
        product.isActive =
            payload.isActive;
    }

    return product.save();
};

export {
    getProducts,
    createPricedProduct,
    getPricedProducts,
    updatePricedProduct,
};