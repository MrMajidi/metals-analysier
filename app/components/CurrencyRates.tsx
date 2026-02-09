'use client';

import React, { useState, useEffect } from 'react';

interface CurrencyRate {
    name: string;
    price: number;
    source: string;
    loading: boolean;
    error: string | null;
}

export default function CurrencyRates() {
    const [rates, setRates] = useState<CurrencyRate[]>([
        { name: 'نرخ حواله', price: 0, source: 'havaleh', loading: true, error: null },
        { name: 'نرخ دلار بازار آزاد', price: 0, source: 'azad', loading: true, error: null },
    ]);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await fetch('/api/currency-rates');
                if (response.ok) {
                    const result = await response.json();
                    const data = result.data;

                    setRates(prev => prev.map(r => {
                        const price = data[r.source as keyof typeof data];
                        if (price !== null && price !== undefined) {
                            return { ...r, price, loading: false };
                        } else {
                            return { ...r, loading: false, error: 'دریافت نشد' };
                        }
                    }));
                } else {
                    setRates(prev => prev.map(r => ({ ...r, loading: false, error: 'خطا در دریافت' })));
                }
            } catch (error) {
                setRates(prev => prev.map(r => ({ ...r, loading: false, error: 'خطا در اتصال' })));
            }
        };

        fetchRates();
    }, []);

    const formatPrice = (price: number): string => {
        return price.toLocaleString('fa-IR');
    };

    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-xl mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-sky-400">نرخ‌های دلار</h2>
                <span className="text-xs text-slate-500">قیمت‌ها به ریال</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rates.map((rate) => (
                    <div
                        key={rate.source}
                        className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-sky-500/50 transition-colors"
                    >
                        <div className="text-sm text-slate-400 mb-1">{rate.name}</div>
                        {rate.loading ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-sky-400 border-t-transparent rounded-full"></div>
                                <span className="text-slate-500 text-sm">در حال دریافت...</span>
                            </div>
                        ) : rate.error ? (
                            <div className="text-red-400 text-sm">{rate.error}</div>
                        ) : (
                            <div className="text-xl font-bold text-emerald-400">
                                {formatPrice(rate.price)}
                                <span className="text-sm text-slate-500 mr-2">ریال</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
