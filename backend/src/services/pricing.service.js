import ProductCapture from "../models/productCapture.model.js";
import PricedProduct from "../models/pricedProduct.model.js";

/*
 * Pricing rule used throughout this service:
 *
 * {
 *     quantity: 6,
 *     price: 1000
 * }
 *
 * means:
 *
 * 6 pieces = ₱1,000 TOTAL
 *
 * Therefore:
 *
 * effective unit price = 1000 / 6
 *
 * We intentionally keep the original bundle price in MongoDB
 * instead of replacing it with a rounded per-piece price.
 */

const calculateUnitPrice = (
    quantity,
    bundlePrice
) => {
    const parsedQuantity = Number(
        quantity
    );

    const parsedBundlePrice = Number(
        bundlePrice
    );

    if (
        !Number.isFinite(
            parsedQuantity
        ) ||
        parsedQuantity <= 0 ||
        !Number.isFinite(
            parsedBundlePrice
        )
    ) {
        return 0;
    }

    return (
        parsedBundlePrice /
        parsedQuantity
    );
};

/*
 * Adds unitPrice to every pricing tier returned by the API.
 *
 * Nothing about the stored database structure changes.
 *
 * Example stored tier:
 *
 * {
 *     quantity: 6,
 *     price: 1000
 * }
 *
 * API result:
 *
 * {
 *     quantity: 6,
 *     price: 1000,
 *     unitPrice: 166.66666666666666
 * }
 */
const formatPricedProduct = (
    product
) => {
    if (!product) {
        return product;
    }

    const plainProduct =
        typeof product.toObject ===
        "function"
            ? product.toObject()
            : {
                  ...product,
              };

    const pricing =
        Array.isArray(
            plainProduct.pricing
        )
            ? plainProduct.pricing.map(
                  (tier) => {
                      const quantity =
                          Number(
                              tier.quantity
                          );

                      const price =
                          Number(
                              tier.price
                          );

                      return {
                          ...tier,

                          quantity,

                          /*
                           * price remains the TOTAL
                           * bundle/tier price.
                           */
                          price,

                          /*
                           * unitPrice is calculated
                           * from the bundle total.
                           */
                          unitPrice:
                              calculateUnitPrice(
                                  quantity,
                                  price
                              ),
                      };
                  }
              )
            : [];

    return {
        ...plainProduct,
        pricing,
    };
};

const formatPricedProducts = (
    products
) => {
    if (!Array.isArray(products)) {
        return [];
    }

    return products.map(
        formatPricedProduct
    );
};

const getProducts = async () => {
    const pricedProducts =
        await PricedProduct.find({})
            .select(
                "sourceCaptureId"
            )
            .lean();

    const pricedCaptureIds =
        pricedProducts.map(
            (product) =>
                product.sourceCaptureId
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

const createPricedProduct =
    async (
        captureId,
        payload
    ) => {
        const capture =
            await ProductCapture.findById(
                captureId
            ).lean();

        if (!capture) {
            const error =
                new Error(
                    "Captured product not found."
                );

            error.statusCode = 404;

            throw error;
        }

        const existing =
            await PricedProduct.findOne(
                {
                    $or: [
                        {
                            sourceCaptureId:
                                capture._id,
                        },
                        {
                            barcode:
                                capture.barcode,
                        },
                    ],
                }
            ).lean();

        if (existing) {
            const error =
                new Error(
                    "This product has already been priced."
                );

            error.statusCode = 409;

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
            const error =
                new Error(
                    "Selling price must be greater than 0."
                );

            error.statusCode = 400;

            throw error;
        }

        let costPrice = null;

        if (
            payload.costPrice !==
                undefined &&
            payload.costPrice !==
                null &&
            payload.costPrice !== ""
        ) {
            costPrice =
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

                error.statusCode =
                    400;

                throw error;
            }
        }

        const bulkPricing =
            Array.isArray(
                payload.bulkPricing
            )
                ? payload.bulkPricing
                : [];

        /*
         * Quantity 1 is naturally also a
         * one-item bundle.
         *
         * Example:
         *
         * quantity: 1
         * price: 180
         *
         * means:
         *
         * 1 piece = ₱180
         */
        const pricing = [
            {
                quantity: 1,
                price: sellingPrice,
            },
        ];

        for (const tier of bulkPricing) {
            const quantity =
                Number(
                    tier.quantity
                );

            /*
             * IMPORTANT:
             *
             * tier.price is NOT a
             * per-piece price.
             *
             * It is the TOTAL price
             * for quantity pieces.
             *
             * Example:
             *
             * quantity = 6
             * price = 1000
             *
             * means:
             *
             * 6 pieces = ₱1000
             */
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

                error.statusCode =
                    400;

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

                error.statusCode =
                    400;

                throw error;
            }

            pricing.push({
                quantity,

                /*
                 * Keep the exact bundle
                 * total in the database.
                 */
                price,
            });
        }

        const quantities =
            pricing.map(
                (tier) =>
                    tier.quantity
            );

        if (
            new Set(
                quantities
            ).size !==
            quantities.length
        ) {
            const error =
                new Error(
                    "Pricing quantities must be unique."
                );

            error.statusCode = 400;

            throw error;
        }

        pricing.sort(
            (a, b) =>
                a.quantity -
                b.quantity
        );

        try {
            const product =
                await PricedProduct.create(
                    {
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
                    }
                );

            /*
             * Return calculated
             * unitPrice values as well.
             */
            return formatPricedProduct(
                product
            );
        } catch (error) {
            if (
                error?.code ===
                11000
            ) {
                const duplicateError =
                    new Error(
                        "This product has already been priced."
                    );

                duplicateError.statusCode =
                    409;

                throw duplicateError;
            }

            throw error;
        }
    };

const getPricedProducts =
    async () => {
        const products =
            await PricedProduct.find(
                {}
            )
                .sort({
                    updatedAt: -1,
                })
                .lean();

        return formatPricedProducts(
            products
        );
    };

const updatePricedProduct =
    async (
        id,
        payload
    ) => {
        const product =
            await PricedProduct.findById(
                id
            );

        if (!product) {
            const error =
                new Error(
                    "Priced product not found."
                );

            error.statusCode = 404;

            throw error;
        }

        if (
            payload.costPrice !==
            undefined
        ) {
            if (
                payload.costPrice ===
                    null ||
                payload.costPrice ===
                    ""
            ) {
                product.costPrice =
                    null;
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

                    error.statusCode =
                        400;

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
            payload.sellingPrice ===
                ""
        ) {
            const error =
                new Error(
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
            const error =
                new Error(
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

        for (
            const tier of
            bulkPricing
        ) {
            const quantity =
                Number(
                    tier.quantity
                );

            /*
             * Again, this is the
             * TOTAL bundle price.
             *
             * Example:
             *
             * quantity: 6
             * price: 1000
             *
             * = 6 pieces for ₱1000.
             */
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

                error.statusCode =
                    400;

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

                error.statusCode =
                    400;

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

                error.statusCode =
                    400;

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

        product.pricing =
            pricing;

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
                !Number.isFinite(
                    stock
                ) ||
                stock < 0
            ) {
                const error =
                    new Error(
                        "Stock must be 0 or greater."
                    );

                error.statusCode =
                    400;

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

        const savedProduct =
            await product.save();

        return formatPricedProduct(
            savedProduct
        );
    };

export {
    getProducts,
    createPricedProduct,
    getPricedProducts,
    updatePricedProduct,
};