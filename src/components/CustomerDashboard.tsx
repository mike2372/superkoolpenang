import React, { useState } from "react";
import { 
  Clock, CheckCircle, AlertTriangle, Printer, PhoneCall, Trash2, 
  MapPin, Star, User, ShieldCheck, HelpCircle, Receipt, ExternalLink 
} from "lucide-react";
import { Appointment } from "../types";
import { SERVICE_TYPES, PENANG_AREAS, MAINSTREAM_TECHNICIANS } from "../data";

interface CustomerDashboardProps {
  appointments: Appointment[];
  onCancelAppointment: (id: string) => void;
  onAddAppointmentClick: () => void;
}

export default function CustomerDashboard({
  appointments,
  onCancelAppointment,
  onAddAppointmentClick,
}: CustomerDashboardProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Appointment | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<Record<string, number>>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, boolean>>({});

  const formatServiceLabel = (type: string) => {
    return SERVICE_TYPES[type as keyof typeof SERVICE_TYPES]?.title || type;
  };

  const statusTags = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            Submitted (Pending Dispatched)
          </span>
        );
      case "confirmed":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Booking Confirmed
          </span>
        );
      case "assigned":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            Technician Assigned
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Completed & Checked
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getMatchedTechnician = (name?: string) => {
    if (!name) return null;
    return MAINSTREAM_TECHNICIANS.find((t) => t.name === name) || {
      name,
      rating: 4.9,
      completed: 120,
      specialties: ["General servicing", "Leakage Fixes"],
    };
  };

  const handleRatingSubmit = (apptId: string) => {
    setFeedbackSubmitted((p) => ({ ...p, [apptId]: true }));
  };

  return (
    <div className="space-y-6" id="customer-dashboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My SuperCool Penang Bookings</h2>
          <p className="text-xs text-slate-500">Track, manage, and inspect your residential aircon services in Penang.</p>
        </div>
        <button
          onClick={onAddAppointmentClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          id="add-appointment-btn"
        >
          ➕ Book New Service
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-lg">
            🏢
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-800">No Services Scheduled Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Stay ahead of Penang's humid heat! Check symptoms with Uncle Hock or click the button above to book a repair or wash.
            </p>
          </div>
          <button
            onClick={onAddAppointmentClick}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Create Appointment Slot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of booked appointments of users */}
          <div className="lg:col-span-2 space-y-4">
            {appointments.map((appt) => {
              const tech = getMatchedTechnician(appt.technicianName);
              const ratingVal = feedbackRating[appt.id] || 5;

              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow divide-y divide-slate-100"
                >
                  {/* Card Section Header */}
                  <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block tracking-widest uppercase">
                        APPOINTMENT CODE: #{appt.id.toUpperCase().slice(-6)}
                      </span>
                      <h4 className="text-sm font-bold text-slate-850 mt-0.5">
                        {formatServiceLabel(appt.serviceType)} x {appt.unitsCount} Unit(s)
                      </h4>
                    </div>
                    <div>{statusTags(appt.status)}</div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-650">
                        <Clock size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {appt.serviceDate} at{" "}
                          {appt.serviceTimeSlot === "morning"
                            ? "Morning (9am - 12pm)"
                            : appt.serviceTimeSlot === "afternoon"
                            ? "Afternoon (1pm - 4pm)"
                            : "Late Afternoon (4pm - 7pm)"}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-slate-650">
                        <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-slate-700 leading-relaxed font-sans font-medium">
                          {appt.clientAddress},{" "}
                          <strong className="text-teal-600 font-bold">{appt.clientArea}</strong>
                        </span>
                      </div>

                      <div className="text-[11px] font-sans text-slate-500 bg-slate-100/50 px-2.5 py-1.5 rounded-lg border border-slate-150 flex items-center justify-between">
                        <span>Brand & specs:</span>
                        <strong className="text-slate-700 font-semibold">
                          {appt.acBrand} ({appt.acHorsepower} {appt.acType})
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-3 shrink-0 flex flex-col justify-between">
                      <div className="flex justify-between items-center bg-blue-50/40 p-2.5 rounded-xl border border-blue-100">
                        <span className="text-xs text-slate-600 font-sans">Estimated Cost:</span>
                        <span className="text-sm font-bold text-blue-700">RM {appt.estimatePrice}.00</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1.5 md:justify-end">
                        <button
                          onClick={() => setSelectedInvoice(appt)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Receipt size={12} /> Invoice PDF
                        </button>

                        {appt.status !== "cancelled" && appt.status !== "completed" && (
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this appointment-lah?")) {
                                onCancelAppointment(appt.id);
                              }
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors border border-rose-150"
                          >
                            <Trash2 size={12} /> Cancel Service
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Technician status details */}
                  {appt.status === "assigned" && tech && (
                    <div className="p-4 bg-indigo-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 border-2 border-white rounded-full flex items-center justify-center font-bold text-sm text-slate-800 shadow-sm overflow-hidden">
                          {tech.name === "Anwar" ? "🧔🏾" : tech.name === "Muthu" ? "👨🏽" : "👴🏻"}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            Technician Dispatch: {tech.name}
                            <span className="text-[10px] font-normal text-slate-500 flex items-center ml-1">
                              <Star size={11} className="fill-amber-400 text-amber-400 mr-0.5" />
                              {tech.rating}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                            Specializes in {tech.specialties.join(", ")}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => alert(`Simulated Dial Call: Calling ${tech.name} at +6013-4428801. He is loading the tools now!`)}
                        className="flex items-center gap-1 bg-white hover:bg-slate-150 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95"
                      >
                        <PhoneCall size={12} /> Contact {tech.name}
                      </button>
                    </div>
                  )}

                  {/* Completed Booking Rating Mechanism */}
                  {appt.status === "completed" && (
                    <div className="p-4 bg-emerald-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">Service Rated SuperCool?</p>
                        <p className="text-[10px] text-slate-500 font-sans">Help Uncle Hock improve our customer support standard in Penang!</p>
                      </div>

                      {feedbackSubmitted[appt.id] ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                          ⭐ Thank you for rating {ratingVal} stars!
                        </span>
                      ) : (
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackRating((p) => ({ ...p, [appt.id]: star }))}
                                className="focus:outline-none transition-transform active:scale-125"
                              >
                                <Star
                                  size={16}
                                  className={`${
                                    star <= ratingVal
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => handleRatingSubmit(appt.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Submit Rating
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Info Column - Penang aircon support */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-5 rounded-2xl shadow-md border border-blue-600/50 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-xl">🛡️</div>
                  <h4 className="text-sm font-bold tracking-tight">SuperCool Penang Assurance</h4>
                </div>

                <ul className="text-xs space-y-2.5 text-blue-100 font-sans leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-300 font-bold text-sm leading-none">✓</span>
                    <span><strong>90-Day Workmanship Warranty</strong> against leakage, parts failures, or blinking errors.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-300 font-bold text-sm leading-none">✓</span>
                    <span><strong>Local Trained Mechanics</strong> verified with police checks. No third-party foreign agents.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-300 font-bold text-sm leading-none">✓</span>
                    <span><strong>Clean job promise</strong>. We vacuum and clean floor after chemical overhaul. No messy water stains!</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => alert("SuperCool Penang emergency hotline: +604-2287755 (Georgetown division). Active daily 8 AM - 9 PM.")}
                  className="w-full text-center bg-white text-blue-800 font-bold text-xs py-2 rounded-xl border border-transparent shadow hover:bg-blue-50 transition-colors"
                >
                  📞 Emergency Aircon Call
                </button>
              </div>
            </div>

            {/* Weather Tip Indicator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                📍 Penang Aircon Maintenance Guide
              </h4>
              <div className="space-y-2.5 text-xs leading-relaxed font-sans text-slate-600">
                <p>
                  Because Penang island is heavily subjected to <strong>saltwater marine breeze</strong> (especially Batu Ferringhi, Tanjung Bungah, and Gurney), outdoor condenser coils corrode and leak gas three times faster than inland cities.
                </p>
                <div className="p-2.5 bg-amber-50 rounded-lg text-[11px] text-amber-850 border border-amber-200">
                  <strong>Uncle Hock's Advice:</strong> Apply protective anti-rust coil coatings during your bi-annual normal chemical servicing to keep your inverter condenser running below 48°C peak load!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL POPUP */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden text-xs text-slate-800 animate-slideUp">
            {/* Invoice Top */}
            <div className="bg-slate-900 text-slate-100 p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold tracking-tight">TAX INVOICE (EST)</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">No: SC-{selectedInvoice.id.toUpperCase().slice(-8)}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white font-bold p-1 bg-white/5 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Invoice Meta */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-800">SuperCool Penang</h4>
                  <p className="text-[10px] text-slate-500 font-sans">12B, Jalan Burma, George Town</p>
                  <p className="text-[10px] text-slate-500 font-sans">10050 Penang, Malaysia</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Date Issued:</p>
                  <p className="font-semibold text-slate-700">{selectedInvoice.createdAt.split("T")[0]}</p>
                </div>
              </div>

              {/* Bill To */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">BILL TO CLIENT:</span>
                <p className="font-bold text-slate-850 mt-1">{selectedInvoice.clientName}</p>
                <p className="text-slate-600 font-sans">{selectedInvoice.clientAddress}, {selectedInvoice.clientArea}</p>
                <p className="text-slate-600 font-sans">Phone: {selectedInvoice.clientPhone}</p>
              </div>

              {/* Items Table */}
              <div className="border border-slate-150 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                      <th className="p-2.5">Service Details</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right font-sans">Ammount (RM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5">
                        <strong className="block text-slate-800">{formatServiceLabel(selectedInvoice.serviceType)}</strong>
                        <span className="text-[10px] text-slate-500">
                          {selectedInvoice.acBrand} - {selectedInvoice.acHorsepower} ({selectedInvoice.acType})
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-semibold">{selectedInvoice.unitsCount}</td>
                      <td className="p-2.5 text-right font-semibold">RM {selectedInvoice.estimatePrice}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Invoice Note */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[10px] font-sans">
                <span className="font-semibold text-slate-700 block">Dispatch Term:</span>
                Kindly make sure parking is ready for our SuperCool Penang standard technical van at {selectedInvoice.clientArea}. Payment can be settled via Cash or DuitNow QR upon job signoff.
              </div>

              {/* Receipt Total */}
              <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                <span className="font-sans font-bold text-slate-700 text-sm">TOTAL AMOUNT DUE:</span>
                <span className="text-lg font-extrabold text-blue-700 font-sans">RM {selectedInvoice.estimatePrice}.00</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex gap-2 justify-end">
              <button
                onClick={() => alert("Simulating document generation: Printing Invoice / Estimate SC-" + selectedInvoice.id.slice(-6) + " to aircon-report.pdf Completed!")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-1"
              >
                <Printer size={13} /> Print/Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
