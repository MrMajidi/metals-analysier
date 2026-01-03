'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface GlobalPrice {
    id: number;
    slug: string;
    globalName: string;
    localLabel: string;
    price: number | null;
    sourceUrl: string;
    lastFetchedAt: string | null;
    manuallyUpdated: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function GlobalPrices() {
    const [prices, setPrices] = useState<GlobalPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [refetchingSlug, setRefetchingSlug] = useState<string | null>(null);
    const [savingSlug, setSavingSlug] = useState<string | null>(null);

    const fetchPrices = useCallback(async () => {
        try {
            const response = await fetch('/api/global-prices');
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // If no data exists, seed the database
            if (data.data.length === 0) {
                const seedResponse = await fetch('/api/global-prices', { method: 'POST' });
                const seedData = await seedResponse.json();
                if (seedData.error) {
                    throw new Error(seedData.error);
                }
                setPrices(seedData.data);
            } else {
                setPrices(data.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در دریافت قیمت‌ها');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrices();
    }, [fetchPrices]);

    const handleEdit = (price: GlobalPrice) => {
        setEditingSlug(price.slug);
        setEditValue(price.price?.toString() || '');
    };

    const handleSave = async (slug: string) => {
        const numericValue = parseFloat(editValue);
        if (isNaN(numericValue)) {
            return;
        }

        setSavingSlug(slug);
        try {
            const response = await fetch(`/api/global-prices/${slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: numericValue }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setPrices(prev => prev.map(p => p.slug === slug ? data.data : p));
            setEditingSlug(null);
        } catch (err) {
            console.error('Error saving price:', err);
        } finally {
            setSavingSlug(null);
        }
    };

    const handleCancel = () => {
        setEditingSlug(null);
        setEditValue('');
    };

    const handleRefetch = async (slug: string) => {
        setRefetchingSlug(slug);
        try {
            const response = await fetch(`/api/global-prices/${slug}/refetch`, {
                method: 'POST',
            });

            const data = await response.json();
            if (data.error) {
                alert(`خطا در دریافت قیمت: ${data.error}`);
                return;
            }

            setPrices(prev => prev.map(p => p.slug === slug ? data.data : p));
        } catch (err) {
            console.error('Error refetching price:', err);
            alert('خطا در اتصال به سرور');
        } finally {
            setRefetchingSlug(null);
        }
    };

    const formatRelativeTime = (dateString: string | null): string => {
        if (!dateString) return 'هنوز به‌روز نشده';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'همین الان';
        if (diffMins < 60) return `${diffMins} دقیقه پیش`;
        if (diffHours < 24) return `${diffHours} ساعت پیش`;
        return `${diffDays} روز پیش`;
    };

    if (loading) {
        return (
            <div className="bg-slate-800 p-4 rounded-lg shadow-xl mb-6">
                <div className="flex items-center justify-center gap-2 py-4">
                    <div className="animate-spin h-5 w-5 border-2 border-sky-400 border-t-transparent rounded-full"></div>
                    <span className="text-slate-400">در حال بارگذاری قیمت‌های جهانی...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-800 p-4 rounded-lg shadow-xl mb-6">
                <div className="text-red-400 text-center py-4">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-xl mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-sky-400">قیمت‌های جهانی فلزات</h2>
                <span className="text-xs text-slate-500">قیمت‌ها به USD/mt</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-right py-3 px-2 text-slate-400 font-medium">نام جهانی</th>
                            <th className="text-right py-3 px-2 text-slate-400 font-medium">نام محلی</th>
                            <th className="text-right py-3 px-2 text-slate-400 font-medium">قیمت (USD/mt)</th>
                            <th className="text-right py-3 px-2 text-slate-400 font-medium">آخرین به‌روزرسانی</th>
                            <th className="text-center py-3 px-2 text-slate-400 font-medium">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prices.map((price) => (
                            <tr key={price.slug} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                <td className="py-3 px-2 text-slate-300">{price.globalName}</td>
                                <td className="py-3 px-2 text-slate-300">{price.localLabel}</td>
                                <td className="py-3 px-2">
                                    {editingSlug === price.slug ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave(price.slug);
                                                    if (e.key === 'Escape') handleCancel();
                                                }}
                                                className="w-24 bg-slate-700 border border-slate-500 text-slate-200 text-sm rounded px-2 py-1 focus:ring-sky-500 focus:border-sky-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSave(price.slug)}
                                                disabled={savingSlug === price.slug}
                                                className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                                            >
                                                {savingSlug === price.slug ? (
                                                    <div className="animate-spin h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full"></div>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="text-slate-400 hover:text-slate-300"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className="flex items-center gap-2 cursor-pointer group"
                                            onClick={() => handleEdit(price)}
                                        >
                                            <span className={`font-medium ${price.price ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {price.price ? price.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                                            </span>
                                            {price.manuallyUpdated && (
                                                <span className="text-xs text-amber-400">(دستی)</span>
                                            )}
                                            <svg className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 px-2 text-slate-400 text-xs">
                                    {formatRelativeTime(price.lastFetchedAt || price.updatedAt)}
                                </td>
                                <td className="py-3 px-2">
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => handleRefetch(price.slug)}
                                            disabled={refetchingSlug === price.slug}
                                            className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded transition-colors"
                                        >
                                            {refetchingSlug === price.slug ? (
                                                <>
                                                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                                    <span>در حال دریافت...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    <span>به‌روزرسانی</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
