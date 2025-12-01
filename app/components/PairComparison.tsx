import React, { useState, useMemo } from 'react';
import { AggregatedData } from '../../types';

interface PairComparisonProps {
    data: AggregatedData[];
}

const PairComparison: React.FC<PairComparisonProps> = ({ data }) => {
    const [metalA, setMetalA] = useState<string>('');
    const [metalB, setMetalB] = useState<string>('');

    // Get available metals
    const availableMetals = useMemo(() => {
        return data.map(item => item.groupName);
    }, [data]);

    // Set initial values if not set
    React.useEffect(() => {
        if (availableMetals.length > 0 && !metalA) {
            setMetalA(availableMetals[0]);
        }
        if (availableMetals.length > 1 && !metalB) {
            setMetalB(availableMetals[1]);
        }
    }, [availableMetals, metalA, metalB]);

    // Calculate price data
    const pairData = useMemo(() => {
        const itemA = data.find(item => item.groupName === metalA);
        const itemB = data.find(item => item.groupName === metalB);

        if (!itemA || !itemB) return null;

        const priceA = itemA.averagePrice;
        const priceB = itemB.averagePrice;
        const ratio = priceB > 0 ? priceA / priceB : 0;
        const inverseRatio = priceA > 0 ? priceB / priceA : 0;

        return {
            metalA,
            metalB,
            priceA,
            priceB,
            ratio,
            inverseRatio,
        };
    }, [data, metalA, metalB]);

    const swapPair = () => {
        const temp = metalA;
        setMetalA(metalB);
        setMetalB(temp);
    };

    if (!pairData) return null;

    const isRatioGreaterThanOne = pairData.ratio > 1;

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg shadow-xl border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    مقایسه جفت فلزات
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Metal A Selector */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-400">فلز اول</label>
                    <select
                        value={metalA}
                        onChange={(e) => setMetalA(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                    >
                        {availableMetals.map((metal) => (
                            <option key={metal} value={metal}>
                                {metal}
                            </option>
                        ))}
                    </select>
                    <div className="mt-2 text-xs text-slate-400">
                        قیمت: {Math.round(pairData.priceA).toLocaleString('fa-IR')} ریال/تن
                    </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                    <button
                        onClick={swapPair}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 p-3 rounded-full transition-all duration-300 hover:scale-110"
                        title="معکوس کردن جفت"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </button>
                </div>

                {/* Metal B Selector */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-400">فلز دوم</label>
                    <select
                        value={metalB}
                        onChange={(e) => setMetalB(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                    >
                        {availableMetals.map((metal) => (
                            <option key={metal} value={metal}>
                                {metal}
                            </option>
                        ))}
                    </select>
                    <div className="mt-2 text-xs text-slate-400">
                        قیمت: {Math.round(pairData.priceB).toLocaleString('fa-IR')} ریال/تن
                    </div>
                </div>
            </div>

            {/* Ratio Display */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Ratio Card */}
                <div className={`p-4 rounded-lg border-2 ${isRatioGreaterThanOne ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'}`}>
                    <div className="text-sm text-slate-400 mb-2">نسبت قیمت</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-slate-300 text-lg">{metalA}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-300 text-lg">{metalB}</span>
                        <span className="text-slate-500">=</span>
                        <span className={`text-2xl font-bold ${isRatioGreaterThanOne ? 'text-green-400' : 'text-red-400'}`}>
                            {pairData.ratio.toLocaleString('fa-IR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                        </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        {isRatioGreaterThanOne
                            ? `${metalA} ${((pairData.ratio - 1) * 100).toFixed(2)}% گرانتر از ${metalB}`
                            : `${metalA} ${((1 - pairData.ratio) * 100).toFixed(2)}% ارزانتر از ${metalB}`
                        }
                    </div>
                </div>

                {/* Inverse Ratio Card */}
                <div className={`p-4 rounded-lg border-2 ${!isRatioGreaterThanOne ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'}`}>
                    <div className="text-sm text-slate-400 mb-2">نسبت معکوس</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-slate-300 text-lg">{metalB}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-300 text-lg">{metalA}</span>
                        <span className="text-slate-500">=</span>
                        <span className={`text-2xl font-bold ${!isRatioGreaterThanOne ? 'text-green-400' : 'text-red-400'}`}>
                            {pairData.inverseRatio.toLocaleString('fa-IR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                        </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        {!isRatioGreaterThanOne
                            ? `${metalB} ${((pairData.inverseRatio - 1) * 100).toFixed(2)}% گرانتر از ${metalA}`
                            : `${metalB} ${((1 - pairData.inverseRatio) * 100).toFixed(2)}% ارزانتر از ${metalA}`
                        }
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                <div className="flex gap-2 text-sm text-blue-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p>
                        این نسبت نشان می‌دهد که هر تن {metalA} چند برابر ارزش {metalB} دارد.
                        برای مقایسه بهتر، از دکمه معکوس استفاده کنید.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PairComparison;
