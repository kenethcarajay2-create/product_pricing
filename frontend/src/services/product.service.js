import api from "../api/api";

const getUnpricedProducts =
    async () => {
        const response =
            await api.get(
                "/pricing/products"
            );

        return response.data
            ?.data || [];
    };

const savePricedProduct =
    async (
        captureId,
        pricingData
    ) => {
        const response =
            await api.post(
                `/pricing/products/${captureId}`,
                pricingData
            );

        return response.data
            ?.data;
    };

const getPricedProducts =
    async () => {
        const response =
            await api.get(
                "/pricing/priced"
            );

        return response.data
            ?.data || [];
    };

const updatePricedProduct =
    async (
        id,
        pricingData
    ) => {
        const response =
            await api.patch(
                `/pricing/priced/${id}`,
                pricingData
            );

        return response.data
            ?.data;
    };

const productService = {
    getUnpricedProducts,
    savePricedProduct,
    getPricedProducts,
    updatePricedProduct,
};

export default productService;