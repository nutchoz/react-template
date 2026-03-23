import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
// import { useAuth } from '../lib/context/auth';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
    exportRender?: (value: any, row: any) => string;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    title?: string;
    searchable?: boolean;
    exportable?: boolean;
    printable?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    loading?: boolean;
    emptyMessage?: string;
    rowClassName?: (row: any, index: number) => string;
    onRowClick?: (row: any) => void;
}

export default function DataTable({
    columns,
    data,
    title = 'Data Table',
    searchable = true,
    exportable = true,
    printable = true,
    pageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    loading = false,
    emptyMessage = 'No data available',
    rowClassName,
    onRowClick
}: DataTableProps) {
    // const { admin } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(pageSize);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [showFilters, setShowFilters] = useState(false);

    // Reset to page 1 when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, columnFilters]);

    // Filter and search data
    const filteredData = useMemo(() => {
        let filtered = [...data];

        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(row =>
                columns.some(col => {
                    const value = row[col.key];
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(searchTerm.toLowerCase());
                })
            );
        }

        // Apply column filters
        Object.keys(columnFilters).forEach(key => {
            const filterValue = columnFilters[key];
            if (filterValue) {
                filtered = filtered.filter(row => {
                    const value = row[key];
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(filterValue.toLowerCase());
                });
            }
        });

        return filtered;
    }, [data, searchTerm, columnFilters, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;

        const sorted = [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            const aString = String(aValue).toLowerCase();
            const bString = String(bValue).toLowerCase();

            if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const handleSort = (key: string) => {
        const column = columns.find(col => col.key === key);
        if (!column?.sortable) return;

        setSortConfig(current => {
            if (!current || current.key !== key) {
                return { key, direction: 'asc' };
            }
            if (current.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            return null;
        });
    };

    const handleColumnFilter = (key: string, value: string) => {
        setColumnFilters(current => ({
            ...current,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setColumnFilters({});
        setSearchTerm('');
    };

    const handleExportExcel = () => {
        const exportData = sortedData.map(row => {
            const exportRow: any = {};
            columns.forEach(col => {
                const value = row[col.key];
                exportRow[col.label] = col.exportRender
                    ? col.exportRender(value, row)
                    : value;
            });
            return exportRow;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `${title}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportCSV = () => {
        const headers = columns.map(col => col.label).join(',');
        const rows = sortedData.map(row =>
            columns.map(col => {
                const value = row[col.key];
                const exportValue = col.exportRender
                    ? col.exportRender(value, row)
                    : value;
                const stringValue = String(exportValue ?? '');
                // Escape quotes and wrap in quotes if contains comma
                return stringValue.includes(',') || stringValue.includes('"')
                    ? `"${stringValue.replace(/"/g, '""')}"`
                    : stringValue;
            }).join(',')
        );

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        const headers = columns.map(col => col.label).join('\t');
        const rows = sortedData.map(row =>
            columns.map(col => {
                const value = row[col.key];
                return col.exportRender
                    ? col.exportRender(value, row)
                    : String(value ?? '');
            }).join('\t')
        );

        const text = [headers, ...rows].join('\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('Data copied to clipboard!');
        });
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        font-family: 'Outfit', Arial, sans-serif;
                        padding: 20px;
                        color: #1e293b;
                    }
                    h1 {
                        color: #0f172a;
                        border-bottom: 3px solid #3b82f6;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th {
                        background: #0f172a;
                        color: white;
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        border: 1px solid #334155;
                    }
                    td {
                        padding: 10px;
                        border: 1px solid #e2e8f0;
                    }
                    tr:nth-child(even) {
                        background: #f8fafc;
                    }
                    .print-footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #64748b;
                    }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Total Records: ${sortedData.length}</p>
                <table>
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${col.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedData.map(row => `
                            <tr>
                                ${columns.map(col => {
            const value = row[col.key];
            const displayValue = col.exportRender
                ? col.exportRender(value, row)
                : String(value ?? '');
            return `<td>${displayValue}</td>`;
        }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="print-footer">
                    <p>© ${new Date().getFullYear()} - Printed from Data Management System</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="data-table-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');
                
                .data-table-container {
                    font-family: 'Outfit', sans-serif;
                }
                
                .table-row-hover {
                    transition: all 0.3s ease;
                }
                
                .table-row-hover:hover {
                    transform: translateX(4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
                }
                
                .sort-icon {
                    transition: transform 0.2s ease;
                }
                
                .sort-icon:hover {
                    transform: scale(1.2);
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .fade-in {
                    animation: fadeIn 0.5s ease forwards;
                }
            `}</style>

            {/* Header Controls */}
            <div className="bg-white rounded-t-3xl shadow-lg border-b-2 border-slate-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}>
                            {title}
                        </h2>
                        <p className="text-sm text-slate-600">
                            Showing {paginatedData.length} of {sortedData.length} entries
                            {sortedData.length !== data.length && ` (filtered from ${data.length} total)`}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {searchable && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg ${showFilters
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-blue-500'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                </span>
                            </button>
                        )}

                        {exportable && (
                            <>
                                <button
                                    onClick={handleExportExcel}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                        </svg>
                                        Excel
                                    </span>
                                </button>

                                <button
                                    onClick={handleExportCSV}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                        </svg>
                                        CSV
                                    </span>
                                </button>

                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                        Copy
                                    </span>
                                </button>
                            </>
                        )}

                        {printable && (
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-slate-700 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                                    </svg>
                                    Print
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                {searchable && (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search across all columns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-5 py-3 pl-12 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-slate-800 transition-all"
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Column Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wide">Column Filters</h3>
                            {Object.keys(columnFilters).some(key => columnFilters[key]) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {columns.filter(col => col.filterable !== false).map(col => (
                                <div key={col.key}>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                                        {col.label}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={`Filter ${col.label.toLowerCase()}...`}
                                        value={columnFilters[col.key] || ''}
                                        onChange={(e) => handleColumnFilter(col.key, e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                                <p className="text-slate-600 text-lg font-medium">Loading data...</p>
                            </div>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                                    {columns.map(col => (
                                        <th
                                            key={col.key}
                                            className="py-4 px-6 text-left text-xs font-bold text-slate-300 uppercase tracking-wider border-r border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
                                            onClick={() => handleSort(col.key)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{col.label}</span>
                                                {col.sortable !== false && (
                                                    <div className="sort-icon">
                                                        {sortConfig?.key === col.key ? (
                                                            sortConfig.direction === 'asc' ? (
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            )
                                                        ) : (
                                                            <svg className="w-4 h-4 opacity-40" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row, index) => (
                                        <tr
                                            key={index}
                                            className={`table-row-hover bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 fade-in ${onRowClick ? 'cursor-pointer' : ''
                                                } ${rowClassName ? rowClassName(row, index) : ''}`}
                                            onClick={() => onRowClick?.(row)}
                                            style={{
                                                animationDelay: `${index * 0.05}s`,
                                                opacity: 0
                                            }}
                                        >
                                            {columns.map(col => (
                                                <td key={col.key} className="py-4 px-6 border-r border-slate-100 text-sm text-slate-800">
                                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="bg-slate-100 rounded-full p-6">
                                                    <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                </div>
                                                <p className="text-slate-500 text-lg font-medium">{emptyMessage}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {!loading && paginatedData.length > 0 && (
                <div className="bg-white rounded-b-3xl shadow-lg border-t-2 border-slate-200 px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Items per page */}
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-slate-700">Show</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                            >
                                {pageSizeOptions.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <label className="text-sm font-semibold text-slate-700">entries</label>
                        </div>

                        {/* Pagination controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-lg font-semibold text-sm bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                First
                            </button>

                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-lg font-semibold text-sm bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${currentPage === pageNum
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg scale-110'
                                                    : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-lg font-semibold text-sm bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-lg font-semibold text-sm bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Last
                            </button>
                        </div>

                        {/* Page info */}
                        <div className="text-sm font-semibold text-slate-700">
                            Page {currentPage} of {totalPages}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}