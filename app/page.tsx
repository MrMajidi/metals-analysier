'use client';

import React, { useState, useCallback } from 'react';
import type { RawDataItem, AggregatedData } from '../types';
import DataTable from './components/DataTable';
import Spinner from './components/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Helper to get today's date in Jalali format as a string for default value.
const getTodayJalali = (): string => {
  const today = new Date();
  // Use fa-IR locale with nu-latn to get Latin numbers
  const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(today);
};

export default function Home() {
  const [fromDate, setFromDate] = useState<string>(getTodayJalali());
  const [toDate, setToDate] = useState<string>(getTodayJalali());
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getCommodityGroup = (goodsName: string): string => {
    const keywords = ["ورق گرم", "میلگرد", "تختال", "تیرآهن", "شمش", "کاتد"];
    for (const keyword of keywords) {
      if (goodsName.includes(keyword)) {
        return keyword;
      }
    }
    return goodsName.split(/[- ]/)[0] || "سایر";
  };

  const processData = useCallback((data: RawDataItem[]) => {
    const groupedData = new Map<string, { totalQuantity: number; totalSupply: number; totalValue: number }>();

    data.forEach(item => {
      const groupName = getCommodityGroup(item.GoodsName);
      const currentGroup = groupedData.get(groupName) || { totalQuantity: 0, totalSupply: 0, totalValue: 0 };

      currentGroup.totalQuantity += item.Quantity;
      currentGroup.totalSupply += item.arze;
      currentGroup.totalValue += item.TotalPrice;

      groupedData.set(groupName, currentGroup);
    });

    const result: AggregatedData[] = Array.from(groupedData.entries()).map(([groupName, totals]) => ({
      groupName,
      ...totals,
      averagePrice: totals.totalQuantity > 0 ? totals.totalValue / totals.totalQuantity : 0,
    }));

    // Sort by total value descending
    result.sort((a, b) => b.totalValue - a.totalValue);

    setAggregatedData(result);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setAggregatedData(null);

    try {
      const response = await fetch('/api/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromDate, toDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `خطا در ارتباط با سرور: ${response.statusText}`);
      }

      const jsonResponse = await response.json();

      if (jsonResponse.data) {
        const rawData: RawDataItem[] = jsonResponse.data;
        if (rawData.length === 0) {
          setError("داده‌ای برای بازه زمانی انتخابی یافت نشد.");
        } else {
          processData(rawData);
        }
      } else {
        throw new Error("فرمت پاسخ دریافت شده نامعتبر است.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'یک خطای ناشناخته رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/80 backdrop-blur-sm p-3 border border-slate-600 rounded-lg shadow-lg text-sm">
          <p className="label font-bold text-sky-400">{`${label}`}</p>
          <p className="intro text-slate-300">{`ارزش معامله: ${payload[0].value.toLocaleString('fa-IR')} ریال`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">تحلیلگر داده‌های بورس کالا</h1>
          <p className="mt-2 text-slate-400">آخرین آمار معاملات فلزات گران‌بها را مشاهده و تحلیل کنید</p>
        </header>

        <main>
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-1">
                <label htmlFor="fromDate" className="block mb-2 text-sm font-medium text-slate-400">از تاریخ</label>
                <input
                  type="text"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="مثال: 1403/05/01"
                  className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="toDate" className="block mb-2 text-sm font-medium text-slate-400">تا تاریخ</label>
                <input
                  type="text"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="مثال: 1403/05/01"
                  className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg transition duration-300 flex items-center justify-center"
                >
                  {loading ? 'در حال دریافت...' : 'دریافت داده‌ها'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {loading && <Spinner />}
            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">{error}</div>}
            {!loading && !error && !aggregatedData && (
              <div className="text-center text-slate-500 py-16">
                <p>برای شروع، بازه زمانی مورد نظر را انتخاب کرده و روی دکمه "دریافت داده‌ها" کلیک کنید.</p>
              </div>
            )}
            {aggregatedData && (
              <>
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-slate-300">جدول خلاصه معاملات</h2>
                  <DataTable data={aggregatedData} />
                </div>
                {aggregatedData.length > 0 && <div>
                  <h2 className="text-2xl font-semibold mb-4 text-slate-300">نمودار ارزش معاملات بر اساس گروه کالا</h2>
                  <div className="bg-slate-800 p-4 rounded-lg shadow-lg h-96 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregatedData} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => new Intl.NumberFormat('fa-IR').format(value as number)} />
                        <YAxis type="category" dataKey="groupName" stroke="#94a3b8" width={160} tick={{ fill: '#e2e8f0', fontSize: 12, textAnchor: 'end' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(71, 85, 105, 0.3)' }} />
                        <Legend />
                        <Bar dataKey="totalValue" name="ارزش معامله (ریال)" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

