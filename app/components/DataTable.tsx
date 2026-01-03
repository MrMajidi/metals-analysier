import React from 'react';
import { AggregatedData } from '../../types';

interface GlobalPrice {
  id: number;
  slug: string;
  globalName: string;
  localLabel: string;
  price: number | null;
}

interface CurrencyRates {
  talar1: number | null; // دلار تالار اول
  talar2: number | null; // دلار تالار دوم
  azad: number | null;   // دلار بازار آزاد
}

interface DataTableProps {
  data: AggregatedData[];
  globalPrices?: GlobalPrice[];
  currencyRates?: CurrencyRates;
}

const DataTable: React.FC<DataTableProps> = ({ data, globalPrices = [], currencyRates }) => {
  const tableHeaders = [
    "گروه کالا",
    "حجم قرارداد (تن)",
    "حجم عرضه (تن)",
    "ارزش معامله (ریال)",
    "میانگین قیمت (ریال/تن)",
    "قیمت جهانی (USD/mt)",
    "قیمت برآورد",
    "قیمت دلاری کالا",
    "نسبت حجم معاملات به حجم عرضه (%)",
    "نسبت فی معامله به فی پایه (%)",
  ];

  // Create a map of local labels to global prices for quick lookup
  const globalPriceMap = new Map<string, number | null>();
  globalPrices.forEach(gp => {
    globalPriceMap.set(gp.localLabel, gp.price);
  });

  // Calculate derived global prices based on billet
  const billetPrice = globalPriceMap.get('شمش');
  if (billetPrice) {
    // تیرآهن = billet + 7%
    if (!globalPriceMap.has('تیرآهن') || !globalPriceMap.get('تیرآهن')) {
      globalPriceMap.set('تیرآهن', billetPrice * 1.07);
    }
    // نبشی = billet + 7%
    if (!globalPriceMap.has('نبشی') || !globalPriceMap.get('نبشی')) {
      globalPriceMap.set('نبشی', billetPrice * 1.07);
    }
    // ناودانی = billet + 16%
    if (!globalPriceMap.has('ناودانی') || !globalPriceMap.get('ناودانی')) {
      globalPriceMap.set('ناودانی', billetPrice * 1.16);
    }
  }

  // Calculate dollar price: (average price in Rial) / (global price in USD) * 1000
  // This gives us the implied exchange rate
  const calculateDollarPrice = (averagePrice: number, globalPrice: number | null): number | null => {
    if (!globalPrice || globalPrice === 0) return null;
    return (averagePrice / globalPrice) * 1000;
  };

  // Calculate estimated price (قیمت برآورد) based on group-specific formulas
  const calculateEstimatedPrice = (groupName: string, globalPrice: number | null): number | null => {
    if (!globalPrice || !currencyRates) return null;

    const { talar1, talar2, azad } = currencyRates;

    // Groups using free market dollar (دلار آزاد)
    const azadGroups = ["ورق گرم", "ورق سرد", "ورق گالوانیزه"];

    // Groups using 40% talar1 + 60% talar2
    const blendedGroups4060 = ["شمش", "تختال"];

    // Groups using 20% talar1 + 80% talar2
    const blendedGroups2080 = ["میلگرد", "تیرآهن", "نبشی", "ناودانی"];

    if (azadGroups.includes(groupName)) {
      if (!azad) return null;
      return globalPrice * azad;
    }

    if (blendedGroups4060.includes(groupName)) {
      if (!talar1 || !talar2) return null;
      const blendedRate = (talar1 * 0.4) + (talar2 * 0.6);
      return globalPrice * blendedRate;
    }

    if (blendedGroups2080.includes(groupName)) {
      if (!talar1 || !talar2) return null;
      const blendedRate = (talar1 * 0.2) + (talar2 * 0.8);
      return globalPrice * blendedRate;
    }

    return null;
  };

  return (
    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-lg">
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
            const dollarPrice = calculateDollarPrice(item.averagePrice, globalPrice);
            const estimatedPrice = calculateEstimatedPrice(item.groupName, globalPrice);

            return (
              <tr key={item.groupName} className="hover:bg-slate-700/30 transition-colors duration-200">
                <th scope="row" className="px-6 py-4 font-medium text-sky-400 whitespace-nowrap">
                  {item.groupName}
                </th>
                <td className="px-6 py-4">{item.totalQuantity.toLocaleString('fa-IR')}</td>
                <td className="px-6 py-4">{item.totalSupply.toLocaleString('fa-IR')}</td>
                <td className="px-6 py-4">{item.totalValue.toLocaleString('fa-IR')}</td>
                <td className="px-6 py-4">{Math.round(item.averagePrice).toLocaleString('fa-IR')}</td>
                <td className="px-6 py-4">
                  {globalPrice !== null ? (
                    <span className="text-emerald-400">{globalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {estimatedPrice !== null ? (
                    <span className="text-purple-400 font-medium">
                      {Math.round(estimatedPrice).toLocaleString('fa-IR')}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {dollarPrice !== null ? (
                    <span className="text-amber-400 font-medium">
                      {dollarPrice.toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-6 py-4">{item.volumeToSupplyRatio.toLocaleString('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                <td className="px-6 py-4">{item.priceToBasePriceRatio.toLocaleString('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
