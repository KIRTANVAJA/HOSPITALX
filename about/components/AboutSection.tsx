/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Check,
  HeartHandshake,
  Award,
  FlaskConical,
  ShieldCheck,
  Clock,
  MapPin,
  Quote,
} from 'lucide-react';

/* ==========================================================================
   Static Content — adapted from the reference About page, reskinned for
   the WeCare liquid-glass / blue-protocol visual system.
   ========================================================================== */

const CHECKLIST = [
  'Joint Commission Gold Seal Certified',
  '24/7 Trauma Emergency Unit',
  'Fully Electronic Health Record (EHR)',
  'Multi-disciplinary Research Boards',
];

const CORE_VALUES = [
  {
    icon: HeartHandshake,
    title: 'Compassionate Care',
    description:
      'We treat every patient like a beloved member of our own family. Empathy guides our bedside manner and medical companionship.',
  },
  {
    icon: Award,
    title: 'Clinical Excellence',
    description:
      'We hold our clinical staff to the most rigorous standards of evidence-based therapeutics and ongoing surgical training.',
  },
  {
    icon: FlaskConical,
    title: 'Patient-First Innovation',
    description:
      'We actively invest in robotic-assisted surgery platforms, smart health tracking, digital pathology, and clinical research.',
  },
  {
    icon: ShieldCheck,
    title: 'Absolute Integrity',
    description:
      'We strictly protect medical confidentiality and maintain transparent billing, clear procedures, and patient advocacy.',
  },
];

const MILESTONES = [
  {
    year: '1996',
    title: 'Hospital Foundation',
    description:
      'WeCare was established as a 40-bed local outpatient clinic with a small team of dedicated family physicians.',
  },
  {
    year: '2005',
    title: 'Specialized Cardiology Wing',
    description:
      'Inaugurated a dedicated state-of-the-art heart surgery board and expanded capacity to 120 in-patient beds.',
  },
  {
    year: '2015',
    title: 'Joint Commission Gold Seal',
    description:
      'Achieved prestigious Joint Commission accreditation, confirming compliance with the highest national quality benchmarks.',
  },
  {
    year: '2023',
    title: 'Robotic Surgery & Smart Labs',
    description:
      'Integrated AI-driven robotic assistance for orthopedics and cardiology, and launched our digital patient booking protocol.',
  },
];

const STATISTICS = [
  { label: 'Critical Care Beds', value: '80+' },
  { label: 'Outpatient Departments', value: '18' },
  { label: 'Major Surgeries / Year', value: '4,200+' },
  { label: 'Ambulance Fleet', value: '12' },
];

/* ==========================================================================
   Shared sub-components
   ========================================================================== */

