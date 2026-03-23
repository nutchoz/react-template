import React from 'react';

function formatDateTime(value: string | null) {
    if (!value) return "N/A";

    const date = new Date(value);

    return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}


interface EquipmentInterchangeReceiptProps {
  data: {
    gate_in: string;
    gate_out: string;
    transaction_nbr: string;
    location: string;
    shipping_line: string;
    container_no: string;
    booking_no: string;
    iso_code: string;
    category: string;
    seal_no: string;
    reefer_reqt: string;
    transport_company: string;
    drivers_name: string;
    driver_licence: string;
    plate_no: string;
    move_type: string;
    entry_lane: string;
    exit_lane: string;
    mnr_status: string;
    damage_code: string;
    inspection_notes: string;
    gate_inspector: string;
    gross_weight: string;
    tare_weight: string;
    net_weight: string;
    vgm_weight: string;
  };
}

const EquipmentInterchangeReceipt: React.FC<EquipmentInterchangeReceiptProps> = ({ data }) => {
  const getValue = (value: string | null | undefined) => (value ? value : 'N/A');

  return (
    <div className="p-8 bg-white text-gray-800 font-sans max-w-3xl mx-auto border border-gray-300 shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Equipment Interchange Receipt</h1>

      <section className="mb-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4"></h2>
        <p>
    <strong>Date & Time (Gate In):</strong> {formatDateTime(data.gate_in)}
</p>

<p>
    <strong>Date & Time (Gate Out):</strong> {formatDateTime(data.gate_out)}
</p>


     
        <p><strong>Transaction Number:</strong> {getValue(data.transaction_nbr)}</p>
        <p><strong>Location:</strong> {getValue(data.location)}</p>
      {/* </section> */}

      {/* <section className="mb-6"> */}
        {/* <h2 className="text-lg font-semibold border-b pb-2 mb-4">Container Information</h2> */}
        <p><strong>Shipping Line:</strong> {getValue(data.shipping_line)}</p>
        <p><strong>Container Number:</strong> {getValue(data.container_no)}</p>
        <p><strong>Booking Number:</strong> {getValue(data.booking_no)}</p>
        <p><strong>ISO Code:</strong> {getValue(data.iso_code)}</p>
        <p><strong>Category:</strong> {getValue(data.category)}</p>
      {/* </section> */}

      {/* <section className="mb-6"> */}
        {/* <h2 className="text-lg font-semibold border-b pb-2 mb-4">Seal & Reefer Details</h2> */}
        <p><strong>Seal Number:</strong> {getValue(data.seal_no)}</p>
        <p><strong>Reefer Requirement:</strong> {getValue(data.reefer_reqt)}</p>
      {/* </section> */}

      {/* <section className="mb-6"> */}
        {/* <h2 className="text-lg font-semibold border-b pb-2 mb-4">Transport & Driver Information</h2> */}
        <p><strong>Transport Company:</strong> {getValue(data.transport_company)}</p>
        <p><strong>Driver Name:</strong> {getValue(data.drivers_name)}</p>
        <p><strong>Driver License:</strong> {getValue(data.driver_licence)}</p>
        <p><strong>Plate Number:</strong> {getValue(data.plate_no)}</p>
      {/* </section> */}

      {/* <section className="mb-6"> */}
        {/* <h2 className="text-lg font-semibold border-b pb-2 mb-4">Movement Information</h2> */}
        <p><strong>Move Type:</strong> {getValue(data.move_type)}</p>
        <p><strong>Entry Lane:</strong> {getValue(data.entry_lane)}</p>
        <p><strong>Exit Lane:</strong> {getValue(data.exit_lane)}</p>
      {/* </section> */}

      {/* <section className="mb-6"> */}
        {/* <h2 className="text-lg font-semibold border-b pb-2 mb-4">Inspection & Condition</h2> */}
        <p><strong>MNR Status:</strong> {getValue(data.mnr_status)}</p>
        <p><strong>Damage Code(s):</strong> {getValue(data.damage_code)}</p>
        <p><strong>Inspection Notes:</strong> {getValue(data.inspection_notes)}</p>
        <p><strong>Gate Inspector:</strong> {getValue(data.gate_inspector)}</p>
      {/* </section> */}

      {/* <section className="mb-6"> */}
        {/* <h2 className="text-lg font-semibold border-b pb-2 mb-4">Weight Information</h2> */}
        <p><strong>Gross Weight:</strong> {getValue(data.gross_weight)} kg</p>
        <p><strong>Tare Weight:</strong> {getValue(data.tare_weight)} kg</p>
        <p><strong>Net Weight:</strong> {getValue(data.net_weight)} kg</p>
        <p><strong>VGM Weight:</strong> {getValue(data.vgm_weight)} kg</p>
      </section>

      <div className="mt-8">
        <p className="text-center font-semibold">Driver Signature: ___________________________</p>
      </div>
    </div>
  );
};

export default EquipmentInterchangeReceipt;