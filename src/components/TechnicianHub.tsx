import React, { useState } from "react";
import { 
  Users, DollarSign, TrendingUp, CheckCircle, Search, 
  MapPin, Clock, Hammer, ClipboardList, CheckSquare, RefreshCw, Eye
} from "lucide-react";
import { Appointment, PenangArea, ServiceType } from "../types";
import { SERVICE_TYPES, PENANG_AREAS, calculateEstimatedPrice } from "../data";

interface TechnicianHubProps {
  appointments: Appointment[];
  onUpdateStatus: (id: string, updates: Partial<Appointment>) => void;
}

export default function TechnicianHub({ appointments, onUpdateStatus }: TechnicianHubProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterZone, setFilterZone] = useState<string>("all");
  const [assigningApptId, setAssigningApptId] = useState<string | null>(null);
  
  // Checklist tracker simulation
  const [activeChecklistApptId, setActiveChecklistApptId] = useState<string | null>(null);
  const [customChecksteps, setCustomChecksteps] = useState<Record<string, Record<string, boolean>>>({});

  // 1. Diagnostics summaries
  const totalJobs = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length; // wait, let's use .filter().length
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const totalRevenue = appointments
    .filter((a) => a.status === "completed")
    .reduce((sum, current) => sum + current.estimatePrice, 0);
  const projectedRevenue = appointments
    .filter((a) => a.status !== "cancelled" && a.status !== "completed")
    .reduce((sum, current) => sum + current.estimatePrice, 0);

  // Group island and mainland counts
  const islandBookingsCount = appointments.filter((a) => {
    const areaInfo = PENANG_AREAS.find((area) => area.value === a.clientArea);
    return areaInfo?.zone === "Island";
  }).length;
  const mainlandBookingsCount = appointments.filter((a) => {
    const areaInfo = PENANG_AREAS.find((area) => area.value === a.clientArea);
    return areaInfo?.zone === "Mainland";
  }).length;

  // Filter lists
  const filteredAppointments = appointments.filter((appt) => {
    const statusMatch = filterStatus === "all" || appt.status === filterStatus;
    
    const areaInfo = PENANG_AREAS.find((area) => area.value === appt.clientArea);
    const zMatch =
      filterZone === "all" ||
      (filterZone === "island" && areaInfo?.zone === "Island") ||
      (filterZone === "mainland" && areaInfo?.zone === "Mainland");

    return statusMatch && zMatch;
  });

  const handleAssignTechnician = (apptId: string, name: string) => {
    onUpdateStatus(apptId, {
      technicianName: name,
      status: "assigned",
    });
    setAssigningApptId(null);
  };

  const handleStepToggle = (apptId: string, stepId: string) => {
    setCustomChecksteps((prev) => {
      const apptSteps = prev[apptId] || {};
      return {
        ...prev,
        [apptId]: {
          ...apptSteps,
          [stepId]: !apptSteps[stepId],
        },
      };
    });
  };

  const isChecklistCompleted = (apptId: string) => {
    const steps = customChecksteps[apptId] || {};
    return steps["casing"] && steps["coil"] && steps["drain"] && steps["gas"] && steps["temp"];
  };

  const handleFinalizeJobCompletion = (apptId: string) => {
    onUpdateStatus(apptId, {
      status: "completed",
    });
    setActiveChecklistApptId(null);
  };

  const formatServiceLabel = (type: string) => {
    return SERVICE_TYPES[type as keyof typeof SERVICE_TYPES]?.title || type;
  };

  return (
    <div className="space-y-6" id="technician-dispatch-hub">
      {/* Visual Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">SuperCool Penang Dispatch Center</h2>
        <p className="text-xs text-slate-500">
          Admin dashboard to manage customer requests, assign technicians, and track on-site maintenance checklists.
        </p>
      </div>

      {/* Grid of Business Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            📊
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-sans">Active Bookings</p>
            <p className="text-base font-bold text-slate-800">{totalJobs - completedCount} / {totalJobs}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            🌳
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-sans">Settled Revenue</p>
            <p className="text-base font-bold text-slate-800">RM {totalRevenue}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            🚗
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-sans">Queue Revenue</p>
            <p className="text-base font-bold text-slate-800 text-indigo-600">RM {projectedRevenue}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            ⛰️
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-sans">Island / Mainland Ratio</p>
            <p className="text-xs font-bold text-slate-800">{islandBookingsCount} Islands : {mainlandBookingsCount} Mainland</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 items-center">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0">
          🔍 Filter Servicing Jobs:
        </span>
        
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          {/* Status filters */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Request Statuses</option>
            <option value="pending">Pending Dispatch</option>
            <option value="confirmed">Confirmed Appointments</option>
            <option value="assigned">Technicians Dispatched</option>
            <option value="completed">Jobs Completed</option>
            <option value="cancelled">Cancelled Slots</option>
          </select>

          {/* Regional Group Filters */}
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Penang Regions</option>
            <option value="island">🏝️ Penang Island Only</option>
            <option value="mainland">🌉 Seberang Perai / Mainland</option>
          </select>
        </div>
      </div>

      {/* List of Incoming Service requests */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-250 p-8 text-center">
          <p className="text-xs text-slate-500">No aircon appointments match your filter selection.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => {
            const steps = customChecksteps[appt.id] || {};
            const areaInfo = PENANG_AREAS.find((a) => a.value === appt.clientArea);
            const isIsland = areaInfo?.zone === "Island";

            return (
              <div
                key={appt.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 overflow-hidden shadow-sm flex flex-col divide-y divide-slate-100"
              >
                {/* Job ticket header */}
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/55 text-xs">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold block uppercase">
                      JOB NO: #{appt.id.toUpperCase().slice(-6)}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm mt-0.5">
                      {appt.clientName} ({appt.clientPhone})
                    </h4>
                  </div>
                  
                  <div className="flex gap-2.5 items-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isIsland ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {isIsland ? "🏝️ Island" : "🌉 Mainland"} ({appt.clientArea})
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full font-semibold ${
                        appt.status === "completed"
                          ? "bg-emerald-100 text-emerald-850"
                          : appt.status === "cancelled"
                          ? "bg-rose-100 text-rose-850"
                          : appt.status === "assigned"
                          ? "bg-indigo-100 text-indigo-850"
                          : "bg-amber-100 text-amber-850"
                      }`}
                    >
                      {appt.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Job Info Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
                  <div className="space-y-1.5">
                    <strong className="text-slate-800 block text-xs">🛠️ Service Specifications:</strong>
                    <p className="font-medium text-slate-850 leading-relaxed text-xs">
                      {formatServiceLabel(appt.serviceType)} x {appt.unitsCount} Units
                    </p>
                    <p className="text-[11px] text-slate-500 font-sans">
                      {appt.acBrand} ({appt.acHorsepower} {appt.acType})
                    </p>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Estimated Fee: <strong className="text-blue-600 font-semibold">RM {appt.estimatePrice}.00</strong>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <strong className="text-slate-800 block text-xs">📍 Location Details:</strong>
                    <p className="text-[11px] text-slate-600 break-words leading-relaxed font-sans mt-0.5">
                      {appt.clientAddress}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 font-sans">
                      <Clock size={12} />
                      <span>{appt.serviceDate} ({appt.serviceTimeSlot.toUpperCase()})</span>
                    </div>
                  </div>

                  {/* Actions / Dispatch controls */}
                  <div className="flex flex-col justify-between space-y-3 shrink-0">
                    <div className="text-right">
                      {appt.technicianName ? (
                        <p className="font-semibold text-slate-800 flex items-center justify-end gap-1 font-sans text-xs">
                          🚘 Dispatched: <em className="text-indigo-600 font-bold not-italic">{appt.technicianName}</em>
                        </p>
                      ) : (
                        <p className="text-amber-600 italic text-[11px] font-sans font-medium">⚠️ No technician assigned yet.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                      {appt.status === "pending" && (
                        <button
                          onClick={() => onUpdateStatus(appt.id, { status: "confirmed" })}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                        >
                          Confirm Booking
                        </button>
                      )}

                      {appt.status === "confirmed" && (
                        <div className="relative">
                          {assigningApptId === appt.id ? (
                            <div className="absolute right-0 bottom-full mb-1 bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg z-20 flex flex-col gap-1.5 min-w-[150px]">
                              <p className="text-[10px] font-bold text-slate-500 uppercase pb-1 border-b border-slate-100 font-sans">Choose Crew:</p>
                              {["Anwar", "Muthu", "Uncle Hock"].map((name) => (
                                <button
                                  key={name}
                                  onClick={() => handleAssignTechnician(appt.id, name)}
                                  className="text-left text-xs font-semibold px-2 py-1 hover:bg-blue-50 text-slate-700 rounded transition-colors block"
                                >
                                  👨🏽‍🔧 {name}
                                </button>
                              ))}
                              <button
                                onClick={() => setAssigningApptId(null)}
                                className="text-[10px] text-rose-600 hover:underline mt-1 text-center font-bold"
                              >
                                Close
                              </button>
                            </div>
                          ) : null}
                          <button
                            onClick={() => setAssigningApptId(appt.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                          >
                            Assign Technician
                          </button>
                        </div>
                      )}

                      {appt.status === "assigned" && (
                        <button
                          onClick={() => setActiveChecklistApptId(appt.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
                        >
                          <ClipboardList size={11} /> Open Site Checklist
                        </button>
                      )}

                      {appt.status !== "completed" && appt.status !== "cancelled" && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel this booking?")) {
                              onUpdateStatus(appt.id, { status: "cancelled" });
                            }
                          }}
                          className="text-rose-600 hover:text-rose-805 text-[10px] font-bold px-2 py-1.5 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulated Technician Checklist Modal Frame */}
                {activeChecklistApptId === appt.id && (
                  <div className="p-4 bg-slate-50/80 border-t border-slate-150 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2 text-slate-800">
                        <ClipboardList size={16} className="text-emerald-600" />
                        <span className="font-bold text-xs sm:text-sm">On-Site Servicing Checklist - {appt.technicianName}</span>
                      </div>
                      <button
                        onClick={() => setActiveChecklistApptId(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕ Close Checklist
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                      SuperCool Penang technicians are required to complete all checks on-site before accepting signoff. Check off the completed steps:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2" id="maintenance-checklist">
                      {[
                        { id: "casing", label: "Dismantled cover casing & thoroughly washed filter meshes", desc: "Covers removed and water spray cleaned." },
                        { id: "coil", label: "Sprayed chemical cleaner and pressure vacuum washed metal foil coils", desc: "Deep wash avoiding electrical board." },
                        { id: "drain", label: "Flushed drainage pipe to ensure zero residue / unblocked flow", desc: "No water drips/clogs guaranteed." },
                        { id: "gas", label: "Inspected refrigerant gas pressure levels (PSI) in exterior condenser", desc: "Ensures leak-free system." },
                        { id: "temp", label: "Performed 10-minute operation test (temperature checks < 16°C)", desc: "Confirms cold air flow." },
                      ].map((step) => (
                        <label
                          key={step.id}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                            steps[step.id] ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-150"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!steps[step.id]}
                            onChange={() => handleStepToggle(appt.id, step.id)}
                            className="mt-1 accent-emerald-600 h-4 w-4 shrink-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800">{step.label}</span>
                            <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">{step.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          // Pre-fill all steps for fast testing
                          setCustomChecksteps((prev) => ({
                            ...prev,
                            [appt.id]: { casing: true, coil: true, drain: true, gas: true, temp: true },
                          }));
                        }}
                        className="text-slate-500 hover:text-slate-800 font-semibold text-[10px] font-sans px-3 py-1 bg-white border border-slate-200 rounded-lg"
                      >
                        ⚡ Fast Complete Checklist (Demo)
                      </button>

                      <button
                        onClick={() => handleFinalizeJobCompletion(appt.id)}
                        disabled={!isChecklistCompleted(appt.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-md"
                      >
                        ✓ Submit & Finalize Job
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