const SectionBadge = ({ label }: { label: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
  >
    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
    <span className="text-[12px] font-medium tracking-wider uppercase text-white/80">
      {label}
    </span>
  </motion.div>
);

/* ==========================================================================
   About Section
   ========================================================================== */

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-14 py-24 md:py-32 space-y-28 text-left"
    >
      {/* Ambient blue glow accents, consistent with hero backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 w-[420px] h-[420px] rounded-full bg-sky-500/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full bg-blue-500/10 blur-[120px]"
      />

      {/* 1. Introductory Header + Philosophy Card */}
      <div id="about-intro" className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-6"
        >
          <SectionBadge label="Our Heritage" />

          <h2 className="text-4xl sm:text-5xl font-medium text-white leading-[1.08] tracking-[-0.03em]">
            <span className="block font-semibold">Caring for Your Health</span>
            <span className="block bg-gradient-to-r from-white via-white/90 to-sky-200 bg-clip-text text-transparent">
              Since 1996
            </span>
          </h2>

          <p className="text-[14.5px] sm:text-base leading-[1.7] text-white/70 font-medium">
            At WeCare Hospitals, we recognize that true healing is a careful blend of
            medical science, technological innovation, and sincere compassion. Over three
            decades, we have transformed from a localized community clinic into one of the
            region's most reputable healthcare centers.
          </p>
          <p className="text-[14.5px] sm:text-base leading-[1.7] text-white/70 font-medium">
            Every room in our campus is designed to promote patient comfort and tranquility,
            supported by modern HVAC cleanrooms, sterile surgical chambers, and a tireless
            support desk.
          </p>

          {/* Checklist */}
          <div id="about-checklist" className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {CHECKLIST.map((text, idx) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * idx, duration: 0.4 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xl"
              >
                <Check className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-[13px] font-medium text-white/85">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Philosophy Quote Card — liquid glass panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          whileHover={{ y: -4 }}
          id="about-quote-card"
          className="liquid-glass-panel p-8 sm:p-10 rounded-3xl min-h-[380px] flex flex-col justify-between"
        >
          <div className="space-y-4">
            <Quote className="w-8 h-8 text-sky-400/80 drop-shadow-[0_0_12px_rgba(0,140,255,0.5)]" />
            <span className="font-mono text-[11px] uppercase tracking-widest font-semibold text-sky-300/90">
              Our Philosophy
            </span>
            <blockquote className="text-xl font-medium leading-relaxed italic text-white/95">
              "We believe healthcare shouldn't be transaction-based. Every consultation,
              every surgery, and every recovery check is a chance to honor patient trust
              with world-class skill."
            </blockquote>
          </div>

          <div className="border-t border-white/15 pt-6 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(0,140,255,0.85)]" />
            <div>
              <h4 className="font-bold text-[15px] text-white">Dr. Julian Sterling</h4>
              <p className="text-xs text-white/50">Medical Director &amp; Co-Founder, WeCare Hospitals</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. Core Values Grid */}
      <div id="about-core-values" className="relative space-y-12">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-3">
          <SectionBadge label="Our Pillars" />
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-[-0.02em]">
            Our Core Clinical Values
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            These fundamental principles guide every medical recommendation, patient
            interaction, and institutional expansion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORE_VALUES.map((value, idx) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * idx, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="liquid-glass-panel p-6 rounded-2xl flex flex-col items-start text-left h-full group"
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(0,140,255,0.6)]" />
                </div>
                <h3 className="text-white font-bold text-[15px] mb-2 tracking-tight">
                  {value.title}
                </h3>
                <p className="text-white/55 text-[12.5px] leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Timeline of Milestones */}
      <div
        id="about-timeline"
        className="relative liquid-glass-panel p-8 sm:p-12 rounded-3xl space-y-12"
      >
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-2">
          <SectionBadge label="Our Journey" />
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-[-0.02em]">
            Timeline of Excellence
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Follow the key milestones that shaped WeCare into a premier regional
            healthcare protocol.
          </p>
        </div>

        <div className="relative border-l-2 border-white/15 ml-4 md:ml-32 space-y-12 py-4">
          {MILESTONES.map((mile, idx) => (
            <motion.div
              key={mile.year}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx, duration: 0.5 }}
              className="relative pl-8 md:pl-16"
            >
              {/* Timeline marker */}
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-sky-400 border-4 border-black shadow-[0_0_10px_rgba(0,140,255,0.9)]" />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2">
                  <span className="text-2xl font-extrabold text-sky-300 font-mono tracking-tight">
                    {mile.year}
                  </span>
                </div>
                <div className="md:col-span-10 space-y-1">
                  <h4 className="font-bold text-[15px] text-white">{mile.title}</h4>
                  <p className="text-white/55 text-[12.5px] leading-relaxed">
                    {mile.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. Campus Infrastructure & Statistics */}
      <div id="about-facility" className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <SectionBadge label="Our Facility" />
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-[-0.02em]">
            Advanced Clinical Infrastructure
          </h2>
          <p className="text-white/70 text-[14.5px] leading-relaxed">
            Our campus spans over 240,000 square feet, built to handle emergency triage,
            specialty consults, and inpatient recovery. Our operating chambers are fitted
            with advanced laminar airflow systems to reduce surgical infection risk to
            near zero.
          </p>

          {/* Status metric badges, matching hero styling */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {STATISTICS.map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.04, y: -2 }}
                className="px-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/15 backdrop-blur-xl"
              >
                <span className="text-2xl font-extrabold text-white block font-mono tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[11px] text-white/50 font-medium uppercase tracking-wide">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="space-y-4"
        >
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            className="liquid-glass-panel p-6 rounded-2xl flex items-start gap-4"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15">
              <Clock className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(0,140,255,0.6)]" />
            </div>
            <div>
              <h4 className="font-bold text-white text-[15px] mb-1">
                Admissions Desk &amp; Support
              </h4>
              <p className="text-[12.5px] text-white/55 leading-relaxed">
                Emergency room is active 24/7, with ambulance pick-up. Outpatient
                departments operate Sunday to Friday with pre-scheduled tokens.
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            className="liquid-glass-panel p-6 rounded-2xl flex items-start gap-4"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15">
              <MapPin className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(0,140,255,0.6)]" />
            </div>
            <div>
              <h4 className="font-bold text-white text-[15px] mb-1">Central Location</h4>
              <p className="text-[12.5px] text-white/55 leading-relaxed">
                Conveniently located in the center of the Medical District with ample
                parking, wheelchair-friendly corridors, and direct city transit access.
              </p>
            </div>
          </motion.div>

          {/* Protocol status footer, echoing the hero's technical readout style */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 backdrop-blur-xl shadow-[0_6px_20px_rgba(0,0,0,0.25)] text-xs text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="font-mono text-[11px] font-bold tracking-wider text-white/85">
              FACILITY STATUS: OPERATIONAL
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
