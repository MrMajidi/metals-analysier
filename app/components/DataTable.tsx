import React from 'react';
import { AggregatedData } from '../../types';

interface DataTableProps {
  data: AggregatedData[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const tableHeaders = [
    "گروه کالا",
    "حجم قرارداد (تن)",
    "حجم عرضه (تن)",
    "ارزش معامله (ریال)",
    "میانگین قیمت (ریال/تن)",
    "نسبت حجم معاملات به حجم عرضه (%)",
    "نسبت فی معامله به فی پایه (%)",
  ];

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
          {data.map((item) => (
            <tr key={item.groupName} className="hover:bg-slate-700/30 transition-colors duration-200">
              <th scope="row" className="px-6 py-4 font-medium text-sky-400 whitespace-nowrap">
                {item.groupName}
              </th>
              <td className="px-6 py-4">{item.totalQuantity.toLocaleString('fa-IR')}</td>
              <td className="px-6 py-4">{item.totalSupply.toLocaleString('fa-IR')}</td>
              <td className="px-6 py-4">{item.totalValue.toLocaleString('fa-IR')}</td>
              <td className="px-6 py-4">{Math.round(item.averagePrice).toLocaleString('fa-IR')}</td>
              <td className="px-6 py-4">{item.volumeToSupplyRatio.toLocaleString('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
              <td className="px-6 py-4">{item.priceToBasePriceRatio.toLocaleString('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

