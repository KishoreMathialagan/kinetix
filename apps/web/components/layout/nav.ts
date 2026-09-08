'use client'
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarClock,
  FileText,
  CreditCard,
  UserCog,
  Settings,
  HeartPulse,
  Dumbbell,
  TrendingUp,
} from 'lucide-react'
import type { NavItem } from './sidebar'

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Patients', href: '/admin/patients', icon: Users },
  { label: 'Therapists', href: '/admin/therapists', icon: Stethoscope },
  { label: 'Appointments', href: '/admin/appointments', icon: CalendarClock },
  { label: 'Reports', href: '/admin/reports', icon: FileText },
  { label: 'Billing', href: '/admin/billing', icon: CreditCard },
  { label: 'Users', href: '/admin/users', icon: UserCog },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export const therapistNavItems: NavItem[] = [
  { label: 'Home', href: '/therapist/dashboard', icon: LayoutDashboard },
  { label: 'Patients', href: '/therapist/patients', icon: Users },
  { label: 'Appointments', href: '/therapist/appointments', icon: CalendarClock },
  { label: 'Care', href: '/therapist/treatments', icon: HeartPulse },
  { label: 'Profile', href: '/therapist/profile', icon: Settings },
]

export const patientNavItems: NavItem[] = [
  { label: 'Home', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/patient/appointments', icon: CalendarClock },
  { label: 'Exercises', href: '/patient/exercises', icon: Dumbbell },
  { label: 'Progress', href: '/patient/progress', icon: TrendingUp },
  { label: 'Reports', href: '/patient/reports', icon: FileText },
  { label: 'Profile', href: '/patient/profile', icon: Settings },
]
