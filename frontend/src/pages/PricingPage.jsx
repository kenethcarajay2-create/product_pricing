// src/pages/PricingPage.jsx

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import ProductList from "../components/ProductList";
import PricingEditor from "../components/PricingEditor";
import productService from "../services/product.service";

function PricingPage() {
    const [mode, setMode] =
        useState("unpriced");

    const [
        unpricedProducts,
        setUnpricedProducts,
    ] = useState([]);

    const [
        pricedProducts,
        setPricedProducts,
    ] = useState([]);

    const [
        selectedProductId,
        setSelectedProductId,
    ] = useState(null);

    const [loading, setLoading] =
        useState(true);

    const [loadError, setLoadError] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const currentProducts =
        mode === "unpriced"
            ? unpricedProducts
            : pricedProducts;

    const selectedProduct =
        useMemo(() => {
            return (
                currentProducts.find(
                    (product) =>
                        product._id ===
                        selectedProductId
                ) || null
            );
        }, [
            currentProducts,
            selectedProductId,
        ]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setLoadError("");

            const [
                unpriced,
                priced,
            ] = await Promise.all([
                productService.getUnpricedProducts(),
                productService.getPricedProducts(),
            ]);

            setUnpricedProducts(
                unpriced
            );

            setPricedProducts(
                priced
            );

            const initialProducts =
                mode === "unpriced"
                    ? unpriced
                    : priced;

            setSelectedProductId(
                initialProducts[0]
                    ?._id || null
            );
        } catch (error) {
            console.error(error);

            setLoadError(
                error.response?.data
                    ?.message ||
                    "Unable to load products."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleModeChange = (
        nextMode
    ) => {
        if (saving) {
            return;
        }

        setMode(nextMode);
        setMessage("");

        const products =
            nextMode === "unpriced"
                ? unpricedProducts
                : pricedProducts;

        setSelectedProductId(
            products[0]?._id || null
        );
    };

    const handleSelectProduct = (
        productId
    ) => {
        if (saving) {
            return;
        }

        setMessage("");
        setSelectedProductId(
            productId
        );
    };

    const getNextProduct = (
        sourceProducts,
        currentId
    ) => {
        if (
            sourceProducts.length ===
            0
        ) {
            return null;
        }

        const currentIndex =
            sourceProducts.findIndex(
                (product) =>
                    product._id ===
                    currentId
            );

        if (currentIndex === -1) {
            return sourceProducts[0];
        }

        const nextIndex =
            currentIndex >=
            sourceProducts.length - 1
                ? 0
                : currentIndex + 1;

        return sourceProducts[
            nextIndex
        ];
    };

    const handleSavePricing =
        async (
            pricingData,
            {
                goNext = false,
            } = {}
        ) => {
            if (!selectedProduct) {
                return;
            }

            try {
                setSaving(true);
                setMessage("");

                if (
                    mode === "unpriced"
                ) {
                    const savedProduct =
                        await productService.savePricedProduct(
                            selectedProduct._id,
                            pricingData
                        );

                    const remaining =
                        unpricedProducts.filter(
                            (product) =>
                                product._id !==
                                selectedProduct._id
                        );

                    setUnpricedProducts(
                        remaining
                    );

                    setPricedProducts(
                        (current) => [
                            savedProduct,
                            ...current,
                        ]
                    );

                    setMessage(
                        "Pricing saved successfully."
                    );

                    if (
                        remaining.length ===
                        0
                    ) {
                        setSelectedProductId(
                            null
                        );

                        return;
                    }

                    const nextProduct =
                        remaining[0];

                    setSelectedProductId(
                        nextProduct._id
                    );

                    return;
                }

                const updatedProduct =
                    await productService.updatePricedProduct(
                        selectedProduct._id,
                        pricingData
                    );

                setPricedProducts(
                    (current) =>
                        current.map(
                            (product) =>
                                product._id ===
                                updatedProduct._id
                                    ? updatedProduct
                                    : product
                        )
                );

                setMessage(
                    "Pricing updated successfully."
                );

                if (goNext) {
                    const nextProduct =
                        getNextProduct(
                            pricedProducts,
                            selectedProduct._id
                        );

                    if (
                        nextProduct &&
                        nextProduct._id !==
                            selectedProduct._id
                    ) {
                        setSelectedProductId(
                            nextProduct._id
                        );
                    }
                }
            } catch (error) {
                console.error(error);

                setMessage(
                    error.response?.data
                        ?.message ||
                        "Unable to save pricing."
                );
            } finally {
                setSaving(false);
            }
        };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-sm font-medium text-slate-600">
                    Loading products...
                </p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center">
                    <h2 className="font-bold text-slate-900">
                        Unable to load
                        products
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                        {loadError}
                    </p>

                    <button
                        type="button"
                        onClick={
                            loadProducts
                        }
                        className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                            Product Pricing
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage new and
                            existing product
                            prices.
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="mb-5 flex gap-2 lg:hidden">
                    <ModeButton
                        active={
                            mode ===
                            "unpriced"
                        }
                        onClick={() =>
                            handleModeChange(
                                "unpriced"
                            )
                        }
                    >
                        Unpriced (
                        {
                            unpricedProducts.length
                        }
                        )
                    </ModeButton>

                    <ModeButton
                        active={
                            mode ===
                            "priced"
                        }
                        onClick={() =>
                            handleModeChange(
                                "priced"
                            )
                        }
                    >
                        Priced (
                        {
                            pricedProducts.length
                        }
                        )
                    </ModeButton>
                </div>

                <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                    <ProductList
                        products={
                            currentProducts
                        }
                        mode={mode}
                        unpricedCount={
                            unpricedProducts.length
                        }
                        pricedCount={
                            pricedProducts.length
                        }
                        selectedProductId={
                            selectedProductId
                        }
                        onModeChange={
                            handleModeChange
                        }
                        onSelectProduct={
                            handleSelectProduct
                        }
                        disabled={
                            saving
                        }
                    />

                    <PricingEditor
                        key={`${mode}-${selectedProduct?._id}`}
                        product={
                            selectedProduct
                        }
                        mode={mode}
                        saving={
                            saving
                        }
                        message={
                            message
                        }
                        onSave={
                            handleSavePricing
                        }
                        desktop
                    />
                </div>
            </main>
        </div>
    );
}

function ModeButton({
    active,
    onClick,
    children,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                active
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700"
            }`}
        >
            {children}
        </button>
    );
}

export default PricingPage;