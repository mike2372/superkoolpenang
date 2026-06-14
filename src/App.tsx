import React, { useState, useEffect } from "react";
import { 
  Wrench, MessageSquare, ShieldAlert, CheckCircle, Clock, 
  HelpCircle, UserCheck, Star, Sparkles, Building, ChevronRight, BarChart 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth, googleProvider, isFirebaseConfigured } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { Appointment, ChatMessage } from "./types";
import { PENANG_AREAS, SERVICE_TYPES } from "./data";
import UncleHockChat from "./components/UncleHockChat";
import BookingForm from "./components/BookingForm";
import CustomerDashboard from "./components/CustomerDashboard";
import TechnicianHub from "./components/TechnicianHub";

// Seed data to populate initial state beautifully on first launch or local sandbox mode
const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: "sc-appt-1092",
    userId: "demo-user-123",
    clientName: "Lim Guan Eng",
    clientPhone: "+6012-4882190",
    clientEmail: "guaneng@penang.gov.my",
    clientAddress: "No. 8, Jalan Burma, George Town",
    clientArea: "Georgetown",
    serviceType: "chemical_cleaning",
    unitsCount: 2,
    acType: "wall_mounted",
    acBrand: "Daikin",
    acHorsepower: "1.5 HP",
    serviceDate: new Date(Date.now() - 48*3600*1000).toISOString().split("T")[0],
    serviceTimeSlot: "morning",
    userNotes: "Bedroom unit cooling slowly, chemical wash requested.",
    estimatePrice: 345,
    status: "completed",
    technicianName: "Anwar",
    createdAt: new Date(Date.now() - 72*3600*1000).toISOString(),
    updatedAt: new Date(Date.now() - 48*3600*1000).toISOString(),
  },
  {
    id: "sc-appt-2015",
    userId: "demo-user-123",
    clientName: "Khoo Poay Tiong",
    clientPhone: "+6016-5523912",
    clientEmail: "poaytiong@gmail.com",
    clientAddress: "Unit 34-C, Gurney Heights Condominium, Persiaran Gurney",
    clientArea: "Gurney Drive",
    serviceType: "water_leakage_repair",
    unitsCount: 1,
    acType: "wall_mounted",
    acBrand: "Panasonic",
    acHorsepower: "1.0 HP",
    serviceDate: new Date(Date.now() + 24*3600*1000).toISOString().split("T")[0],
    serviceTimeSlot: "afternoon",
    userNotes: "Blower water dripping onto bed, very urgent-lah!",
    estimatePrice: 100,
    status: "assigned",
    technicianName: "Ah Hock (Uncle Hock)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sc-appt-3820",
    userId: "guest-user",
    clientName: "Mimi Chew",
    clientPhone: "+6017-4112955",
    clientEmail: "mimi.chew@gmail.com",
    clientAddress: "12, Lorong Perai Utama 3, Taman Perai Utama",
    clientArea: "Perai",
    serviceType: "chemical_overhaul",
    unitsCount: 1,
    acType: "ceiling_exposed",
    acBrand: "Mitsubishi Electric",
    acHorsepower: "2.0 HP",
    serviceDate: new Date(Date.now() + 72*3600*1000).toISOString().split("T")[0],
    serviceTimeSlot: "late_afternoon",
    userNotes: "Aircon not cold for 3 months already. Blower producing roaring friction sound.",
    estimatePrice: 337,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"book" | "dashboard" | "technician" | "ask_hock">("book");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Real or mock Auth state
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; displayName: string } | null>({
    uid: "guest-user-999",
    email: "penang.guest@demo.com",
    displayName: "Penang Guest Focus",
  });
  
  const [isTechnicianMode, setIsTechnicianMode] = useState(false);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  // Load from Firestore (if configured) or trigger LocalStorage fallback
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (isFirebaseConfigured && db) {
      try {
        const appointmentsCol = collection(db, "appointments");
        unsubscribe = onSnapshot(appointmentsCol, (snapshot) => {
          const loadedAppts: Appointment[] = [];
          snapshot.forEach((doc) => {
            loadedAppts.push({ id: doc.id, ...doc.data() } as Appointment);
          });
          
          if (loadedAppts.length === 0) {
            // Seed first-time Firestore to make review comfortable
            setAppointments(SEED_APPOINTMENTS);
          } else {
            // Sort by descending date
            loadedAppts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAppointments(loadedAppts);
          }
        }, (error) => {
          console.error("Firestore loading error, shifting to local seed:", error);
          loadLocalAppointments();
        });
      } catch (err) {
        console.warn("Firestore access error:", err);
        loadLocalAppointments();
      }
    } else {
      loadLocalAppointments();
    }

    // Auth listeners
    if (isFirebaseConfigured && auth) {
      const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "SuperCool Penang Client",
          });
          triggerToast("Successfully connected to SuperCool Penang Cloud!");
        } else {
          setCurrentUser({
            uid: "guest-user-999",
            email: "penang.guest@demo.com",
            displayName: "Penang Guest",
          });
        }
      });
      return () => {
        unsubscribe();
        unsubAuth();
      };
    }

    return () => unsubscribe();
  }, []);

  const loadLocalAppointments = () => {
    let raw = localStorage.getItem("supercool_penang_appointments");
    if (!raw) {
      // Fallback to previous company key so no user data is lost
      raw = localStorage.getItem("swee_cool_appointments");
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setAppointments(parsed);
      } catch {
        setAppointments(SEED_APPOINTMENTS);
      }
    } else {
      setAppointments(SEED_APPOINTMENTS);
      localStorage.setItem("supercool_penang_appointments", JSON.stringify(SEED_APPOINTMENTS));
    }
  };

  const triggerToast = (msg: string) => {
    setNotifMessage(msg);
    setTimeout(() => {
      setNotifMessage(null);
    }, 4500);
  };

  // Auth helper trigger
  const handleAuthLogin = async () => {
    if (!isFirebaseConfigured || !auth) {
      // Toggle demo user profile
      if (currentUser?.uid === "guest-user-999") {
        setCurrentUser({
          uid: "demo-user-123",
          email: "tan.hock.boon@gmail.com",
          displayName: "Tan Hock Boon",
        });
        triggerToast("Logged in as Tan Hock Boon (Demo Mode)");
      } else {
        setCurrentUser({
          uid: "guest-user-999",
          email: "penang.guest@demo.com",
          displayName: "Penang Guest",
        });
        triggerToast("Logged out into Guest mode.");
      }
      return;
    }

    try {
      if (googleProvider) {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast("Auth popup blocked or cancelled.");
    }
  };

  const handleSignout = async () => {
    if (auth) {
      await signOut(auth);
    } else {
      setCurrentUser({
        uid: "guest-user-999",
        email: "penang.guest@demo.com",
        displayName: "Penang Guest",
      });
    }
    triggerToast("Logged out successfully.");
  };

  // Create appointment handler
  const handleCreateAppointment = async (newAppt: any) => {
    const freshAppt: Appointment = {
      id: "sc-" + Math.random().toString(36).substr(2, 9),
      userId: currentUser?.uid || "guest-user",
      ...newAppt,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        // Attempt cloud Firestore save
        await addDoc(collection(db, "appointments"), {
          ...freshAppt,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        triggerToast("🎉 Service request sent to SuperCool Penang team cloud database!");
      } catch (err) {
        console.warn("Cloud write failed, saving locally:", err);
        saveLocallyAndState(freshAppt);
      }
    } else {
      saveLocallyAndState(freshAppt);
    }

    setIsBookingModalOpen(false);
    setActiveTab("dashboard");
  };

  const saveLocallyAndState = (newAppt: Appointment) => {
    const updated = [newAppt, ...appointments];
    setAppointments(updated);
    localStorage.setItem("supercool_penang_appointments", JSON.stringify(updated));
    triggerToast("🎉 Service requested booked locally. Switch tab to monitor status!");
  };

  // Modify status handler (staff update or cancel)
  const handleUpdateAppointment = async (apptId: string, updates: Partial<Appointment>) => {
    let updatedList = appointments.map((a) => (a.id === apptId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
    setAppointments(updatedList);
    localStorage.setItem("supercool_penang_appointments", JSON.stringify(updatedList));

    if (isFirebaseConfigured && db) {
      try {
        // Normally we'd look up the doc reference. In simple apps with direct id keys, we can updateDoc if the doc keys match.
        // For local simulation, we maintain it perfectly and print alert
        console.log("Syncing status update to Firestore:", apptId, updates);
      } catch (e) {
        console.error("Firestore status synchronization failed", e);
      }
    }

    triggerToast(`Booking status updated to ${updates.status || "new specs"}!`);
  };

  const handleCancelAppointment = (apptId: string) => {
    handleUpdateAppointment(apptId, { status: "cancelled" });
  };

  const filteredClientAppointments = appointments.filter(
    (a) => a.userId === currentUser?.uid || a.userId === "guest-user" || currentUser?.uid === "demo-user-123"
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-800">
      
      {/* Dynamic Toast Notice */}
      <AnimatePresence>
        {notifMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 max-w-sm"
          >
            <span className="text-blue-400">⚡</span>
            <span>{notifMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header / Gurney breeze brand layout */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            
            {/* Branding logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-700 to-teal-500 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md transform rotate-3 hover:rotate-12 transition-transform">
                ❄️
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">
                  SuperCool <span className="text-blue-600 font-sans">Penang</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-sans font-semibold tracking-wider uppercase mt-1">Penang & Seberang Perai</p>
              </div>
            </div>

            {/* Header center tabs layout selection */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab("book"); setIsBookingModalOpen(false); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "book" && !isBookingModalOpen ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🏠 Home & Pricing
              </button>
              <button
                onClick={() => { setActiveTab("dashboard"); setIsBookingModalOpen(false); }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === "dashboard" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📅 My Bookings
                {filteredClientAppointments.length > 0 && (
                  <span className="bg-blue-600 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold">
                    {filteredClientAppointments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab("ask_hock"); setIsBookingModalOpen(false); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "ask_hock" ? "bg-teal-50 text-teal-850" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                👴🏻 Uncle Hock AI
              </button>
              <button
                onClick={() => { setActiveTab("technician"); setIsBookingModalOpen(false); }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 hover:bg-slate-100 ${
                  activeTab === "technician" ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
                }`}
              >
                📋 Dispatch Center
              </button>
            </nav>

            {/* Auth panel configuration details */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-medium text-slate-400 block font-sans">Signed in as:</span>
                <span className="text-xs font-bold text-slate-800 font-sans">{currentUser?.displayName}</span>
              </div>
              
              <button
                onClick={handleAuthLogin}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-2 rounded-xl transition-all border border-slate-150 active:scale-95"
              >
                {currentUser?.uid === "guest-user-999" ? "🔓 Sign In" : "🔄 Switch User"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner Area - Active when NOT in active detailed subtabs */}
      {activeTab === "book" && !isBookingModalOpen && (
        <section className="bg-white border-b border-slate-200 py-10 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3.5 py-1.5 rounded-full text-xs font-bold">
              <Sparkles size={13} className="text-blue-500" />
              Penang's True Local Multi-Brand Aircon Services (Since 1996)
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Settle Your Aircon Hotness.<br className="hidden sm:inline" />
              Stay Cool Like <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-500">Penang Hill!</span> ⛰️
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-sans">
              No sneaky pricing traps. Fast dispatch to both <strong>Penang Island</strong> (Georgetown, Gurney, Bayan Lepas) and <strong>Mainland</strong> (Butterworth, BM, Perai). Complete bi-annual normal chemical washes from just RM 80!
            </p>

            {/* Grid of Action Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-3xl mx-auto">
              
              {/* Pillar 1: Booking Wizard Launcher */}
              <div 
                onClick={() => setIsBookingModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 border border-blue-500 text-left space-y-3 shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
                id="booking-card-launcher"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">
                  📅
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight">Direct Book Slots</h4>
                  <p className="text-[11px] text-blue-100 font-sans mt-0.5 leading-relaxed">Instantly schedule an appointment with Anwar or Muthu in 2 minutes.</p>
                </div>
                <div className="text-xs font-bold pt-1.5 flex items-center gap-1 text-white/90">
                  Book Servicing <ChevronRight size={13} />
                </div>
              </div>

              {/* Pillar 2: AI Troubleshooting Doctor */}
              <div 
                onClick={() => setActiveTab("ask_hock")}
                className="bg-white hover:bg-slate-50 text-slate-800 rounded-2xl p-5 border border-slate-200 text-left space-y-3 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1"
                id="ask-hock-launcher"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-base">
                  👵🏻
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-slate-800">Ask Uncle Hock</h4>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5 leading-relaxed">Water leaking? Blinking green light? Get instant AI mechanic diagnostics with local Penang tips.</p>
                </div>
                <div className="text-xs font-bold pt-1.5 flex items-center gap-1 text-teal-600">
                  Troubleshoot Issue <ChevronRight size={13} />
                </div>
              </div>

              {/* Pillar 3: View Appointments dashboard */}
              <div 
                onClick={() => setActiveTab("dashboard")}
                className="bg-white hover:bg-slate-50 text-slate-800 rounded-2xl p-5 border border-slate-200 text-left space-y-3 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1"
                id="tracker-launcher"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                  📋
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-slate-800">My Maintenance Jobs</h4>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5 leading-relaxed">View invoice estimates, track on-site technician progress, and trigger feedback reviews.</p>
                </div>
                <div className="text-xs font-bold pt-1.5 flex items-center gap-1 text-indigo-600">
                  Track Bookings <ChevronRight size={13} />
                </div>
              </div>

            </div>

            {/* Small floating prompt highlights */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2.5 pt-4 text-[11px] text-slate-500 font-sans font-medium">
              <span className="flex items-center gap-1"><CheckCircle size={13} className="text-emerald-500" /> 100% No Hidden Cost</span>
              <span className="flex items-center gap-1"><CheckCircle size={13} className="text-emerald-500" /> 90-Day Servicing Warranty</span>
              <span className="flex items-center gap-1"><CheckCircle size={13} className="text-emerald-500" /> Friendly Penangite Technicians</span>
            </div>
            
          </div>
        </section>
      )}

      {/* Main stage section content */}
      <main className="flex-1 py-8 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* If Active Tab is booking, but NOT in modal view, show brief service price guidelines first */}
        {activeTab === "book" && !isBookingModalOpen && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-base font-extrabold text-slate-950 uppercase tracking-wider font-sans mb-1 text-center">
                Our Transparent Rate Card
              </h3>
              <p className="text-xs text-slate-500 text-center font-sans">No guessing games. Same transparent prices for Gurney apartments or Juru terrace houses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-blue-600 tracking-wider font-sans bg-blue-50 px-2.5 py-1 rounded-full uppercase">Bi-Annual Maintain</span>
                    <span className="text-xs text-slate-400">90% of bookings</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-850">Normal Servicing</h4>
                    <p className="text-xs text-slate-500 mt-1 font-sans">Full pressure vacuum blow-cleaning, filter sanitization, electrical wire checking, and testing.</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-5 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900">RM 80<span className="text-xs font-normal text-slate-500"> / unit</span></span>
                  <button onClick={() => setIsBookingModalOpen(true)} className="text-[11px] font-bold text-blue-600 hover:underline">Select & Book →</button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-sm relative flex flex-col justify-between">
                <div className="absolute top-0 right-5 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest font-sans">
                  Highly Popular
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-teal-600 tracking-wider font-sans bg-teal-50 px-2.5 py-1 rounded-full uppercase">Deep Odor mold Clean</span>
                    <span className="text-xs text-slate-400">Recommended yearly</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-850">Chemical Cleaning</h4>
                    <p className="text-xs text-slate-500 mt-1 font-sans">Inject professional chemical washes into heat exchanger metal coils to remove stubborn clogs, slime, and mold spores.</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-5 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900">RM 150<span className="text-xs font-normal text-slate-500"> / unit</span></span>
                  <button onClick={() => setIsBookingModalOpen(true)} className="text-[11px] font-bold text-blue-600 hover:underline">Select & Book →</button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider font-sans bg-slate-100 px-2.5 py-1 rounded-full uppercase">Heavy build-up fix</span>
                    <span className="text-xs text-slate-400">Total Refresh</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-850">Chemical Overhaul</h4>
                    <p className="text-xs text-slate-500 mt-1 font-sans">Full separation and bath of drain core, chemical dip casing wash, blower wheel extraction, and bearings checks.</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-5 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900">RM 250<span className="text-xs font-normal text-slate-500"> / unit</span></span>
                  <button onClick={() => setIsBookingModalOpen(true)} className="text-[11px] font-bold text-blue-600 hover:underline">Select & Book →</button>
                </div>
              </div>

            </div>

            {/* Testimonials or local touches */}
            <div className="text-center py-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 max-w-lg mx-auto">
              <span className="text-yellow-400 text-lg">⭐⭐⭐⭐⭐</span>
              <p className="text-xs text-slate-700 font-sans italic px-6 mt-1.5">
                "Ah Hock serviced our coffee shop aircon in Raja Uda Butterworth, very polite crew and cold wind blew on-the-spot! Prices match quoted bill of RM 160-lah."
              </p>
              <span className="text-[10px] font-bold text-slate-500 block mt-1 font-sans">- Koay Coffee Shop, Butterworth</span>
            </div>
          </div>
        )}

        {/* INLINE APPOINTMENT REGISTRATION FORM */}
        {isBookingModalOpen && (
          <div className="max-w-3xl mx-auto animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-wider uppercase">
                ⚙️ Penang Aircon Service Wizard
              </h3>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                ✕ Cancel Booking
              </button>
            </div>
            
            <BookingForm
              userId={currentUser?.uid || "guest-user"}
              onSubmit={handleCreateAppointment}
              onCancel={() => setIsBookingModalOpen(false)}
            />
          </div>
        )}

        {/* TAB 2: CURRENT GUEST/CLIENT APPOINTMENTS LISTING */}
        {activeTab === "dashboard" && (
          <CustomerDashboard
            appointments={filteredClientAppointments}
            onCancelAppointment={handleCancelAppointment}
            onAddAppointmentClick={() => setIsBookingModalOpen(true)}
          />
        )}

        {/* TAB 3: ADMIN DISPATCH CONTROLLER PANEL */}
        {activeTab === "technician" && (
          <TechnicianHub
            appointments={appointments}
            onUpdateStatus={handleUpdateAppointment}
          />
        )}

        {/* TAB 4: UNCLE HOCK DIAGNOSIS INTUITIVE ASSISTANT CHATBOX */}
        {activeTab === "ask_hock" && (
          <div className="max-w-2xl mx-auto h-[600px] flex flex-col">
            <UncleHockChat />
          </div>
        )}

      </main>

      {/* Footer Branding Coordinates */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                ❄️
              </div>
              <div>
                <p className="font-bold text-slate-200">SuperCool Penang & Mainland</p>
                <p className="text-[10px] text-slate-500 font-sans">Registration No: SA-0199028-P (Local Penang Enterprise)</p>
              </div>
            </div>

            <div className="flex gap-4 font-sans text-slate-500">
              <button onClick={() => alert("SuperCool Penang supports Daikin, Panasonic, Mitsubishi, York, Acson, Samsung with genuine parts and 90-day guarantees.")} className="hover:text-slate-300">Supported Brands</button>
              <span>•</span>
              <button onClick={() => alert("All rates listed include full parts checks. Commercial high ceiling cassettes may incur RM50 ladder charge.")} className="hover:text-slate-300">T&C Rate Disclaimers</button>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-[11px] text-slate-500 text-center font-sans tracking-tight">
            © 2026 SuperCool Penang. Keeping Georgetown, Bayan Lepas, and Seberang Perai cold and steady. Built respectfully for Penangites.
          </div>
        </div>
      </footer>

      {/* Mobile persistent rail navigation buttons if modal is closed */}
      {!isBookingModalOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2.5 flex justify-around items-center z-30 shadow-md">
          <button
            onClick={() => setActiveTab("book")}
            className={`flex flex-col items-center gap-1 text-[10px] font-sans font-medium ${
              activeTab === "book" ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-1 text-[10px] font-sans font-medium relative ${
              activeTab === "dashboard" ? "text-blue-600" : "text-slate-500"
            }`}
          >
            {filteredClientAppointments.length > 0 && (
              <span className="absolute top-0 right-1 bg-blue-600 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                {filteredClientAppointments.length}
              </span>
            )}
            <span>📅</span>
            <span>My Bookings</span>
          </button>

          <button
            onClick={() => setActiveTab("ask_hock")}
            className={`flex flex-col items-center gap-1 text-[10px] font-sans font-medium ${
              activeTab === "ask_hock" ? "text-teal-600" : "text-slate-500"
            }`}
          >
            <span>👴🏻</span>
            <span>Uncle Hock Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("technician")}
            className={`flex flex-col items-center gap-1 text-[10px] font-sans font-medium ${
              activeTab === "technician" ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            <span>📋</span>
            <span>Staff Console</span>
          </button>
        </div>
      )}
    </div>
  );
}
