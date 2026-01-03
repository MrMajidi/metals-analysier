import React, { useState, useMemo, useEffect } from 'react';
import { AggregatedData } from '../../types';
import MultiSelect from './MultiSelect';

interface PairComparisonProps {
    data: AggregatedData[];
}

const PairComparison: React.FC<PairComparisonProps> = ({ data }) => {
    const [sourceMetal, setSourceMetal] = useState<string>('');
    const [targetMetals, setTargetMetals] = useState<string[]>([]);

    // Get available metals
    const availableMetals = useMemo(() => {
        return data.map(item => item.groupName);
    }, [data]);

    // Set initial values if not set
    useEffect(() => {
        if (availableMetals.length > 0 && !sourceMetal) {
            setSourceMetal(availableMetals[0]);
        }
        // Initialize targets if empty and we have enough metals
        if (availableMetals.length > 1 && targetMetals.length === 0) {
            // Don't auto-set targets, let user choose, or maybe just set one
            // setTargetMetals([availableMetals[1]]);
        }
    }, [availableMetals, sourceMetal, targetMetals.length]);

    const comparisons = useMemo(() => {
        const sourceItem = data.find(item => item.groupName === sourceMetal);
        if (!sourceItem) return [];

        return targetMetals.map(target => {
            const targetItem = data.find(item => item.groupName === target);
            if (!targetItem) return null;

            const priceSource = sourceItem.averagePrice;
            const priceTarget = targetItem.averagePrice;
            const ratio = priceTarget > 0 ? priceTarget / priceSource : 0;

            return {
                targetName: target,
                priceSource,
                priceTarget,
                ratio,
                isRatioGreaterThanOne: ratio > 1
            };
        }).filter(item => item !== null);

    }, [data, sourceMetal, targetMetals]);

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg shadow-xl border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    مقایسه قیمت‌ها (یک به چند)
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

                {/* Source Metal Selector */}
                <div className="md:col-span-1 border-l border-slate-700 pl-4 ml-2">
                    <label className="block mb-2 text-sm font-medium text-slate-400">فلز مبنا (Source)</label>
                    <select
                        value={sourceMetal}
                        onChange={(e) => setSourceMetal(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 mb-2"
                    >
                        {availableMetals.map((metal) => (
                            <option key={metal} value={metal}>
                                {metal}
                            </option>
                        ))}
                    </select>
                    {sourceMetal && (
                        <div className="text-xs text-sky-400">
                            قیمت پایه: {Math.round(data.find(d => d.groupName === sourceMetal)?.averagePrice || 0).toLocaleString('fa-IR')} ریال
                        </div>
                    )}
                </div>

                {/* Target Metals Selector */}
                <div className="md:col-span-3">
                    <div className="mb-4">
                        <MultiSelect
                            label="فلزات هدف (حداکثر ۴ مورد)"
                            options={availableMetals.filter(m => m !== sourceMetal)}
                            selected={targetMetals}
                            onChange={(selected) => {
                                if (selected.length <= 4) {
                                    setTargetMetals(selected);
                                }
                            }}
                            placeholder="انتخاب فلزات جهت مقایسه..."
                        />
                    </div>

                    {/* Comparison Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                        {comparisons.map((comp) => (
                            comp && (
                                <div key={comp.targetName} className={`p-4 rounded-lg border relative overflow-hidden ${comp.isRatioGreaterThanOne ? 'bg-slate-800/50 border-green-600/50' : 'bg-slate-800/50 border-red-600/50'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm text-slate-400">
                                            نسبت {comp.targetName} به {sourceMetal}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-2xl font-bold ${comp.isRatioGreaterThanOne ? 'text-green-400' : 'text-red-400'}`}>
                                            {comp.ratio.toLocaleString('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            ({comp.targetName} = {comp.ratio.toFixed(2)} × {sourceMetal})
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/50 flex justify-between">
                                        <span>قیمت {comp.targetName}:</span>
                                        <span>{Math.round(comp.priceTarget).toLocaleString('fa-IR')}</span>
                                    </div>
                                </div>
                            )
                        ))}
                        {comparisons.length === 0 && (
                            <div className="col-span-full text-center text-slate-500 py-4 border border-dashed border-slate-700 rounded-lg">
                                هیچ فلزی برای مقایسه انتخاب نشده است.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PairComparison;
