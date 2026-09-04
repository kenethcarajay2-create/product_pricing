import mongoose from "mongoose";

const productCaptureSchema = new mongoose.Schema(
    {
        barcode: {
            type: String,
            required: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        source: {
            type: String,
            default: "mobile",
            trim: true,
        },

        syncedToStore: {
            type: Boolean,
            default: false,
        },

        syncedToStoreAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "productcaptures",
    }
);

const ProductCapture = mongoose.model(
    "ProductCapture",
    productCaptureSchema
);

export default ProductCapture;