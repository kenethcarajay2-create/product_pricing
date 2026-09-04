// src/components/ProductList.jsx

import {
    useMemo,
    useState,
} from "react";

function ProductList({
    products,
    mode,
    unpricedCount,
    pricedCount,
    selectedProductId,
    onModeChange,
    onSelectProduct,
    disabled,
}) {
    const [search, setSearch] =
        useState("");

    const filteredProducts =
        useMemo(() => {
            const query = search
                .trim()
                .toLowerCase();

            if (!query) {
                return products;
            }

            return products.filter(
                (product) =>
                    [
                        product.name,
                        product.barcode,
                    ].some((value) =>
                        String(
                            value || ""
                        )
                            .toLowerCase()
                            .includes(query)
                    )
            );
        }, [products, search]);

    return (
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
                <div className="hidden grid-cols-2 gap-2 lg:grid">
                    <button
                        type="button"
                        onClick={() =>
                            onModeChange(
                                "unpriced"
                            )
                        }
                        disabled={
                            disabled
                        }
                        className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                            mode ===
                            "unpriced"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600"
                        }`}
                    >
                        Unpriced (
                        {unpricedCount})
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            onModeChange(
                                "priced"
                            )
                        }
                        disabled={
                            disabled
                        }
                        className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                            mode ===
                            "priced"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600"
                        }`}
                    >
                        Priced (
                        {pricedCount})
                    </button>
                </div>

                <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target
                                .value
                        )
                    }
                    placeholder="Search product or barcode..."
                    className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
            </div>

            <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {filteredProducts.length ===
                0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No products found.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredProducts.map(
                            (product) => {
                                const selected =
                                    product._id ===
                                    selectedProductId;

                                const regularPrice =
                                    product.pricing?.find(
                                        (
                                            tier
                                        ) =>
                                            tier.quantity ===
                                            1
                                    )?.price;

                                return (
                                    <button
                                        key={
                                            product._id
                                        }
                                        type="button"
                                        onClick={() =>
                                            onSelectProduct(
                                                product._id
                                            )
                                        }
                                        disabled={
                                            disabled
                                        }
                                        className={`w-full p-4 text-left ${
                                            selected
                                                ? "bg-slate-900 text-white"
                                                : "hover:bg-slate-50"
                                        }`}
                                    >
                                        <p className="truncate font-semibold">
                                            {product.name}
                                        </p>

                                        <p
                                            className={`mt-1 truncate font-mono text-xs ${
                                                selected
                                                    ? "text-slate-300"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            {
                                                product.barcode
                                            }
                                        </p>

                                        {mode ===
                                            "priced" &&
                                            regularPrice !==
                                                undefined && (
                                                <p
                                                    className={`mt-2 text-sm font-bold ${
                                                        selected
                                                            ? "text-white"
                                                            : "text-emerald-700"
                                                    }`}
                                                >
                                                    ₱
                                                    {Number(
                                                        regularPrice
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </p>
                                            )}
                                    </button>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default ProductList;