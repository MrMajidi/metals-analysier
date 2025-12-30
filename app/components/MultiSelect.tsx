import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}

export default function MultiSelect({
    label,
    options,
    selected,
    onChange,
    placeholder = 'انتخاب کنید...',
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter((item) => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block mb-2 text-sm font-medium text-slate-400">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 text-right flex justify-between items-center"
            >
                <span className="truncate">
                    {selected.length > 0 ? `${selected.length} مورد انتخاب شده` : placeholder}
                </span>
                <svg
                    className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-slate-800 border-b border-slate-700 z-10">
                        <input
                            type="text"
                            placeholder="جستجو..."
                            className="w-full bg-slate-700 text-slate-200 text-sm rounded border border-slate-600 p-2 focus:ring-sky-500 focus:border-sky-500"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase();
                                const items = document.querySelectorAll(`[data-option-value]`);
                                items.forEach((item) => {
                                    const value = item.getAttribute('data-option-value')?.toLowerCase() || '';
                                    if (value.includes(searchTerm)) {
                                        (item as HTMLElement).style.display = 'block';
                                    } else {
                                        (item as HTMLElement).style.display = 'none';
                                    }
                                });
                            }}
                        />
                    </div>
                    <ul className="p-2 space-y-1">
                        {options.map((option) => (
                            <li key={option} data-option-value={option}>
                                <label className="flex items-center p-2 rounded hover:bg-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(option)}
                                        onChange={() => toggleOption(option)}
                                        className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-500 rounded focus:ring-sky-600 ring-offset-slate-800 focus:ring-2"
                                    />
                                    <span className="mr-2 text-sm text-slate-200">{option}</span>
                                </label>
                            </li>
                        ))}
                        {options.length === 0 && (
                            <li className="p-2 text-sm text-slate-500 text-center">موردی یافت نشد</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
