'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { RawDataItem, AggregatedData } from '../types';
import DataTable from './components/DataTable';
import Spinner from './components/Spinner';
import MultiSelect from './components/MultiSelect';
import PairComparison from './components/PairComparison';
import { getWeeksOfYear, getCurrentJalaliYear, WeekOption } from './utils/dateUtils';
import * as XLSX from 'xlsx';

export default function Home() {
  const currentYear = getCurrentJalaliYear();
  const weeks = useMemo(() => getWeeksOfYear(currentYear), [currentYear]);

  // Default to the first week or current week if logic allows, for now first week
  const [selectedWeek, setSelectedWeek] = useState<string>(weeks[0]?.label || '');

  // Derived from selected week
  const currentWeekObj = weeks.find(w => w.label === selectedWeek);

  // Specific Manual Date State
  const [manualFromDate, setManualFromDate] = useState<string>('');
  const [manualToDate, setManualToDate] = useState<string>('');

  // Determine effective dates (Manual overrides Week if both are filled)
  const isManualDateSet = manualFromDate.length === 10 && manualToDate.length === 10;

  const fromDate = isManualDateSet ? manualFromDate : (currentWeekObj?.fromDate || '');
  const toDate = isManualDateSet ? manualToDate : (currentWeekObj?.toDate || '');

  const [rawData, setRawData] = useState<RawDataItem[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedTasvieh, setSelectedTasvieh] = useState<string[]>([]);
  const [selectedProducers, setSelectedProducers] = useState<string[]>([]);
  const [selectedPackets, setSelectedPackets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Available options for filters (derived from fetched data)
  // Available options for filters (derived from fetched data)
  const [availableTasvieh, setAvailableTasvieh] = useState<string[]>([]);
  // Producers will now be derived dynamically
  const [allProducers, setAllProducers] = useState<string[]>([]);
  const [availablePackets, setAvailablePackets] = useState<string[]>([]); // This will now hold groupNames

  const getCommodityGroup = useCallback((goodsName: string): string => {
    const keywords = ["ورق گرم", "ورق سرد", "تیرآهن بال پهن", "ورق گالوانیزه", "میلگرد", "تختال", "تیرآهن", "شمش", "کاتد"];
    for (const keyword of keywords) {
      if (goodsName.includes(keyword)) {
        return keyword;
      }
    }
    return goodsName.split(/[- ]/)[0] || "سایر";
  }, []);

  const processData = useCallback((data: RawDataItem[]) => {
    // Apply filters
    // Apply filters
    const filteredData = data.filter(item => {
      const itemGroupName = getCommodityGroup(item.GoodsName);

      if (selectedTasvieh.length > 0 && !selectedTasvieh.includes(item.Tasvieh)) return false;
      // Note: Producer filter check should happen; but available options for it depend on Packet filter
      // However, if we simply filter sequentially, we might have issues.
      // Let's keep strict filtering here.

      // Filter by Group (mapped to selectedPackets state for backwards compatibility of name)
      if (selectedPackets.length > 0 && !selectedPackets.includes(itemGroupName)) return false;

      if (selectedProducers.length > 0 && !selectedProducers.includes(item.ProducerName)) return false;

      return true;
    });

    const groupedData = new Map<string, {
      totalQuantity: number;
      totalSupply: number;
      totalValue: number;
      totalBasePriceValue: number;
    }>();

    filteredData.forEach(item => {
      const groupName = getCommodityGroup(item.GoodsName);
      const currentGroup = groupedData.get(groupName) || {
        totalQuantity: 0,
        totalSupply: 0,
        totalValue: 0,
        totalBasePriceValue: 0
      };

      currentGroup.totalQuantity += item.Quantity;
      currentGroup.totalSupply += item.arze;
      currentGroup.totalValue += item.TotalPrice;
      currentGroup.totalBasePriceValue += (item.ArzeBasePrice * item.Quantity);

      groupedData.set(groupName, currentGroup);
    });

    const result: AggregatedData[] = Array.from(groupedData.entries()).map(([groupName, totals]) => ({
      groupName,
      totalQuantity: totals.totalQuantity,
      totalSupply: totals.totalSupply,
      totalValue: totals.totalValue,
      averagePrice: totals.totalQuantity > 0 ? totals.totalValue / totals.totalQuantity : 0,
      volumeToSupplyRatio: totals.totalSupply > 0 ? (totals.totalQuantity / totals.totalSupply) * 100 : 0,
      priceToBasePriceRatio: totals.totalBasePriceValue > 0 ? (totals.totalValue / totals.totalBasePriceValue) * 100 - 100 : 0,
    }));

    // Sort by total value descending
    result.sort((a, b) => b.totalValue - a.totalValue);

    setAggregatedData(result);
  }, [selectedTasvieh, selectedProducers, selectedPackets, getCommodityGroup]);

  // Derive available producers based on selected Packets (Groups)
  const activeProducers = useMemo(() => {
    if (rawData.length === 0) return [];

    // If no group selected, show all producers from raw data (or filtered by other means?)
    // Requirement: "when a packet is selected, producers list should be trimmed to only available ones."

    let relevantData = rawData;
    if (selectedPackets.length > 0) {
      relevantData = rawData.filter(item => selectedPackets.includes(getCommodityGroup(item.GoodsName)));
    }

    const producerSet = new Set<string>();
    relevantData.forEach(item => {
      if (item.ProducerName) producerSet.add(item.ProducerName);
    });

    return Array.from(producerSet).sort();
  }, [rawData, selectedPackets, getCommodityGroup]);

  // Re-process data when filters change
  useEffect(() => {
    if (rawData.length > 0) {
      processData(rawData);
    } else {
      setAggregatedData(null);
    }
  }, [processData, rawData]);


  const fetchData = async () => {
    if (!fromDate || !toDate) return;

    setLoading(true);
    setError(null);
    setAggregatedData(null);
    setRawData([]);

    // Reset filters on new fetch? Or keep them? 
    // Usually better to keep them if possible, but options might change.
    // Let's keep the selected values, but we need to update available options.

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
        const data: RawDataItem[] = jsonResponse.data;
        if (data.length === 0) {
          setError("داده‌ای برای بازه زمانی انتخابی یافت نشد.");
        } else {
          setRawData(data);

          // Extract options for filters
          const tasviehSet = new Set<string>();
          const producerSet = new Set<string>();
          const groupSet = new Set<string>();

          data.forEach(item => {
            if (item.Tasvieh) tasviehSet.add(item.Tasvieh);
            if (item.ProducerName) producerSet.add(item.ProducerName);
            // Use getCommodityGroup for the "Packet" filter options
            const gName = getCommodityGroup(item.GoodsName);
            if (gName) groupSet.add(gName);
          });

          setAvailableTasvieh(Array.from(tasviehSet).sort());
          setAllProducers(Array.from(producerSet).sort()); // Store all, use activeProducers for UI
          setAvailablePackets(Array.from(groupSet).sort());

          // Reset selections on new fetch properly if needed, or keep valid ones
          // For now, let's clear them to avoid confusion with new data
          setSelectedProducers([]);
          setSelectedPackets([]); // Clear group selection

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

  const exportToExcel = () => {
    if (!aggregatedData || aggregatedData.length === 0) return;

    // Prepare data for export
    const exportData = aggregatedData.map(item => ({
      'گروه کالا': item.groupName,
      'حجم قرارداد (تن)': item.totalQuantity,
      'حجم عرضه (تن)': item.totalSupply,
      'ارزش معامله (ریال)': item.totalValue,
      'میانگین قیمت (ریال/تن)': Math.round(item.averagePrice),
      'نسبت حجم معاملات به حجم عرضه (%)': Number(item.volumeToSupplyRatio.toFixed(2)),
      'نسبت فی معامله به فی پایه (%)': Number(item.priceToBasePriceRatio.toFixed(2)),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'داده‌های معاملات');

    // Generate filename with selected week
    const filename = `گزارش-معاملات-${selectedWeek}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
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
            <div className="flex flex-col gap-4">
              {/* Week Selection */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                  <label htmlFor="weekSelect" className="block mb-2 text-sm font-medium text-slate-400">انتخاب هفته</label>
                  <select
                    id="weekSelect"
                    value={selectedWeek}
                    onChange={(e) => {
                      const newWeek = e.target.value;
                      setSelectedWeek(newWeek);
                      const weekObj = weeks.find(w => w.label === newWeek);
                      if (weekObj) {
                        setManualFromDate(weekObj.fromDate);
                        setManualToDate(weekObj.toDate);
                      }
                    }}
                    disabled={false}
                    className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                  >
                    {weeks.map((week) => (
                      <option key={week.label} value={week.label}>
                        {week.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Manual Date Selection */}
                <div className="md:col-span-3">
                  <div className="text-xs text-slate-500 mb-2">یا انتخاب بازه زمانی دستی (تایپ کنید: 1402/01/01)</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="از تاریخ (1403/xx/xx)"
                        value={manualFromDate}
                        onChange={(e) => setManualFromDate(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="تا تاریخ (1403/xx/xx)"
                        value={manualToDate}
                        onChange={(e) => setManualToDate(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-1">
                  <button
                    onClick={fetchData}
                    disabled={loading || (!selectedWeek && !isManualDateSet)}
                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg transition duration-300 flex items-center justify-center"
                  >
                    {loading ? 'در حال دریافت...' : 'دریافت داده‌ها'}
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            {rawData.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <MultiSelect
                  label="نوع تسویه"
                  options={availableTasvieh}
                  selected={selectedTasvieh}
                  onChange={setSelectedTasvieh}
                  placeholder="همه موارد"
                />
                <MultiSelect
                  label="گروه کالا"
                  options={availablePackets} // These are now groupNames
                  selected={selectedPackets}
                  onChange={setSelectedPackets}
                  placeholder="همه موارد"
                />
                <MultiSelect
                  label="تولید کننده"
                  options={activeProducers} // Use dynamic active list
                  selected={selectedProducers}
                  onChange={setSelectedProducers}
                  placeholder="همه موارد"
                />

              </div>
            )}
          </div>

          <div className="space-y-8">
            {loading && <Spinner />}
            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">{error}</div>}
            {!loading && !error && !aggregatedData && rawData.length === 0 && (
              <div className="text-center text-slate-500 py-16">
                <p>برای شروع، هفته مورد نظر را انتخاب کرده و روی دکمه "دریافت داده‌ها" کلیک کنید.</p>
              </div>
            )}
            {aggregatedData && (
              <>


                <div>
                  <div className="flex justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-semibold text-slate-300">جدول خلاصه معاملات</h2>
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={exportToExcel}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition duration-300 flex items-center gap-2 whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        خروجی اکسل
                      </button>
                      <div className="w-64">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="جستجو در نام کالا..."
                          className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                        />
                      </div>
                    </div>
                  </div>
                  <DataTable
                    data={aggregatedData.filter(item =>
                      searchTerm === '' || item.groupName.toLowerCase().includes(searchTerm.toLowerCase())
                    )}
                  />
                </div>

                {/* Pair Comparison Section */}
                <div className="mb-8">
                  <PairComparison data={aggregatedData} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
