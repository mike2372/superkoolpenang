import React, { useState, useEffect } from "react";
import { 
  Wrench, User, Calendar, CheckSquare, ChevronRight, ChevronLeft, 
  Settings, Percent, DollarSign, Building, Phone, Mail, MapPin, Sparkles
} from "lucide-react";
import { PenangArea, ServiceType, AcType, AcHorsepower, Appointment } from "../types";
import { PENANG_AREAS, SERVICE_TYPES, POPULAR_BRANDS, calculateEstimatedPrice } from "../data";

interface BookingFormProps {
  userId: string;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

export default function BookingForm({ userId, onSubmit, onCancel }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>("normal_cleaning");
  const [unitsCount, setUnitsCount] = useState<number>(1);
  const [acType, setAcType] = useState<AcType>("wall_mounted");
  const [acBrand, setAcBrand] = useState<string>("Daikin");
  const [acHorsepower, setAcHorsepower] = useState<AcHorsepower>("1.0 HP");

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientArea, setClientArea] = useState<PenangArea>("Georgetown");
  const [clientAddress, setClientAddress] = useState("");

  // Timing info
  const [serviceDate, setServiceDate] = useState("");
  const [serviceTimeSlot, setServiceTimeSlot] = useState<"morning" | "afternoon" | "late_afternoon">("morning");
  const [userNotes, setUserNotes] = useState("");

