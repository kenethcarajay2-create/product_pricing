function currency(value) {
    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(
            Number(value)
        )
    ) {
        return "₱0.00";
    }

    return new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }
    ).format(Number(value));
}

function percentage(value) {
    if (!Number.isFinite(value)) {
        return "0.0%";
    }

    return `${value.toFixed(1)}%`;
}

function PricingSummary({
    costPrice,
    sellingPrice,
}) {
    const cost =
        Number(costPrice) || 0;

    const selling =
        Number(sellingPrice) || 0;

    const profit =
        selling > 0
            ? selling - cost
            : 0;

    const markup =
        cost > 0
            ? (profit / cost) * 100
            : 0;

    const margin =
        selling > 0
            ? (profit / selling) * 100
            : 0;

    return (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <SummaryCard
                label="Profit"
                value={currency(
                    profit
                )}
            />

            <SummaryCard
                label="Markup"
                value={percentage(
                    markup
                )}
            />

            <SummaryCard
                label="Margin"
                value={percentage(
                    margin
                )}
            />
        </div>
    );
}

function SummaryCard({
    label,
    value,
}) {
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                {label}
            </p>

            <p className="mt-1 truncate text-sm font-bold text-slate-900 sm:text-base">
                {value}
            </p>
        </div>
    );
}

export default PricingSummary;