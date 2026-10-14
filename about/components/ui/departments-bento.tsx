"use client";
import React, { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useInView,
} from "motion/react";
import {
  Check,
  Calendar,
  ArrowRight,
  MapPin,
  Phone,
  Star,
  Sparkles,
  Clock,
  Heart,
  Brain,
  Bone,
  Baby,
  Microscope,
  Siren,
  ScanLine,
  Building2,
  BriefcaseMedical,
  type LucideIcon,
} from "lucide-react";

interface DepartmentsBentoProps {
  onBookConsultation?: () => void;
}

/* ==========================================================================
   Smooth Animated Count-Up Number (Spring Physics & Easing)
   Local, self-contained copy — mirrors the About module's implementation
   so this feature stays zero-coupled and independently deletable.
   ========================================================================== */

function AnimatedNumber({
  value,
  duration = 1.4,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(ease * value);
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {Math.round(displayValue).toLocaleString()}
      {suffix}
    </span>
  );
}

/* ==========================================================================
   3D Interactive Tilt & Specular Sheen Card (Agency Grade)
   Local, self-contained copy — mirrors the About module's TiltCard.
   ========================================================================== */

function TiltCard({
  children,
  className = "",
  spotlightColor = "rgba(59, 130, 246, 0.14)",
  tiltAmount = 7,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  tiltAmount?: number;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 280, damping: 26 });
  const mouseY = useSpring(y, { stiffness: 280, damping: 26 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [tiltAmount, -tiltAmount]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-tiltAmount, tiltAmount]);

  const rawMouseX = useMotionValue(-1000);
  const rawMouseY = useMotionValue(-1000);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseFromLeft = e.clientX - rect.left;
    const mouseFromTop = e.clientY - rect.top;

    rawMouseX.set(mouseFromLeft);
    rawMouseY.set(mouseFromTop);

    x.set(mouseFromLeft / rect.width - 0.5);
    y.set(mouseFromTop / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    rawMouseX.set(-1000);
    rawMouseY.set(-1000);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className={`relative overflow-hidden group [perspective:1000px] cursor-pointer will-change-transform ${className}`}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
        style={{
          background: useMotionTemplate`radial-gradient(380px circle at ${rawMouseX}px ${rawMouseY}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      <div className="pointer-events-none absolute -inset-full w-[250%] h-[250%] bg-gradient-to-r from-transparent via-white/10 to-transparent -rotate-45 translate-x-[-130%] group-hover:translate-x-[130%] transition-transform duration-1000 ease-out z-20" />
      <div
        style={{ transform: "translateZ(20px)" }}
        className="relative z-10 h-full flex flex-col justify-between"
      >
        {children}
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   Data Models
   ========================================================================== */

interface DepartmentTheme {
  cardBg: string;
  border: string;
  topAccent: string;
  iconBg: string;
  tagBadge: string;
  spotlight: string;
  glowColor: string;
  solid: string;
}

interface Department {
  id: string;
  icon: LucideIcon;
  name: string;
  tag: string;
  wing: string;
  phone: string;
  rating: number;
  description: string;
  services: string[];
  theme: DepartmentTheme;
}

const THEMES: Record<string, DepartmentTheme> = {
  rose: {
    cardBg: "from-rose-500/10 via-white to-rose-50/40",
    border: "border-rose-200/90 hover:border-rose-400 hover:shadow-[0_20px_45px_rgba(244,63,94,0.18)]",
    topAccent: "from-rose-500 to-red-600",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30",
    tagBadge: "bg-rose-50 text-rose-700 border-rose-200/80",
    spotlight: "rgba(244, 63, 94, 0.2)",
    glowColor: "bg-rose-400/20",
    solid: "text-rose-600",
  },
  violet: {
    cardBg: "from-violet-500/10 via-white to-purple-50/40",
    border: "border-violet-200/90 hover:border-violet-400 hover:shadow-[0_20px_45px_rgba(139,92,246,0.18)]",
    topAccent: "from-violet-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30",
    tagBadge: "bg-violet-50 text-violet-700 border-violet-200/80",
    spotlight: "rgba(139, 92, 246, 0.2)",
    glowColor: "bg-violet-400/20",
    solid: "text-violet-600",
  },
  amber: {
    cardBg: "from-amber-500/10 via-white to-amber-50/40",
    border: "border-amber-200/90 hover:border-amber-400 hover:shadow-[0_20px_45px_rgba(245,158,11,0.18)]",
    topAccent: "from-amber-500 to-orange-600",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30",
    tagBadge: "bg-amber-50 text-amber-700 border-amber-200/80",
    spotlight: "rgba(245, 158, 11, 0.2)",
    glowColor: "bg-amber-400/20",
    solid: "text-amber-600",
  },
  cyan: {
    cardBg: "from-cyan-500/10 via-white to-sky-50/40",
    border: "border-cyan-200/90 hover:border-cyan-400 hover:shadow-[0_20px_45px_rgba(6,182,212,0.18)]",
    topAccent: "from-cyan-500 to-sky-600",
    iconBg: "bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-md shadow-cyan-500/30",
    tagBadge: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    spotlight: "rgba(6, 182, 212, 0.2)",
    glowColor: "bg-cyan-400/20",
    solid: "text-cyan-600",
  },
  emerald: {
    cardBg: "from-emerald-500/10 via-white to-emerald-50/40",
    border: "border-emerald-200/90 hover:border-emerald-400 hover:shadow-[0_20px_45px_rgba(16,185,129,0.18)]",
    topAccent: "from-emerald-500 to-teal-600",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30",
    tagBadge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    spotlight: "rgba(16, 185, 129, 0.2)",
    glowColor: "bg-emerald-400/20",
    solid: "text-emerald-600",
  },
  pink: {
    cardBg: "from-pink-500/10 via-white to-fuchsia-50/40",
    border: "border-pink-200/90 hover:border-pink-400 hover:shadow-[0_20px_45px_rgba(236,72,153,0.18)]",
    topAccent: "from-pink-500 to-fuchsia-600",
    iconBg: "bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white shadow-md shadow-pink-500/30",
    tagBadge: "bg-pink-50 text-pink-700 border-pink-200/80",
    spotlight: "rgba(236, 72, 153, 0.2)",
    glowColor: "bg-pink-400/20",
    solid: "text-pink-600",
  },
  orange: {
    cardBg: "from-orange-500/10 via-white to-red-50/40",
    border: "border-orange-200/90 hover:border-orange-400 hover:shadow-[0_20px_45px_rgba(249,115,22,0.18)]",
    topAccent: "from-orange-500 to-red-600",
    iconBg: "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/30",
    tagBadge: "bg-orange-50 text-orange-700 border-orange-200/80",
    spotlight: "rgba(249, 115, 22, 0.2)",
    glowColor: "bg-orange-400/20",
    solid: "text-orange-600",
  },
  blue: {
    cardBg: "from-blue-500/10 via-white to-indigo-50/40",
    border: "border-blue-200/90 hover:border-blue-400 hover:shadow-[0_20px_45px_rgba(37,99,235,0.18)]",
    topAccent: "from-blue-600 to-indigo-700",
    iconBg: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/30",
    tagBadge: "bg-blue-50 text-blue-700 border-blue-200/80",
    spotlight: "rgba(37, 99, 235, 0.2)",
    glowColor: "bg-blue-400/20",
    solid: "text-blue-600",
  },
};

const DEPARTMENTS: Department[] = [
  {
    id: "cardiology",
    icon: Heart,
    name: "Cardiology",
    tag: "Heart & Vascular Care",
    wing: "Wing A, 2nd Floor",
    phone: "+1 (555) 101-2001",
    rating: 4.9,
    description:
      "Comprehensive cardiovascular diagnostics, interventional cardiology, and post-cardiac rehabilitation delivered by a 24/7 catheterization team.",
    services: [
      "Electrocardiogram (ECG) & Stress Testing",
      "Cardiac Catheterization Lab",
      "Echocardiography & Doppler Imaging",
      "Heart Failure Management Clinic",
      "Post-Surgical Cardiac Rehabilitation",
    ],
    theme: THEMES.rose,
  },
  {
    id: "neurology",
    icon: Brain,
    name: "Neurology",
    tag: "Brain & Nervous System",
    wing: "Wing C, 3rd Floor",
    phone: "+1 (555) 101-2003",
    rating: 4.8,
    description:
      "Advanced neuro-diagnostics and specialized treatment for stroke, epilepsy, and complex neurological disorders with dedicated EEG monitoring.",
    services: [
      "EEG & Electromyography (EMG)",
      "Acute Stroke Rapid-Response Unit",
      "Epilepsy & Seizure Management Clinic",
      "Migraine & Chronic Headache Therapy",
      "Sleep Disorders Evaluation Lab",
    ],
    theme: THEMES.violet,
  },
  {
    id: "orthopedics",
    icon: Bone,
    name: "Orthopedics",
    tag: "Bones, Joints & Spine",
    wing: "Wing A, 1st Floor",
    phone: "+1 (555) 101-2004",
    rating: 4.9,
    description:
      "Full-spectrum orthopedic surgery and rehabilitation, from robotic-assisted joint replacement to sports medicine and spine care.",
    services: [
      "Robotic-Assisted Joint Replacement",
      "Sports Medicine & Trauma Clinic",
      "Spine & Chronic Back Pain Care",
      "Arthroscopic Keyhole Surgery",
      "Post-Op Physical Therapy Programs",
    ],
    theme: THEMES.amber,
  },
  {
    id: "pediatrics",
    icon: Baby,
    name: "Pediatrics",
    tag: "Newborn to Adolescent Care",
    wing: "Wing B, Ground Floor",
    phone: "+1 (555) 101-2002",
    rating: 5.0,
    description:
      "Warm, family-centered pediatric care spanning newborn screening, vaccination, and growth monitoring through adolescence.",
    services: [
      "Newborn Screenings & NICU Support",
      "Immunizations & Vaccination Schedule",
      "Growth & Development Monitoring",
      "Childhood Asthma & Allergy Program",
      "24/7 Pediatric Emergency Care",
    ],
    theme: THEMES.cyan,
  },
  {
    id: "oncology",
    icon: Microscope,
    name: "Oncology",
    tag: "Cancer Diagnostics & Care",
    wing: "Wing D, 4th Floor",
    phone: "+1 (555) 101-2005",
    rating: 4.9,
    description:
      "Multi-disciplinary cancer treatment combining chemotherapy, immunotherapy, and genetic profiling with compassionate palliative support.",
    services: [
      "Chemotherapy & Infusion Suites",
      "Immunotherapy & Targeted Biologics",
      "Cancer Genetic Counseling",
      "Pain & Palliative Management",
      "Active Clinical Trial Screening",
    ],
    theme: THEMES.emerald,
  },
  {
    id: "dermatology",
    icon: Sparkles,
    name: "Dermatology",
    tag: "Skin, Hair & Nail Health",
    wing: "Wing B, 1st Floor",
    phone: "+1 (555) 101-2006",
    rating: 4.8,
    description:
      "Medical, surgical, and cosmetic dermatology delivering skin cancer screening, chronic condition management, and laser therapy.",
    services: [
      "Skin Cancer Screening & Biopsies",
      "Acne & Rosacea Specialized Clinic",
      "Psoriasis & Eczema Management",
      "Laser Skin Resurfacing",
      "Allergy Patch Testing",
    ],
    theme: THEMES.pink,
  },
  {
    id: "emergency",
    icon: Siren,
    name: "Emergency & Trauma",
    tag: "Level 1 Trauma Center",
    wing: "Wing A, Ground Floor",
    phone: "+1 (555) 101-2007",
    rating: 4.9,
    description:
      "Round-the-clock Level 1 trauma response with rapid triage protocols, resuscitation bays, and direct ambulance dispatch.",
    services: [
      "24/7 Level 1 Trauma Response",
      "Rapid Triage & Resuscitation Bays",
      "Ambulance Dispatch & Pre-Hospital Care",
      "Critical Care Stabilization",
      "Poison Control & Toxicology",
    ],
    theme: THEMES.orange,
  },
  {
    id: "radiology",
    icon: ScanLine,
    name: "Radiology & Imaging",
    tag: "Diagnostic Imaging",
    wing: "Wing C, Ground Floor",
    phone: "+1 (555) 101-2008",
    rating: 4.8,
    description:
      "State-of-the-art MRI, CT, and digital X-ray imaging with sub-24-hour radiologist reporting across all outpatient referrals.",
    services: [
      "MRI & CT Scan Suites",
      "Digital X-Ray & Fluoroscopy",
      "Ultrasound & Doppler Studies",
      "Mammography Screening",
      "Same-Day Radiologist Reporting",
    ],
    theme: THEMES.blue,
  },
];

interface DeptDoctor {
  id: string;
  name: string;
  role: string;
  degree: string;
  rating: number;
}

const DOCTORS_BY_DEPT: Record<string, DeptDoctor[]> = {
  cardiology: [
    { id: "julian", name: "Dr. Julian Sterling", role: "Medical Director & Cardiothoracic Surgery", degree: "MD, FACS", rating: 4.9 },
    { id: "amara", name: "Dr. Amara Whitfield", role: "Interventional Cardiologist", degree: "MD, FACC", rating: 4.9 },
  ],
  neurology: [
    { id: "priya", name: "Dr. Priya Kapoor", role: "Stroke & Vascular Neurologist", degree: "MD, PhD", rating: 4.9 },
    { id: "simon", name: "Dr. Simon Achebe", role: "Epileptologist", degree: "MD, FAAN", rating: 4.7 },
  ],
  orthopedics: [
    { id: "elena", name: "Dr. Elena Vance", role: "Chief of Robotic Surgery", degree: "MD, PhD", rating: 4.9 },
    { id: "marcus-r", name: "Dr. Marcus Reyes", role: "Joint Replacement Surgeon", degree: "MD, FAAOS", rating: 4.8 },
  ],
  pediatrics: [
    { id: "fiona", name: "Dr. Fiona Lindqvist", role: "Pediatric Care Lead", degree: "MD, FAAP", rating: 5.0 },
    { id: "owen", name: "Dr. Owen Bassey", role: "Neonatal Specialist", degree: "MD", rating: 4.9 },
  ],
  oncology: [
    { id: "grace", name: "Dr. Grace Yamamoto", role: "Medical Oncologist", degree: "MD, PhD", rating: 4.9 },
    { id: "idris", name: "Dr. Idris Mensah", role: "Radiation Oncologist", degree: "MD", rating: 4.8 },
  ],
  dermatology: [
    { id: "lila", name: "Dr. Lila Novak", role: "Dermatologic Surgeon", degree: "MD, FAAD", rating: 4.8 },
    { id: "rowan", name: "Dr. Rowan Petrova", role: "Cosmetic Dermatologist", degree: "MD", rating: 4.7 },
  ],
  emergency: [
    { id: "marcus-t", name: "Dr. Marcus Thorne", role: "Head of Emergency & Trauma", degree: "MD, FACEP", rating: 4.9 },
    { id: "talia", name: "Dr. Talia Brennan", role: "Trauma Surgeon", degree: "MD", rating: 4.8 },
  ],
  radiology: [
    { id: "victor", name: "Dr. Victor Adeyemi", role: "Chief Radiologist", degree: "MD", rating: 4.8 },
    { id: "naomi", name: "Dr. Naomi Falk", role: "Diagnostic Imaging Specialist", degree: "MD", rating: 4.7 },
  ],
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(1)
    .map((n) => n[0])
    .join("");

/* ==========================================================================
   Department Directory Card (3D Tilt, Cursor Spotlight, Ambient Glow)
   ========================================================================== */

function DepartmentCard({
  dept,
  idx,
  isActive,
  onSelect,
}: {
  dept: Department;
  idx: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const Icon = dept.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: 0.06 * idx, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <TiltCard
        tiltAmount={6}
        spotlightColor={dept.theme.spotlight}
        onClick={onSelect}
        className={`group relative bg-gradient-to-br ${dept.theme.cardBg} rounded-3xl p-6 border-2 ${
          isActive ? dept.theme.border.split(" ")[0].replace("border-", "border-") : "border-slate-200/90"
        } ${dept.theme.border} shadow-sm hover:shadow-2xl transition-all duration-300 h-full ${
          isActive ? "ring-2 ring-offset-2 ring-offset-slate-50" : ""
        }`}
      >
        {/* Top Expanding Laser Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${dept.theme.topAccent} ${
            isActive ? "h-2.5" : "group-hover:h-2.5"
          } transition-all duration-300 rounded-t-3xl`}
        />

        {/* Ambient Pulsing Glow Orb */}
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 4 + idx * 0.5, repeat: Infinity, ease: "easeInOut" }}
          className={`pointer-events-none absolute -top-10 -right-10 size-32 rounded-full blur-2xl ${dept.theme.glowColor}`}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.12 }}
              transition={{ duration: 0.4 }}
              className={`size-12 rounded-2xl flex items-center justify-center ${dept.theme.iconBg} transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Viewing
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-slate-950 transition-colors">
              {dept.name}
            </h4>
            <p className={`text-[11px] font-mono font-bold uppercase tracking-wide ${dept.theme.solid}`}>
              {dept.tag}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 text-[11px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <BriefcaseMedical className="w-3.5 h-3.5" />
              {DOCTORS_BY_DEPT[dept.id]?.length ?? 0} Specialists
            </span>
            <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500 stroke-none" />
              {dept.rating}
            </span>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

/* ==========================================================================
   Main Departments Bento Component
   ========================================================================== */

export function DepartmentsBento({ onBookConsultation }: DepartmentsBentoProps) {
  const [activeDeptId, setActiveDeptId] = useState<string>(DEPARTMENTS[0].id);
  const activeDept = DEPARTMENTS.find((d) => d.id === activeDeptId) ?? DEPARTMENTS[0];
  const activeDoctors = DOCTORS_BY_DEPT[activeDept.id] ?? [];

  return (
    <section className="bg-slate-50 py-20 px-4 sm:px-6 font-sans min-h-screen relative overflow-hidden">
      {/* Ambient background glow orbs, matching the About page's atmosphere */}
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -25, 0], x: [0, 20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-40 -left-20 w-[550px] h-[550px] rounded-full bg-blue-400/10 blur-[140px]"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, 30, 0], x: [0, -20, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute top-1/2 -right-20 w-[500px] h-[500px] rounded-full bg-rose-400/10 blur-[140px]"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -30, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-10 left-1/3 w-[450px] h-[450px] rounded-full bg-emerald-400/8 blur-[140px]"
      />

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        {/* ====================================================================
            1. HEADER
            ==================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <motion.div
            whileHover={{ scale: 1.06, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Clinical Roster
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
            Explore Our Medical Departments
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            Eight flagship specialty wards — part of WeCare's wider network of{" "}
            <span className="font-semibold text-slate-900">
              <AnimatedNumber value={18} suffix="+" />
            </span>{" "}
            outpatient departments operating under certified hygiene and medical
            supervision protocols.
          </p>
        </motion.div>

        {/* ====================================================================
            2. DEPARTMENT DIRECTORY BENTO GRID
            ==================================================================== */}
        <div id="departments" className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Choose a Specialty ({DEPARTMENTS.length})
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Tap a department to view full details below
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEPARTMENTS.map((dept, idx) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                idx={idx}
                isActive={dept.id === activeDeptId}
                onSelect={() => setActiveDeptId(dept.id)}
              />
            ))}
          </div>
        </div>

        {/* ====================================================================
            3. ACTIVE DEPARTMENT DEEP-DIVE PANEL
            ==================================================================== */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDept.id}
              initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, scale: 0.98, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-10 relative overflow-hidden"
            >
              {/* Top accent bar echoing the active department's color */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${activeDept.theme.topAccent}`}
              />

              {/* Department Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`size-16 rounded-2xl flex items-center justify-center shrink-0 ${activeDept.theme.iconBg}`}
                  >
                    <activeDept.icon className="w-8 h-8" />
                  </motion.div>
                  <div className="space-y-1">
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${activeDept.theme.solid}`}>
                      {activeDept.tag}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {activeDept.name} Department
                    </h3>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onBookConsultation}
                  className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Calendar className="w-4 h-4" />
                  Book in {activeDept.name}
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* Overview */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Overview
                </h4>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
                  {activeDept.description}
                </p>
              </div>

              {/* Services & Ward Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Services Checklist */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Offered Clinical Services
                  </h4>
                  <ul className="space-y-2.5">
                    {activeDept.services.map((service, index) => (
                      <motion.li
                        key={service}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index, duration: 0.3 }}
                        className="flex items-start gap-2.5 text-sm text-slate-600 font-medium"
                      >
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${activeDept.theme.solid}`} />
                        <span>{service}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Ward & Logistics Card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Ward &amp; Logistics
                    </h4>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Clinic Location</p>
                        <p className="text-sm font-bold text-slate-800">{activeDept.wing}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Direct Nursing Station</p>
                        <a
                          href={`tel:${activeDept.phone.replace(/\D/g, "")}`}
                          className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                        >
                          {activeDept.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Outpatient Hours</p>
                        <p className="text-sm font-bold text-slate-800">
                          {activeDept.id === "emergency" ? "24/7 — No Appointment Needed" : "Sun–Fri, 8:00 AM – 8:00 PM"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-4 border-t border-slate-200/60 leading-relaxed italic">
                    Emergency triage admissions are accepted directly without token scheduling via Wing A ambulance decks.
                  </p>
                </motion.div>
              </div>

              {/* Specialists Attached */}
              <div className="space-y-5 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <BriefcaseMedical className={`w-4 h-4 ${activeDept.theme.solid}`} />
                  Specialist Clinicians in {activeDept.name} ({activeDoctors.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeDoctors.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * idx, duration: 0.35 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${activeDept.theme.topAccent} text-white font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          {initials(doc.name)}
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                            {doc.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {doc.role} &bull; {doc.degree}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                            <Star className="w-3 h-3 fill-amber-500 stroke-none" />
                            {doc.rating}
                          </div>
                        </div>
                      </div>

                      <motion.button
                        onClick={onBookConsultation}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer shrink-0"
                        title="Book Consultation"
                      >
                        <Calendar className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ====================================================================
            4. CLOSING CONSULTATION BANNER
            ==================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 p-8 sm:p-12 text-white border border-blue-800/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-mono font-bold uppercase tracking-wider border border-blue-400/30">
              <BriefcaseMedical className="w-3.5 h-3.5" /> Not Sure Which Department?
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Talk to Patient Care — We'll Route You Right
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Our front-desk clinical coordinators can match your symptoms to the
              correct specialist and department in under five minutes, no referral required.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            onClick={onBookConsultation}
            className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-xl shrink-0 flex items-center gap-3 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            Book Initial Consultation
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

export default DepartmentsBento;