  // Estimation state
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // Set min date to today's date for Penang residential appointment scheduling
  const [minDateString, setMinDateString] = useState("");

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setMinDateString(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    const calculated = calculateEstimatedPrice(serviceType, unitsCount, acHorsepower);
    setEstimatedPrice(calculated);
  }, [serviceType, unitsCount, acHorsepower]);

  const validateStep = () => {
    switch (step) {
      case 1:
        return unitsCount >= 1 && unitsCount <= 50;
      case 2:
        return (
          clientName.trim().length >= 3 &&
          clientPhone.trim().length >= 9 &&
          clientEmail.trim().includes("@") &&
          clientAddress.trim().length >= 10
        );
      case 3:
        return serviceDate !== "";
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setStep((p) => p + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((p) => p - 1);
  };

  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    const newBooking = {
      serviceType,
      unitsCount,
      acType,
      acBrand,
      acHorsepower,
      clientName,
      clientPhone,
      clientEmail,
      clientArea,
      clientAddress,
      serviceDate,
      serviceTimeSlot,
      userNotes,
      estimatePrice: estimatedPrice,
    };
    onSubmit(newBooking);
  };

  const currentServiceInfo = SERVICE_TYPES[serviceType];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-150 overflow-hidden" id="booking-wizard">
      {/* Wizard Progress Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[
            { num: 1, label: "Services", desc: "Select options" },
            { num: 2, label: "Location", desc: "Penang Area" },
            { num: 3, label: "Schedule", desc: "Select time" },
            { num: 4, label: "Review", desc: "Final check" },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center flex-1 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 transition-all duration-300 ${
                  step === s.num
                    ? "bg-blue-600 text-white ring-blue-100"
                    : step > s.num
                    ? "bg-emerald-500 text-white ring-emerald-50"
                    : "bg-slate-200 text-slate-500 ring-transparent"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className="text-[10px] font-medium text-slate-600 mt-1">{s.label}</span>

              {s.num < 4 && (
                <div
                  className={`absolute top-4 left-[60%] right-[-40%] h-0.5 -translate-y-1/2 z-0 ${
                    step > s.num ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleFormSubmission} className="space-y-6">
          {/* STEP 1: SERVICE TYPE & AIRCON DETAILS */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg"><Wrench size={16} /></span>
                  What aircon service do you need today?
                </h3>
                <p className="text-xs text-slate-500 mt-1">Transparent flat rates for home/shop lots in Penang.</p>
              </div>

              {/* Service Type Selection Block Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="service-types-grid">
                {Object.entries(SERVICE_TYPES).map(([typeKey, val]) => (
                  <label
                    key={typeKey}
                    className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50/50 ${
                      serviceType === typeKey
                        ? "border-blue-600 bg-blue-50/35 shadow-sm"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1">
                        <input
                          type="radio"
                          name="serviceType"
                          value={typeKey}
                          checked={serviceType === typeKey}
                          onChange={() => setServiceType(typeKey as ServiceType)}
                          className="mr-1.5 accent-blue-600 h-4 w-4"
                        />
                        {val.title}
                      </div>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                        From RM {val.basePrice}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-sans mt-2 grow leading-relaxed">{val.description}</p>
                  </label>
                ))}
              </div>

              {/* Specific Aircon details */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase font-sans">Air Conditioning Specifications:</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Brand Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Aircon Brand:</label>
                    <select
                      value={acBrand}
                      onChange={(e) => setAcBrand(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    >
                      {POPULAR_BRANDS.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Horsepower selects */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Horsepower (HP):</label>
                    <select
                      value={acHorsepower}
                      onChange={(e) => setAcHorsepower(e.target.value as AcHorsepower)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    >
                      <option value="1.0 HP">1.0 HP (Standard Bedroom)</option>
                      <option value="1.5 HP">1.5 HP (Large Bedroom / Living Room)</option>
                      <option value="2.0 HP">2.0 HP (Medium Living Hall)</option>
                      <option value="2.5 HP or above">2.5 HP or above (Commercial/Large Hall)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* AC Style */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Placement / Type:</label>
                    <div className="flex gap-2">
                      {[
                        { val: "wall_mounted", label: "Wall" },
                        { val: "cassette", label: "Cassette" },
                        { val: "ceiling_exposed", label: "Ceiling" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setAcType(item.val as AcType)}
                          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                            acType === item.val
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Units Input Count */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Number of Aircon Units: <span className="text-blue-600 font-bold ml-1">{unitsCount} unit(s)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setUnitsCount((c) => Math.max(1, c - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-250 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={unitsCount}
                        onChange={(e) => setUnitsCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 text-center text-xs font-semibold text-slate-800 border-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setUnitsCount((c) => Math.min(50, c + 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-250 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT & PENANG LOCAL AREA */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg"><Building size={16} /></span>
                  Where in Penang should we send our servicing van?
                </h3>
                <p className="text-xs text-slate-500 mt-1">We service both Penang Island & Seberang Perai regions.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contact Name:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Tan Ah Kow"
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* HP Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Malaysian Phone Number:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone size={14} />
                    </span>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="e.g., +6012-3456789"
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail size={14} />
                    </span>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. ahkow@gmail.com"
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Local Area Group Selected */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Penang Region / Area:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin size={14} />
                    </span>
                    <select
                      value={clientArea}
                      onChange={(e) => setClientArea(e.target.value as PenangArea)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    >
                      <optgroup label="🏝️ Penang Island Area">
                        {PENANG_AREAS.filter((a) => a.zone === "Island").map((a) => (
                          <option key={a.value} value={a.value}>
                            {a.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🌉 Seberang Perai / Mainland Area">
                        {PENANG_AREAS.filter((a) => a.zone === "Mainland").map((a) => (
                          <option key={a.value} value={a.value}>
                            {a.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              {/* Detailed Road/Home Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Servicing Address:</label>
                <textarea
                  required
                  rows={3}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="e.g., No. 28, Lorong Gurney 3, Gurney Heights Condominium, Block A Unit 12-B"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800 resize-none font-sans"
                />
                <p className="text-[10px] text-slate-400 mt-1">Please provide the complete street, apartment unit, or shop floor level.</p>
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE DETAILS */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg"><Calendar size={16} /></span>
                  When is your preferred aircon service slot?
                </h3>
                <p className="text-xs text-slate-500 mt-1">Select dates (Monday - Sunday are available; public holiday bookings include no surcharge!).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Calendar Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Preferred Appointment Date:</label>
                  <input
                    type="date"
                    required
                    min={minDateString}
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                  <div className="mt-3 bg-blue-50/50 rounded-lg border border-blue-100 p-3">
                    <p className="text-[10px] text-blue-800 font-sans leading-relaxed flex items-center gap-1">
                      <Sparkles size={11} className="text-blue-600" />
                      Tip: Booking on weekdays typically gives 15% better technician availability!
                    </p>
                  </div>
                </div>

                {/* Timeslots choices */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Preferred Time Window:</label>
                  <div className="space-y-2.5">
                    {[
                      { val: "morning", label: "🌅 Morning Slot (09:00 AM - 12:00 PM)", desc: "Cooler temperature, great start." },
                      { val: "afternoon", label: "☀️ Afternoon Slot (01:00 PM - 04:00 PM)", desc: "Midday maintenance focus." },
                      { val: "late_afternoon", label: "🌇 Late Afternoon Slot (04:00 PM - 07:00 PM)", desc: "Late checkups, convenient after-work." },
                    ].map((slot) => (
                      <label
                        key={slot.val}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          serviceTimeSlot === slot.val
                            ? "border-blue-600 bg-blue-50/20"
                            : "border-slate-150 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="timeSlot"
                          checked={serviceTimeSlot === slot.val}
                          onChange={() => setServiceTimeSlot(slot.val as any)}
                          className="mt-0.5 accent-blue-600 h-4 w-4"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{slot.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">{slot.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional diagnostics note details */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Additional Notes / Symptoms <span className="text-slate-400 font-normal">(Optional):</span>
                </label>
                <textarea
                  rows={2}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="e.g., Water dripping slowly from bottom right, or remote control occasionally showing error code E5..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-800 resize-none font-sans"
                />
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PRICING RECEIPT MOCKUP */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="p-1.5 bg-green-100 text-green-700 rounded-lg"><CheckSquare size={16} /></span>
                  Review Your Appointment & Estimate details
                </h3>
                <p className="text-xs text-slate-500 mt-1">Please double check your contact and details before confirming with Uncle Hock's team.</p>
              </div>

              {/* Quotation Slip Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-3.5 flex justify-between items-center">
                  <span className="text-xs font-mono tracking-widest uppercase">Service Estimate Summary</span>
                  <span className="text-[10px] font-sans text-slate-300">SuperCool Penang Co.</span>
                </div>

                <div className="p-4 space-y-4 bg-white text-xs text-slate-800">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-b border-slate-100 pb-3 font-sans">
                    <span className="text-slate-500">Service:</span>
                    <span className="font-semibold text-right text-slate-800">{currentServiceInfo?.title}</span>

                    <span className="text-slate-500">Units / Horsepower:</span>
                    <span className="font-semibold text-right text-slate-800">
                      {unitsCount} Unit(s) ({acHorsepower} - {acBrand})
                    </span>

                    <span className="text-slate-500">Scheduled:</span>
                    <span className="font-semibold text-right text-slate-800 text-blue-600">
                      {serviceDate} (
                      {serviceTimeSlot === "morning"
                        ? "Morning"
                        : serviceTimeSlot === "afternoon"
                        ? "Afternoon"
                        : "Late Afternoon"}
                      )
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-b border-slate-100 pb-3 font-sans">
                    <span className="text-slate-500">Client:</span>
                    <span className="font-semibold text-right text-slate-800">{clientName}</span>

                    <span className="text-slate-500">Phone:</span>
                    <span className="font-semibold text-right text-slate-800">{clientPhone}</span>

                    <span className="text-slate-500">Address / Location:</span>
                    <span className="font-semibold text-right text-slate-800 break-words max-w-[200px]">
                      {clientAddress}, <em className="text-teal-600 font-bold not-italic">{clientArea}</em>
                    </span>
                  </div>

                  {userNotes && (
                    <div className="bg-slate-50 p-2 rounded-lg text-[11px] font-sans border border-slate-100">
                      <span className="font-semibold text-slate-500 block mb-0.5">Your Diagnosis Note:</span>
                      <p className="text-slate-600 italic">"{userNotes}"</p>
                    </div>
                  )}

                  {/* Calculations breakdown */}
                  <div className="space-y-1 bg-blue-50/40 p-3 rounded-lg border border-blue-100">
                    <div className="flex justify-between font-sans text-[11px] text-slate-600">
                      <span>Base Service Fee ({unitsCount} x RM{currentServiceInfo?.basePrice}):</span>
                      <span>RM {unitsCount * currentServiceInfo?.basePrice}.00</span>
                    </div>

                    {acHorsepower !== "1.0 HP" && (
                      <div className="flex justify-between font-sans text-[11px] text-slate-600">
                        <span>HP Power Surcharge ({acHorsepower}):</span>
                        <span className="text-slate-700 font-medium">+ Surcharge Applied</span>
                      </div>
                    )}

                    {unitsCount >= 2 && (
                      <div className="flex justify-between font-sans text-[11px] text-emerald-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Percent size={11} /> Bulk Booking Discount:
                        </span>
                        <span>- Saved RM {Math.round(unitsCount * currentServiceInfo?.basePrice * (unitsCount >= 5 ? 0.15 : unitsCount >= 3 ? 0.1 : 0.05))}.00</span>
                      </div>
                    )}

                    <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-150 pt-2 mt-1.5 font-sans">
                      <span className="flex items-center gap-1 text-slate-800">
                        <DollarSign size={16} className="text-blue-600" /> Guaranteed Estimate:
                      </span>
                      <span className="text-blue-700">RM {estimatedPrice}.00</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center font-sans pt-1">
                      No surprise surcharges. Payment is made locally *after* completing service. Price includes parts testing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Nav */}
          <div className="flex justify-between border-t border-slate-100 pt-5 mt-2">
            {step === 1 ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                id="booking-cancel-btn"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                id="booking-back-btn"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!validateStep()}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                id="booking-next-btn"
              >
                Next Step <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                id="booking-confirm-btn"
              >
                ✓ Secure Booking Now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
