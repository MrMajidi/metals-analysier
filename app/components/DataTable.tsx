import React, { useState } from "react";
import { AggregatedData } from "../../types";

interface GlobalPrice {
  id: number;
  slug: string;
  globalName: string;
  localLabel: string;
  price: number | null;
}

interface CurrencyRates {
  havaleh: number | null; // دلار تالار اول
  azad: number | null; // دلار بازار آزاد
}

interface DataTableProps {
  data: AggregatedData[];
  globalPrices?: GlobalPrice[];
  currencyRates?: CurrencyRates;
}

type PriceMode = "market" | "manual";

const DataTable: React.FC<DataTableProps> = ({
  data,
  globalPrices = [],
  currencyRates,
}) => {
  const [priceMode, setPriceMode] = useState<PriceMode>("market");
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});

  const handleManualPriceChange = (groupName: string, value: string) => {
    const numValue = parseFloat(value.replace(/,/g, ""));
    if (!isNaN(numValue)) {
      setManualPrices((prev) => ({ ...prev, [groupName]: numValue }));
    } else if (value === "") {
      setManualPrices((prev) => {
        const newPrices = { ...prev };
        delete newPrices[groupName];
        return newPrices;
      });
    }
  };

  const getEffectivePrice = (groupName: string, marketPrice: number): number => {
    if (priceMode === "manual" && manualPrices[groupName] !== undefined) {
      return manualPrices[groupName];
    }
    return marketPrice;
  };
  const tableHeaders = [
    "گروه کالا",
    "حجم قرارداد (تن)",
    "حجم عرضه (تن)",
    "ارزش معامله (ریال)",
    "میانگین قیمت (ریال/تن)",
    "قیمت جهانی (USD/mt)",
    "کف برآورد",
    "سقف برآورد",
    "قیمت دلاری کالا",
    "نسبت حجم معاملات به حجم عرضه (%)",
    "نسبت فی معامله به فی پایه (%)",
  ];

  // Create a map of local labels to global prices for quick lookup
  const globalPriceMap = new Map<string, number | null>();
  globalPrices.forEach((gp) => {
    globalPriceMap.set(gp.localLabel, gp.price);
  });

  // Calculate derived global prices based on billet
  const billetPrice = globalPriceMap.get("شمش");
  if (billetPrice) {
    // تیرآهن = billet + 7%
    if (!globalPriceMap.has("تیرآهن") || !globalPriceMap.get("تیرآهن")) {
      globalPriceMap.set("تیرآهن", billetPrice * 1.07);
    }
    // نبشی = billet + 7%
    if (!globalPriceMap.has("نبشی") || !globalPriceMap.get("نبشی")) {
      globalPriceMap.set("نبشی", billetPrice * 1.07);
    }
    // ناودانی = billet + 16%
    if (!globalPriceMap.has("ناودانی") || !globalPriceMap.get("ناودانی")) {
      globalPriceMap.set("ناودانی", billetPrice * 1.16);
    }
  }

  // Calculate dollar price: (average price in Rial) / (global price in USD) * 1000
  // This gives us the implied exchange rate
  const calculateDollarPrice = (
    averagePrice: number,
    globalPrice: number | null,
  ): number | null => {
    if (!globalPrice || globalPrice === 0) return null;
    return (averagePrice / globalPrice) * 1000;
  };

  // Calculate estimated price (قیمت برآورد) based on group-specific formulas
  const calculateEstimatedPrice = (
    groupName: string,
    globalPrice: number | null,
  ): number | null => {
    if (!globalPrice || !currencyRates) return null;

    const { havaleh, azad } = currencyRates;

    // Groups using free market dollar (دلار آزاد)
    const azadGroups = ["ورق گرم", "ورق سرد", "ورق گالوانیزه"];

    if (azadGroups.includes(groupName)) {
      if (!azad) return null;
      return (globalPrice * azad) / 1000;
    }

    return havaleh ? (globalPrice * havaleh) / 1000 : null;
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg">
      {/* Price Mode Switch */}
      <div className="flex items-center justify-end gap-4 p-4 border-b border-slate-700">
        <span className={`text-sm font-medium transition-colors ${priceMode === "market" ? "text-emerald-400" : "text-slate-400"
          }`}>
          قیمت بازار
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={priceMode === "manual"}
          onClick={() => setPriceMode(priceMode === "market" ? "manual" : "market")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${priceMode === "manual" ? "bg-sky-500" : "bg-slate-600"
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${priceMode === "manual" ? "-translate-x-6" : "-translate-x-1"
              }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${priceMode === "manual" ? "text-sky-400" : "text-slate-400"
          }`}>
          قیمت دستی
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-slate-700/50 text-xs uppercase text-slate-400">
            <tr>
              {tableHeaders.map((header) => (
                <th key={header} scope="col" className="px-6 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.map((item) => {
              const globalPrice = globalPriceMap.get(item.groupName) ?? null;
              const effectivePrice = getEffectivePrice(item.groupName, item.averagePrice);
              const dollarPrice = calculateDollarPrice(
                effectivePrice,
                globalPrice,
              );
              const estimatedPrice = calculateEstimatedPrice(
                item.groupName,
                globalPrice,
              );

              return (
                <tr
                  key={item.groupName}
                  className="hover:bg-slate-700/30 transition-colors duration-200"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-sky-400 whitespace-nowrap"
                  >
                    {item.groupName}
                  </th>
                  <td className="px-6 py-4">
                    {item.totalQuantity.toLocaleString("fa-IR")}
                  </td>
                  <td className="px-6 py-4">
                    {item.totalSupply.toLocaleString("fa-IR")}
                  </td>
                  <td className="px-6 py-4">
                    {item.totalValue.toLocaleString("fa-IR")}
                  </td>
                  <td className="px-6 py-4">
                    {priceMode === "manual" ? (
                      <input
                        type="text"
                        value={
                          manualPrices[item.groupName] !== undefined
                            ? Math.round(manualPrices[item.groupName]).toLocaleString("fa-IR")
                            : Math.round(item.averagePrice).toLocaleString("fa-IR")
                        }
                        onChange={(e) => {
                          // Convert Persian digits to English for parsing
                          const persianToEnglish = e.target.value.replace(/[۰-۹]/g, (d) =>
                            String.fromCharCode(d.charCodeAt(0) - 1728)
                          );
                          handleManualPriceChange(item.groupName, persianToEnglish);
                        }}
                        className="w-20 bg-slate-700 border border-sky-500/50 rounded px-2 py-1 text-sky-300 text-right focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder={Math.round(item.averagePrice).toLocaleString("fa-IR")}
                      />
                    ) : (
                      Math.round(item.averagePrice).toLocaleString("fa-IR")
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {globalPrice !== null ? (
                      <span className="text-emerald-400">
                        {globalPrice.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {estimatedPrice !== null ? (
                      <span className="text-pink-400 font-medium">
                        {Math.round(estimatedPrice * 0.95).toLocaleString(
                          "fa-IR",
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {estimatedPrice !== null ? (
                      <span className="text-purple-400 font-medium">
                        {Math.round(estimatedPrice).toLocaleString("fa-IR")}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {dollarPrice !== null ? (
                      <span className="text-amber-400 font-medium">
                        {dollarPrice.toLocaleString("fa-IR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.volumeToSupplyRatio.toLocaleString("fa-IR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    %
                  </td>
                  <td className="px-6 py-4">
                    {item.priceToBasePriceRatio.toLocaleString("fa-IR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    %
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
