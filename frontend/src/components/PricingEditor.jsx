import {
    useEffect,
    useState,
} from "react";

import PricingSummary from "./PricingSummary";

function PricingEditor({
    product,
    mode,
    saving,
    message,
    onSave,
    desktop = false,
}) {
    const [costPrice, setCostPrice] =
        useState("");

    const [
        sellingPrice,
        setSellingPrice,
    ] = useState("");

    const [
        bulkPricing,
        setBulkPricing,
    ] = useState([]);

    const [
        validationError,
        setValidationError,
    ] = useState("");

    useEffect(() => {
    setValidationError("");

    if (!product) {
        setCostPrice("");
        setSellingPrice("");
        setBulkPricing([]);
        return;
    }

    if (mode === "priced") {
        const regularTier =
            product.pricing?.find(
                (tier) =>
                    tier.quantity === 1
            );

        const bulkTiers =
            (product.pricing || [])
                .filter(
                    (tier) =>
                        tier.quantity > 1
                )
                .map((tier) => ({
                    quantity: String(
                        tier.quantity
                    ),
                    price: String(
                        tier.price
                    ),
                }));

        setCostPrice(
            product.costPrice ===
                null ||
                product.costPrice ===
                    undefined
                ? ""
                : String(
                      product.costPrice
                  )
        );

        setSellingPrice(
            regularTier
                ? String(
                      regularTier.price
                  )
                : ""
        );

        setBulkPricing(
            bulkTiers
        );
    } else {
        setCostPrice("");
        setSellingPrice("");
        setBulkPricing([]);
    }
}, [product?._id, mode]);

    if (!product) {
        return (
            <section className="flex min-h-[500px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-center">
                    <h2 className="font-bold text-slate-900">
                        No product
                        selected
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Select a product
                        to start pricing.
                    </p>
                </div>
            </section>
        );
    }

    const addBulkTier = () => {
        setBulkPricing(
            (current) => [
                ...current,
                {
                    quantity: "",
                    price: "",
                },
            ]
        );
    };

    const updateBulkTier = (
        index,
        field,
        value
    ) => {
        setBulkPricing(
            (current) =>
                current.map(
                    (tier, tierIndex) =>
                        tierIndex ===
                        index
                            ? {
                                  ...tier,
                                  [field]:
                                      value,
                              }
                            : tier
                )
        );
    };

    const removeBulkTier = (
        index
    ) => {
        setBulkPricing(
            (current) =>
                current.filter(
                    (_, tierIndex) =>
                        tierIndex !==
                        index
                )
        );
    };

    const validateForm = () => {
        const selling =
            Number(sellingPrice);

        if (
            sellingPrice === "" ||
            !Number.isFinite(
                selling
            ) ||
            selling <= 0
        ) {
            return "Selling price must be greater than 0.";
        }

        if (costPrice !== "") {
            const cost =
                Number(costPrice);

            if (
                !Number.isFinite(
                    cost
                ) ||
                cost < 0
            ) {
                return "Cost price must be 0 or greater.";
            }
        }

        const quantities =
            new Set();

        for (
            let index = 0;
            index <
            bulkPricing.length;
            index++
        ) {
            const tier =
                bulkPricing[index];

            const quantity =
                Number(
                    tier.quantity
                );

            const price =
                Number(tier.price);

            if (
                !Number.isInteger(
                    quantity
                ) ||
                quantity < 2
            ) {
                return `Bulk tier ${
                    index + 1
                }: quantity must be 2 or greater.`;
            }

            if (
                quantities.has(
                    quantity
                )
            ) {
                return "Bulk pricing quantities must be unique.";
            }

            quantities.add(
                quantity
            );

            if (
                !Number.isFinite(
                    price
                ) ||
                price <= 0
            ) {
                return `Bulk tier ${
                    index + 1
                }: price must be greater than 0.`;
            }
        }

        return "";
    };

    const submitPricing = async (
        goNext
    ) => {
        if (saving) {
            return;
        }

        const error =
            validateForm();

        if (error) {
            setValidationError(
                error
            );

            return;
        }

        setValidationError("");

        const payload = {
            sellingPrice:
                Number(
                    sellingPrice
                ),

            costPrice:
                costPrice === ""
                    ? null
                    : Number(
                          costPrice
                      ),

            baseUnit: "Piece",

            bulkPricing:
                bulkPricing
                    .map(
                        (tier) => ({
                            quantity:
                                Number(
                                    tier.quantity
                                ),
                            price: Number(
                                tier.price
                            ),
                        })
                    )
                    .sort(
                        (a, b) =>
                            a.quantity -
                            b.quantity
                    ),
        };

        await onSave(payload, {
            goNext,
        });
    };

    const handleSubmit = (
        event
    ) => {
        event.preventDefault();

        submitPricing(true);
    };

    const displayMessage =
        validationError || message;

    const messageIsError =
        Boolean(validationError) ||
        Boolean(
            message &&
                !message
                    .toLowerCase()
                    .includes(
                        "success"
                    )
        );

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
    {mode === "priced"
        ? "Editing Priced Product"
        : "Pricing Product"}
</p>

                        <h2 className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl">
                            {product.name ||
                                "Unnamed Product"}
                        </h2>

                        <p className="mt-2 break-all font-mono text-xs text-slate-500 sm:text-sm">
                            {product.barcode ||
                                "No barcode"}
                        </p>
                    </div>

                    {product.source && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                            {
                                product.source
                            }
                        </span>
                    )}
                </div>
            </div>

            <form
                id={
                    desktop
                        ? "desktop-pricing-form"
                        : "mobile-pricing-form"
                }
                onSubmit={
                    handleSubmit
                }
                className="space-y-5 p-4 sm:p-5"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <PriceInput
                        label="Cost Price"
                        value={
                            costPrice
                        }
                        onChange={
                            setCostPrice
                        }
                        placeholder="Optional"
                        disabled={
                            saving
                        }
                        helpText="Optional"
                    />

                    <PriceInput
                        label="Selling Price"
                        value={
                            sellingPrice
                        }
                        onChange={
                            setSellingPrice
                        }
                        placeholder="0.00"
                        disabled={
                            saving
                        }
                        required
                        autoFocus={
                            desktop
                        }
                    />
                </div>

                <PricingSummary
                    costPrice={
                        costPrice
                    }
                    sellingPrice={
                        sellingPrice
                    }
                />

                <div className="border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-slate-900">
                                Bulk Pricing
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Optional
                                quantity
                                discounts.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                addBulkTier
                            }
                            disabled={
                                saving
                            }
                            className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            + Add Tier
                        </button>
                    </div>

                    {bulkPricing.length ===
                    0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                            <p className="text-sm font-medium text-slate-600">
                                No bulk
                                pricing
                                configured.
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Add a tier
                                for wholesale
                                or quantity
                                pricing.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {bulkPricing.map(
                                (
                                    tier,
                                    index
                                ) => (
                                    <BulkTierRow
                                        key={
                                            index
                                        }
                                        index={
                                            index
                                        }
                                        tier={
                                            tier
                                        }
                                        disabled={
                                            saving
                                        }
                                        onChange={
                                            updateBulkTier
                                        }
                                        onRemove={
                                            removeBulkTier
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>

                {displayMessage && (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                            messageIsError
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                    >
                        {
                            displayMessage
                        }
                    </div>
                )}

                {desktop && (
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                        <button
    type="button"
    disabled={saving}
    onClick={() =>
        submitPricing(false)
    }
    className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700"
>
    {saving
        ? "Saving..."
        : mode === "priced"
        ? "Save Changes"
        : "Save"}
</button>

<button
    type="submit"
    disabled={saving}
    className="min-h-11 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white"
>
    {saving
        ? "Saving..."
        : mode === "priced"
        ? "Save Changes & Next"
        : "Save & Next"}
</button>
                    </div>
                )}
            </form>
        </section>
    );
}

function PriceInput({
    label,
    value,
    onChange,
    placeholder,
    disabled,
    required = false,
    helpText,
    autoFocus = false,
}) {
    return (
        <label className="block">
            <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">
                    {label}
                </span>

                {required && (
                    <span className="text-xs font-semibold text-red-500">
                        Required
                    </span>
                )}

                {helpText && (
                    <span className="text-xs text-slate-400">
                        {helpText}
                    </span>
                )}
            </div>

            <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                    ₱
                </span>

                <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    autoFocus={
                        autoFocus
                    }
                    disabled={
                        disabled
                    }
                    value={value}
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event.target
                                .value
                        )
                    }
                    placeholder={
                        placeholder
                    }
                    className="w-full min-w-0 rounded-xl border border-slate-300 bg-white py-3 pl-8 pr-3 text-base font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 disabled:text-slate-500"
                />
            </div>
        </label>
    );
}

function BulkTierRow({
    index,
    tier,
    disabled,
    onChange,
    onRemove,
}) {
    return (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
            <label className="min-w-0">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Quantity
                </span>

                <input
                    type="number"
                    inputMode="numeric"
                    min="2"
                    step="1"
                    disabled={
                        disabled
                    }
                    value={
                        tier.quantity
                    }
                    onChange={(
                        event
                    ) =>
                        onChange(
                            index,
                            "quantity",
                            event.target
                                .value
                        )
                    }
                    placeholder="e.g. 6"
                    className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
                />
            </label>

            <label className="min-w-0">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Price each
                </span>

                <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                        ₱
                    </span>

                    <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        disabled={
                            disabled
                        }
                        value={
                            tier.price
                        }
                        onChange={(
                            event
                        ) =>
                            onChange(
                                index,
                                "price",
                                event
                                    .target
                                    .value
                            )
                        }
                        placeholder="0.00"
                        className="w-full min-w-0 rounded-lg border border-slate-300 bg-white py-2.5 pl-7 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100"
                    />
                </div>
            </label>

            <button
                type="button"
                onClick={() =>
                    onRemove(index)
                }
                disabled={
                    disabled
                }
                className="col-span-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
            >
                Remove
            </button>
        </div>
    );
}

export default PricingEditor;