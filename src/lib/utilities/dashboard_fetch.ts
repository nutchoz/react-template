import RequestHandler from "./RequestHandler";

export interface GateEntry {
    id: number;
    gate_in: string;
    gate_out: string | null;
    block_location: string;
    row_location: number;
    col_location: number;
    tier_location: number | null;
    container_no: string;
    transaction_nbr: string;
    shipping_line: string;
    life_state: 'active' | 'inactive';
    booking_no: string;
    iso_code: string;
    category: string;
    reefer_reqt: string;
    seal_no: string | null;
    move_type: string;
    transport_company: string;
    drivers_name: string;
    driver_licence: string | null;
    plate_no: string;
    gross_weight: number;
    tare_weight: number;
    net_weight: number;
    vgm_weight: number | null;
    entry_lane: string | null;
    exit_lane: string | null;
    mnr_status: string;
    damage_code: string | null;
    inspection_notes: string | null;
    gate_inspector: string | null;
    trans_creator: string;
    person_incharge: string | null;
    // Gate-in payment
    gate_in_payment_status: 'paid' | 'unpaid';
    gate_in_payment_amount: number | null;
    gate_in_payment_method: string | null;
    gate_in_payment_date: string | null;
    gate_in_payment_reference: string | null;
    gate_in_payment_need: number | null;
    // Gate-out payment
    payment_status: string;
    payment_need: number | null;
    payment_amount: number | null;
    payment_method: string | null;
    payment_date: string | null;
    payment_reference: string | null;
    // Virtual
    days_in_yard?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ShippingLine {
    id: number;
    code: string;
    name: string;
    email: string | null;
    life_state: 'Active' | 'Inactive';
    createdAt: string;
    updatedAt: string;
}

export interface Driver {
    id: number;
    name: string;
    licenseNumber: string;
    status: 'active' | 'banned';
    lifeState: 'active' | 'deceased';
    createdAt: string;
    updatedAt: string;
}

export interface PlateNumber {
    id: number;
    plate_no: string;
    createdAt: string;
    updatedAt: string;
}

export interface TransportCompany {
    id: number;
    name: string;
    code: string;
    status: 'active' | 'banned';
    createdAt: string;
    updatedAt: string;
}

// ─── Raw API Response shapes ──────────────────────────────────────────────────

interface GateEntriesResponse {
    success: boolean;
    gateEntries: GateEntry[];
}

interface ShippingLinesResponse {
    success: boolean;
    shippingLines: ShippingLine[];
}

interface DriversResponse {
    success: boolean;
    drivers: Driver[];
}

interface PlateNumbersResponse {
    success: boolean;
    plateNumbers: PlateNumber[];
}

interface TransportCompaniesResponse {
    success: boolean;
    transportCompanies: TransportCompany[];
}

// ─── Aggregated dashboard payload ────────────────────────────────────────────

export interface DashboardData {
    gateEntries: GateEntry[];
    shippingLines: ShippingLine[];
    drivers: Driver[];
    plateNumbers: PlateNumber[];
    transportCompanies: TransportCompany[];
}

// ─── Individual fetchers ──────────────────────────────────────────────────────

export async function fetchGateEntries(): Promise<GateEntry[]> {
    try {
        const res: GateEntriesResponse = await RequestHandler.fetchData('GET', 'gate-entry/get-all');
        if (res?.success && Array.isArray(res.gateEntries)) return res.gateEntries;
        console.warn('[DashboardFetcher] fetchGateEntries: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchGateEntries failed:', err);
        return [];
    }
}

export async function fetchShippingLines(): Promise<ShippingLine[]> {
    try {
        const res: ShippingLinesResponse = await RequestHandler.fetchData('GET', 'shipping-lines/get-all');
        if (res?.success && Array.isArray(res.shippingLines)) return res.shippingLines;
        console.warn('[DashboardFetcher] fetchShippingLines: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchShippingLines failed:', err);
        return [];
    }
}

export async function fetchDrivers(): Promise<Driver[]> {
    try {
        const res: DriversResponse = await RequestHandler.fetchData('GET', 'drivers/get-all');
        if (res?.success && Array.isArray(res.drivers)) return res.drivers;
        console.warn('[DashboardFetcher] fetchDrivers: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchDrivers failed:', err);
        return [];
    }
}

export async function fetchPlateNumbers(): Promise<PlateNumber[]> {
    try {
        const res: PlateNumbersResponse = await RequestHandler.fetchData('GET', 'plate-numbers/get-all');
        if (res?.success && Array.isArray(res.plateNumbers)) return res.plateNumbers;
        console.warn('[DashboardFetcher] fetchPlateNumbers: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchPlateNumbers failed:', err);
        return [];
    }
}

export async function fetchTransportCompanies(): Promise<TransportCompany[]> {
    try {
        const res: TransportCompaniesResponse = await RequestHandler.fetchData('GET', 'transport-companies/get-all');
        if (res?.success && Array.isArray(res.transportCompanies)) return res.transportCompanies;
        console.warn('[DashboardFetcher] fetchTransportCompanies: unexpected response', res);
        return [];
    } catch (err) {
        console.error('[DashboardFetcher] fetchTransportCompanies failed:', err);
        return [];
    }
}

// ─── Main loader — fetches everything in parallel ─────────────────────────────

export async function fetchDashboardData(): Promise<DashboardData> {
    const [
        gateEntries,
        shippingLines,
        drivers,
        plateNumbers,
        transportCompanies,
    ] = await Promise.all([
        fetchGateEntries(),
        fetchShippingLines(),
        fetchDrivers(),
        fetchPlateNumbers(),
        fetchTransportCompanies(),
    ]);

    return {
        gateEntries,
        shippingLines,
        drivers,
        plateNumbers,
        transportCompanies,
    };
}

// ─── Date-range helpers (used by Dashboard + Reports) ────────────────────────

export function startOf(date: Date, unit: 'day' | 'week' | 'month'): Date {
    const d = new Date(date);
    if (unit === 'day') { d.setHours(0, 0, 0, 0); return d; }
    if (unit === 'week') { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
    d.setDate(1); d.setHours(0, 0, 0, 0); return d;
}

export function endOf(date: Date, unit: 'day' | 'week' | 'month'): Date {
    const d = new Date(date);
    if (unit === 'day') { d.setHours(23, 59, 59, 999); return d; }
    if (unit === 'week') { d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(23, 59, 59, 999); return d; }
    d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); return d;
}

export function filterByRange(entries: GateEntry[], from: Date, to: Date): GateEntry[] {
    return entries.filter(e => {
        const d = new Date(e.gate_in);
        return d >= from && d <= to;
    });
}

// ─── Payment summary helper ───────────────────────────────────────────────────

export interface PaymentSummary {
    totalGateIn: number;
    totalGateOut: number;
    totalRevenue: number;
    totalUnpaidGateIn: number;
    totalUnpaidGateOut: number;
    paidGICount: number;
    unpaidGICount: number;
    paidGOCount: number;
    unpaidGOCount: number;
    totalExpected: number;
    collectionRate: number;
}

export function computePaymentSummary(entries: GateEntry[]): PaymentSummary {
    const totalGateIn   = entries.reduce((s, e) => s + (e.gate_in_payment_amount ?? 0), 0);
    const totalGateOut  = entries.reduce((s, e) => s + (e.payment_amount ?? 0), 0);
    const totalRevenue  = totalGateIn + totalGateOut;

    const totalUnpaidGateIn  = entries
        .filter(e => e.gate_in_payment_status === 'unpaid')
        .reduce((s, e) => s + (e.gate_in_payment_need ?? 0), 0);
    const totalUnpaidGateOut = entries
        .filter(e => e.payment_status === 'unpaid')
        .reduce((s, e) => s + (e.payment_need ?? 0), 0);

    const paidGICount   = entries.filter(e => e.gate_in_payment_status === 'paid').length;
    const unpaidGICount = entries.filter(e => e.gate_in_payment_status === 'unpaid').length;
    const paidGOCount   = entries.filter(e => e.payment_status === 'paid' && e.gate_out).length;
    const unpaidGOCount = entries.filter(e => e.payment_status === 'unpaid' && e.gate_out).length;

    const totalExpected = entries.reduce(
        (s, e) => s + (e.gate_in_payment_need ?? 0) + (e.payment_need ?? 0), 0
    );
    const collectionRate = totalExpected > 0
        ? Math.round((totalRevenue / totalExpected) * 100)
        : 0;

    return {
        totalGateIn, totalGateOut, totalRevenue,
        totalUnpaidGateIn, totalUnpaidGateOut,
        paidGICount, unpaidGICount,
        paidGOCount, unpaidGOCount,
        totalExpected, collectionRate,
    };
}