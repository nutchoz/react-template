import { useEffect, useState } from 'react';
import RequestHandler from '../lib/utilities/RequestHandler';
import Swal from 'sweetalert2';
import DataTable from '../components/table';

export default function GateInPaymentTab() {
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
        //  Already paid — do nothing
        if (record.gate_in_payment_status === 'paid') return;

        //  Laden and non-Laden both allowed to open the payment modal — no blocking
        setSelectedRecord(record);
        setPaymentAmount('');
        setPaymentMethod('');
        setEPaymentProvider('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentNeedAmount(record.gate_in_payment_need?.toString() || '');
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

        const amount = paymentAmount ? parseFloat(paymentAmount) : 0;
        if (isNaN(amount) || amount < 0) {
            Swal.fire({ icon: 'error', title: 'Invalid Amount', text: 'Please enter a valid payment amount.', confirmButtonColor: '#0F172A' });
            return;
        }
        if (paymentNeedAmount && amount < parseFloat(paymentNeedAmount)) {
            Swal.fire({ icon: 'error', title: 'Amount Too Low', text: `Payment amount cannot be less than the required amount: ₱${parseFloat(paymentNeedAmount).toLocaleString()}`, confirmButtonColor: '#0F172A' });
            return;
        }

        setIsSubmitting(true);
        try {
            const finalMethod = paymentMethod === 'check' ? ePaymentProvider : paymentMethod;

            const response = await RequestHandler.fetchData(
                'PATCH',
                `gate-entry/${selectedRecord.id}/gate-in-payment`,
                {
                    gate_in_payment_status: 'paid',
                    gate_in_payment_amount: amount,
                    gate_in_payment_method: finalMethod,
                    gate_in_payment_date: paymentDate,
                    gate_in_payment_reference: paymentReference,
                }
            );

            if (response?.success) {
                setRecords(prev => prev.map(r =>
                    r.id === selectedRecord.id
                        ? { ...r, gate_in_payment_status: 'paid', gate_in_payment_amount: amount, gate_in_payment_method: finalMethod, gate_in_payment_date: paymentDate, gate_in_payment_reference: paymentReference }
                        : r
                ));
                handleCloseModal();
                Swal.fire({ icon: 'success', title: 'Success!', text: 'Gate In payment recorded successfully.', confirmButtonColor: '#0F172A' });
            } else {
                Swal.fire({ icon: 'error', title: 'Failed', text: response?.message || 'Failed to update payment.', confirmButtonColor: '#0F172A' });
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
                <div>
                    <p className="text-sm font-semibold text-slate-800">{value ? new Date(value).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-slate-500">{value ? new Date(value).toLocaleTimeString() : ''}</p>
                </div>
            ),
            exportRender: (value: any) => value ? new Date(value).toLocaleString() : 'N/A',
        },
        {
            key: 'location', label: 'Location', sortable: true,
            render: (_: any, row: any) => (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-mono font-semibold">
                    {row.gate_out ? 'OUT' : `${row.block_location}-${row.row_location}-${row.col_location}-${row.tier_location}`}
                </span>
            ),
            exportRender: (_: any, row: any) => row.gate_out ? 'OUT' : `${row.block_location}-${row.row_location}-${row.col_location}-${row.tier_location}`,
        },
        {
            key: 'container_no', label: 'Container No.', sortable: true,
            render: (value: any) => <p className="text-sm font-bold text-slate-800 font-mono tracking-wide">{value}</p>,
            exportRender: (value: any) => value,
        },
        {
            key: 'move_type', label: 'Move Type', sortable: true,
            render: (value: any) => {
                const isLaden = value?.toLowerCase() === 'laden';
                return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        isLaden ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                        {isLaden ? ' ' : ' '} {value || 'N/A'}
                    </span>
                );
            },
            exportRender: (value: any) => value || 'N/A',
        },
        {
            key: 'gate_in_payment_need', label: 'Required Amount', sortable: true,
            render: (value: any) => (
                value != null
                    ? <p className="text-sm font-bold text-slate-800">₱{parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    : <span className="text-sm text-slate-400 italic">N/A</span>
            ),
            exportRender: (value: any) => value ? `₱${parseFloat(value).toFixed(2)}` : 'N/A',
        },
        {
            key: 'gate_in_payment_method', label: 'Payment Method', sortable: true,
            render: (value: any) => {
                if (!value) return <span className="text-sm text-slate-400 italic">N/A</span>;
                const isCash = value.toLowerCase() === 'cash';
                const isEpayment = !['cash', 'check'].includes(value.toLowerCase());
                return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isCash ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isEpayment ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {isCash ? '💵' : '📱'} {value}
                    </span>
                );
            },
            exportRender: (value: any) => value || 'N/A',
        },
        {
            key: 'gate_in_payment_reference', label: 'Reference No.', sortable: true,
            render: (value: any) => value
                ? <p className="text-sm font-mono font-semibold text-slate-800">{value}</p>
                : <span className="text-sm text-slate-400 italic">N/A</span>,
            exportRender: (value: any) => value || 'N/A',
        },
        {
            key: 'gate_in_payment_amount', label: 'Amount Paid', sortable: true,
            render: (value: any) => (
                value
                    ? <p className="text-sm font-bold text-slate-800">₱{parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    : <span className="text-sm text-slate-400 italic">N/A</span>
            ),
            exportRender: (value: any) => value ? `₱${parseFloat(value).toFixed(2)}` : 'N/A',
        },
        {
            key: 'gate_in_payment_status', label: 'Gate In Payment', sortable: true, filterable: true,
            render: (_: any, row: any) => {
                const isLaden = row.move_type?.toLowerCase() === 'laden';
                const isPaid = row.gate_in_payment_status === 'paid';

                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleStatusClick(row); }}
                        disabled={isPaid}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                            isPaid
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-default'
                                : isLaden
                                //  Laden unpaid — teal outline to signal optional but payable
                                ? 'bg-white border-2 border-teal-400 text-teal-600 hover:bg-teal-50 cursor-pointer hover:shadow-xl transform hover:scale-105'
                                : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 cursor-pointer hover:shadow-xl transform hover:scale-105'
                        }`}
                    >
                        {isPaid ? (
                            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>PAID</>
                        ) : isLaden ? (
                            //  Laden unpaid — OPTIONAL label, still clickable
                            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>OPTIONAL</>
                        ) : (
                            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>UNPAID</>
                        )}
                    </button>
                );
            },
            exportRender: (_: any, row: any) => {
                if (row.gate_in_payment_status === 'paid') return 'PAID';
                if (row.move_type?.toLowerCase() === 'laden') return 'OPTIONAL';
                return 'UNPAID';
            },
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
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

<div className="payment-container" style={{ width: '96%', minWidth: 0, overflow: 'hidden' }}>
    <div style={{ overflowX: 'auto', width: '100%' }}>
        <div style={{ minWidth: '1100px' }}>
            <DataTable
                columns={columns}
                data={records}
                title="Gate In Payments"
                loading={isLoading}
                searchable={true}
                exportable={true}
                printable={true}
                pageSize={10}
                pageSizeOptions={[10, 25, 50, 100]}
                emptyMessage="No gate in payment records found"
            />
        </div>
    </div>


                {showModal && (
                    <div className="modal-backdrop fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-8 py-6 rounded-t-3xl flex-shrink-0">
                                <h2 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}>Gate In Payment</h2>
                                <p className="text-blue-200 text-sm">Record the gate in payment for this container</p>
                            </div>

                            <div className="px-8 py-6 space-y-5 overflow-y-auto flex-1 min-h-0">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Container Number</p>
                                    <p className="text-2xl font-black text-slate-900 font-mono">{selectedRecord?.container_no}</p>
                                    {/*  Laden optional notice */}
                                    {selectedRecord?.move_type?.toLowerCase() === 'laden' && (
                                        <p className="mt-2 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5">
                                             Laden container — payment is optional but can still be recorded.
                                        </p>
                                    )}
                                </div>

                                {/* Required Amount (read-only) */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Required Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                                        <input type="number" disabled value={paymentNeedAmount} className="w-full pl-10 pr-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 cursor-not-allowed" />
                                    </div>
                                </div>

                                {/* Payment Amount */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Payment Amount <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold">₱</span>
                                        <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="input-field w-full pl-10 pr-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-lg text-slate-800" placeholder="0.00" step="0.01" />
                                    </div>
                                </div>

                                {/* Payment Method */}
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
                                        <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="input-field w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800" placeholder={paymentMethod === 'cash' ? 'Enter cash receipt reference number' : 'Enter e-payment reference number'} />
                                        <p className="mt-1.5 text-xs text-slate-500">{paymentMethod === 'cash' ? 'Enter the reference number from the cash receipt.' : 'Enter the reference number provided by your e-payment provider.'}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Payment Date <span className="text-rose-500">*</span></label>
                                    <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="input-field w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800" />
                                </div>
                            </div>

                            <div className="px-8 py-6 bg-slate-50 flex gap-4 rounded-b-3xl flex-shrink-0 border-t border-slate-200">
                                <button onClick={handleCloseModal} disabled={isSubmitting} className="flex-1 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all disabled:opacity-50 shadow-md hover:shadow-lg">Cancel</button>
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
        </div>
    );
}