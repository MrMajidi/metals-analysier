'use client';

import React, { useState, useEffect } from 'react';

interface CurrencyRate {
    name: string;
    price: number;
    source: string;
    loading: boolean;
    error: string | null;
}

interface IceApiCurrency {
    id: number;
    slug: string;
    name: string;
    sell_price: string;
    buy_price: string;
    date: string;
}

interface DastyarApiItem {
    key: string;
    price: string;
    priceFloat: string;
    change: string;
    title: string;
    enTitle: string;
    category: string;
    currency: string;
    image: string;
    link: string;
    icon: string;
    sort_order: number;
}

export default function CurrencyRates() {
    const [rates, setRates] = useState<CurrencyRate[]>([
        { name: 'نرخ حواله تالار اول', price: 0, source: 'ice-1', loading: true, error: null },
        { name: 'نرخ حواله تالار دوم', price: 0, source: 'ice-2', loading: true, error: null },
        { name: 'نرخ دلار بازار آزاد', price: 0, source: 'dastyar', loading: true, error: null },
    ]);

    useEffect(() => {
        const fetchRates = async () => {
            // Fetch تالار اول
            try {
                const res1 = await fetch('https://api.ice.ir/api/v1/markets/2/currencies/history/latest/?lang=fa');
                if (res1.ok) {
                    const data1: IceApiCurrency[] = await res1.json();
                    const usd1 = data1.find(item => item.slug === 'USD');
                    if (usd1) {
                        setRates(prev => prev.map(r =>
                            r.source === 'ice-1'
                                ? { ...r, price: parseInt(usd1.sell_price), loading: false }
                                : r
                        ));
                    } else {
                        setRates(prev => prev.map(r =>
                            r.source === 'ice-1'
                                ? { ...r, loading: false, error: 'USD not found' }
                                : r
                        ));
                    }
                } else {
                    setRates(prev => prev.map(r =>
                        r.source === 'ice-1'
                            ? { ...r, loading: false, error: 'خطا در دریافت' }
                            : r
                    ));
                }
            } catch (error) {
                setRates(prev => prev.map(r =>
                    r.source === 'ice-1'
                        ? { ...r, loading: false, error: 'خطا در اتصال' }
                        : r
                ));
            }

            // Fetch تالار دوم
            try {
                const res2 = await fetch('https://api.ice.ir/api/v1/markets/1/currencies/history/latest/?lang=fa');
                if (res2.ok) {
                    const data2: IceApiCurrency[] = await res2.json();
                    const usd2 = data2.find(item => item.slug === 'USD');
                    if (usd2) {
                        setRates(prev => prev.map(r =>
                            r.source === 'ice-2'
                                ? { ...r, price: parseInt(usd2.sell_price), loading: false }
                                : r
                        ));
                    } else {
                        setRates(prev => prev.map(r =>
                            r.source === 'ice-2'
                                ? { ...r, loading: false, error: 'USD not found' }
                                : r
                        ));
                    }
                } else {
                    setRates(prev => prev.map(r =>
                        r.source === 'ice-2'
                            ? { ...r, loading: false, error: 'خطا در دریافت' }
                            : r
                    ));
                }
            } catch (error) {
                setRates(prev => prev.map(r =>
                    r.source === 'ice-2'
                        ? { ...r, loading: false, error: 'خطا در اتصال' }
                        : r
                ));
            }

            // Fetch بازار آزاد
            try {
                const res3 = await fetch('https://api.dastyar.io/express/financial-item');
                if (res3.ok) {
                    const data3: DastyarApiItem[] = await res3.json();
                    const usd3 = data3.find(item => item.key === 'usd');
                    if (usd3) {
                        // Dastyar returns price in Toman, multiply by 10 to get Rial
                        setRates(prev => prev.map(r =>
                            r.source === 'dastyar'
                                ? { ...r, price: parseInt(usd3.price) * 10, loading: false }
                                : r
                        ));
                    } else {
                        setRates(prev => prev.map(r =>
                            r.source === 'dastyar'
                                ? { ...r, loading: false, error: 'USD not found' }
                                : r
                        ));
                    }
                } else {
                    setRates(prev => prev.map(r =>
                        r.source === 'dastyar'
                            ? { ...r, loading: false, error: 'خطا در دریافت' }
                            : r
                    ));
                }
            } catch (error) {
                setRates(prev => prev.map(r =>
                    r.source === 'dastyar'
                        ? { ...r, loading: false, error: 'خطا در اتصال' }
                        : r
                ));
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
                {rates.map((rate, index) => (
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
