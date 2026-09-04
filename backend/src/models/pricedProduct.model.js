import mongoose from "mongoose";

const pricingTierSchema = new mongoose.Schema(
    {
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const pricedProductSchema = new mongoose.Schema(
    {
        sourceCaptureId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductCapture",
            required: true,
            unique: true,
            index: true,
        },

        barcode: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        costPrice: {
            type: Number,
            min: 0,
            default: null,
        },

        baseUnit: {
            type: String,
            default: "Piece",
            trim: true,
        },

        pricing: {
            type: [pricingTierSchema],
            default: [],
        },

        stock: {
            type: Number,
            default: 99,
            min: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: "pricedproducts",
    }
);

const PricedProduct = mongoose.model(
    "PricedProduct",
    pricedProductSchema
);

export default PricedProduct;