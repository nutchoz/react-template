import { useEffect, useState } from 'react';
import RequestHandler from '../lib/utilities/RequestHandler';
import Swal from 'sweetalert2';
import DataTable from '../components/table';

export default function PaymentTab() {
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [paymentNeedAmount, setPaymentNeedAmount] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [ePaymentProvider, setEPaymentProvider] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchRecords(); }, []);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const response = await RequestHandler.fetchData('GET', 'gate-entry/get-all');
            if (response?.success) {
                const filtered = response.gateEntries.filter(
                    (entry: any) => entry.block_location?.toUpperCase() !== 'SYS'
                );
                setRecords(filtered);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch data.' });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while fetching data.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusClick = (record: any) => {

        if (record.payment_status === 'paid' || record.gate_out) return;

        const isLaden = record.move_type?.toLowerCase() === 'laden';

        if (!isLaden && record.gate_in_payment_status !== 'paid') {
            Swal.fire({
                icon: 'warning',
                title: 'Gate In Payment Required',
                html: `<p>Please complete the <strong>Gate In payment</strong> before proceeding to Gate Out payment.</p>`,
                confirmButtonColor: '#0F172A',
            });
            return;
        }

        setSelectedRecord(record);
        setPaymentNeedAmount(record.payment_need?.toString() || '');
        setPaymentAmount('');
        setPaymentMethod('');
        setEPaymentProvider('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentReference('');
        setShowModal(true);
    };

    const handlePaymentMethodChange = (method: string) => {
        setPaymentMethod(method);
        setEPaymentProvider('');
        setPaymentReference('');
    };

    const handleSubmitPayment = async () => {
        if (!paymentMethod) {
            Swal.fire({ icon: 'warning', title: 'Oops!', text: 'Please select a payment method.', confirmButtonColor: '#0F172A' });
            return;
        }
        if (paymentMethod === 'check' && !ePaymentProvider) {
            Swal.fire({ icon: 'warning', title: 'Provider Required', text: 'Please select an e-payment provider.', confirmButtonColor: '#0F172A' });
            return;
        }
        if (!paymentReference.trim()) {
            Swal.fire({ icon: 'warning', title: 'Reference Required', text: 'Please enter a reference number.', confirmButtonColor: '#0F172A' });
            return;
        }

        const needAmount = paymentNeedAmount ? parseFloat(paymentNeedAmount) : 0;
        if (isNaN(needAmount) || needAmount < 0) {
            Swal.fire({ icon: 'error', title: 'Invalid Required Amount', text: 'Please enter a valid required amount.', confirmButtonColor: '#0F172A' });
            return;
        }

        const amount = paymentAmount ? parseFloat(paymentAmount) : 0;
        if (isNaN(amount) || amount <= 0) {
            Swal.fire({ icon: 'error', title: 'Invalid Amount', text: 'Please enter a valid payment amount.', confirmButtonColor: '#0F172A' });
            return;
        }
        if (needAmount > 0 && amount < needAmount) {
            Swal.fire({ icon: 'error', title: 'Amount Too Low', text: `Payment amount cannot be less than the required amount: ₱${needAmount.toLocaleString()}`, confirmButtonColor: '#0F172A' });
            return;
        }

        setIsSubmitting(true);
        try {
            const finalMethod = paymentMethod === 'check' ? ePaymentProvider : paymentMethod;

            const response = await RequestHandler.fetchData(
                'PATCH',
                `gate-entry/${selectedRecord.id}/payment`,
                {
                    payment_status: 'paid',
                    payment_need: needAmount,
                    payment_amount: amount,
                    payment_method: finalMethod,
                    payment_date: paymentDate,
                    payment_reference: paymentReference,
                }
            );

            if (response?.success) {
                setRecords(prev => prev.map(r =>
                    r.id === selectedRecord.id
                        ? {
                            ...r,
                            payment_status: 'paid',
                            payment_need: needAmount,
                            payment_amount: amount,
                            payment_method: finalMethod,
                            payment_date: paymentDate,
                            payment_reference: paymentReference,
                        }
                        : r
                ));
                handleCloseModal();
                Swal.fire({ icon: 'success', title: 'Success!', text: 'Payment recorded successfully.', confirmButtonColor: '#0F172A' });
            } else {
                Swal.fire({ icon: 'error', title: 'Failed', text: response?.message || 'Failed to update payment status.', confirmButtonColor: '#0F172A' });
            }
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error?.message || 'An error occurred.', confirmButtonColor: '#0F172A' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRecord(null);
        setPaymentNeedAmount('');
        setPaymentAmount('');
        setPaymentMethod('');
        setEPaymentProvider('');
        setPaymentDate('');
        setPaymentReference('');
    };

    const columns = [
        {
            key: 'gate_in', label: 'Gate In', sortable: true,
            render: (value: any) => (
                <div className="whitespace-nowrap">
                    <p className="text-sm font-semibold text-slate-800">{value ? new Date(value).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-slate-500">{value ? new Date(value).toLocaleTimeString() : ''}</p>
                </div>
            ),
            exportRender: (value: any) => value ? new Date(value).toLocaleString() : 'N/A',
        },
        {
            key: 'location', label: 'Location', sortable: true,
            render: (_: any, row: any) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold whitespace-nowrap">
                    {row.gate_out ? 'OUT' : `${row.block_location}-${row.row_location}-${row.col_location}-${row.tier_location}`}
                </span>
            ),
            exportRender: (_: any, row: any) => row.gate_out ? 'OUT' : `${row.block_location}-${row.row_location}-${row.col_location}-${row.tier_location}`,
        },
        {
            key: 'container_no', label: 'Container No.', sortable: true,
            render: (value: any) => <p className="text-sm font-bold text-slate-800 font-mono whitespace-nowrap">{value}</p>,
            exportRender: (value: any) => value,
        },
        {
            key: 'move_type', label: 'Move Type', sortable: true,
            render: (value: any) => {
                const isLaden = value?.toLowerCase() === 'laden';
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                        isLaden ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                        {value || 'N/A'}
                    </span>
                );
            },
            exportRender: (value: any) => value || 'N/A',
        },
        {
            key: 'days_in_yard', label: 'Days', sortable: true,
            render: (value: any) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
                    {value || 0}d
                </span>
            ),
            exportRender: (value: any) => `${value || 0} ${value === 1 ? 'Day' : 'Days'}`,
        },
        {
            key: 'gate_in_payment_status', label: 'Gate In', sortable: true,
            render: (value: any, row: any) => {
                const isLaden = row.move_type?.toLowerCase() === 'laden';
                return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                        value === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isLaden
                            ? 'bg-slate-50 text-slate-500 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${value === 'paid' ? 'bg-emerald-500' : isLaden ? 'bg-slate-400' : 'bg-amber-500'}`} />
                        {value === 'paid' ? 'Paid' : isLaden ? 'Optional' : 'Unpaid'}
                    </span>
                );
            },
            exportRender: (value: any, row: any) => {
                if (value === 'paid') return 'Paid';
                if (row.move_type?.toLowerCase() === 'laden') return 'Optional';
                return 'Unpaid';
            },
        },
        {
            key: 'payment_need', label: 'Req. Amount', sortable: true,
            render: (value: any) => (
                value != null && value > 0
                    ? <p className="text-sm font-bold text-slate-800 whitespace-nowrap">₱{parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    : <span className="text-xs text-slate-400 italic">To be set</span>
            ),
            exportRender: (value: any) => value ? `₱${parseFloat(value).toFixed(2)}` : 'N/A',
        },
        {
            key: 'payment_method', label: 'Method', sortable: true,
            render: (value: any) => {
                if (!value) return <span className="text-xs text-slate-400 italic">N/A</span>;
                const isCash = value.toLowerCase() === 'cash';
                const isEpayment = !['cash', 'check'].includes(value.toLowerCase());
                return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                        isCash ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isEpayment ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                        {isCash ? '💵' : '📱'} {value}
                    </span>
                );
            },
            exportRender: (value: any) => value || 'N/A',
        },
        {
            key: 'payment_reference', label: 'Ref No.', sortable: true,
            render: (value: any) => value
                ? <p className="text-sm font-mono font-semibold text-slate-800 max-w-[100px] truncate" title={value}>{value}</p>
                : <span className="text-xs text-slate-400 italic">N/A</span>,
            exportRender: (value: any) => value || 'N/A',
        },
        {
            key: 'payment_amount', label: 'Amt Paid', sortable: true,
            render: (value: any) => (
                value
                    ? <p className="text-sm font-bold text-slate-800 whitespace-nowrap">₱{parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    : <span className="text-xs text-slate-400 italic">N/A</span>
            ),
            exportRender: (value: any) => value ? `₱${parseFloat(value).toFixed(2)}` : 'N/A',
        },
        {
            key: 'payment_status', label: 'Gate Out', sortable: true, filterable: true,
            render: (_: any, row: any) => {
                const isLaden = row.move_type?.toLowerCase() === 'laden';
                const isPaid = row.gate_out || row.payment_status === 'paid';
                const gateInUnpaid = row.gate_in_payment_status !== 'paid';

                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleStatusClick(row); }}
                        disabled={isPaid}
                        title={!isLaden && gateInUnpaid && !isPaid ? 'Gate In payment required first' : undefined}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-md whitespace-nowrap ${
                            isPaid
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-default'
                                : isLaden && !isPaid
                                ? 'bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-50 cursor-pointer hover:shadow-lg'
                                : gateInUnpaid
                                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 cursor-pointer hover:shadow-lg'
                        }`}
                    >
                        {isPaid ? (
                            <><svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>PAID</>
                        ) : isLaden ? (
                            <><svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>OPTIONAL</>
                        ) : gateInUnpaid ? (
                            <><svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>LOCKED</>
                        ) : (
                            <><svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>UNPAID</>
                        )}
                    </button>
                );
            },
            exportRender: (_: any, row: any) => {
                if (row.gate_out || row.payment_status === 'paid') return 'PAID';
                if (row.move_type?.toLowerCase() === 'laden') return 'OPTIONAL';
                return 'UNPAID';
            },
        },
    ];

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');
                .payment-container { font-family: 'Outfit', sans-serif; }
                .modal-backdrop { backdrop-filter: blur(8px); animation: fadeIn 0.3s ease; }
                .modal-content { animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .input-field { transition: all 0.3s ease; }
                .input-field:focus { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15); }
                .provider-appear { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>

<div className="payment-container" style={{ width: '90%', minWidth: 0, overflow: 'hidden' }}>
    <div style={{ overflowX: 'auto', width: '100%' }}>
        <div style={{ minWidth: '1100px' }}>
            <DataTable
                columns={columns}
                data={records}
                title="Gate Out Payment Transactions"
                loading={isLoading}
                searchable={true}
                exportable={true}
                printable={true}
                pageSize={10}
                pageSizeOptions={[10, 25, 50, 100]}
                emptyMessage="No payment records found"
            />
        </div>
    </div>
</div>

            {showModal && (
                <div className="modal-backdrop fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

                        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-8 py-6 rounded-t-3xl flex-shrink-0">
                            <h2 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}>Gate Out Payment</h2>
                            <p className="text-blue-200 text-sm">Record the gate out payment for this container</p>
                        </div>

                        <div className="px-8 py-6 space-y-5 overflow-y-auto flex-1 min-h-0">

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Container Number</p>
                                <p className="text-2xl font-black text-slate-900 font-mono">{selectedRecord?.container_no}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Days in yard: <span className="font-bold">{selectedRecord?.days_in_yard || 0}</span>
                                </p>
                                {selectedRecord?.move_type?.toLowerCase() === 'laden' && (
                                    <p className="mt-2 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5">
                                        🚛 Laden container — payment is optional but can still be recorded.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                    Required Amount <span className="text-rose-500">*</span>
                                    <span className="ml-2 text-xs font-normal text-slate-500 normal-case">(based on days in yard)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                                    <input
                                        type="number"
                                        value={paymentNeedAmount}
                                        onChange={(e) => setPaymentNeedAmount(e.target.value)}
                                        className="input-field w-full pl-10 pr-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-lg text-slate-800"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                    Payment Amount <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold">₱</span>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="input-field w-full pl-10 pr-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-lg text-slate-800"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Payment Method <span className="text-rose-500">*</span></label>
                                <select value={paymentMethod} onChange={(e) => handlePaymentMethodChange(e.target.value)} className="input-field w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800 bg-white">
                                    <option value="">Select payment method</option>
                                    <option value="cash">💵 Cash</option>
                                    <option value="check">📱 E-Payment</option>
                                </select>
                            </div>

                            {paymentMethod === 'check' && (
                                <div className="provider-appear">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">E-Payment Provider <span className="text-rose-500">*</span></label>
                                    <select value={ePaymentProvider} onChange={(e) => setEPaymentProvider(e.target.value)} className="input-field w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800 bg-white">
                                        <option value="">Select provider</option>
                                        <option value="GCash">GCash</option>
                                        <option value="PayMaya">PayMaya</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Debit Card">Debit Card</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Online Banking">Online Banking</option>
                                    </select>
                                </div>
                            )}

                            {paymentMethod && (
                                <div className="provider-appear">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Reference Number <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        className="input-field w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                                        placeholder={paymentMethod === 'cash' ? 'Enter cash receipt reference number' : 'Enter e-payment reference number'}
                                    />
                                    <p className="mt-1.5 text-xs text-slate-500">
                                        {paymentMethod === 'cash' ? 'Enter the reference number from the cash receipt.' : 'Enter the reference number provided by your e-payment provider.'}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Payment Date <span className="text-rose-500">*</span></label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="input-field w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-slate-50 flex gap-4 rounded-b-3xl flex-shrink-0 border-t border-slate-200">
                            <button onClick={handleCloseModal} disabled={isSubmitting} className="flex-1 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all disabled:opacity-50 shadow-md hover:shadow-lg">
                                Cancel
                            </button>
                            <button onClick={handleSubmitPayment} disabled={isSubmitting} className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105">
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        Processing...
                                    </span>
                                ) : 'Submit Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
