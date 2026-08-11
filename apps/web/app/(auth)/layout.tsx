import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, HeartPulse, Stethoscope, UserCog, Leaf } from 'lucide-react'
import { Brand } from '@/components/brand'

export const metadata: Metadata = {
  title: 'Sign in',
}

const FEATURES = [
  { icon: HeartPulse, label: 'Patient portal' },
  { icon: Stethoscope, label: 'Therapist workspace' },
  { icon: UserCog, label: 'Clinic management' },
]

const year = new Date().getFullYear()

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      {/* Decorative brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-28 -right-20 h-96 w-96 rounded-full bg-secondary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary-foreground/10 blur-3xl" />
        <Leaf className="pointer-events-none absolute top-1/4 left-2 h-64 w-64 -rotate-[24deg] text-primary-foreground/10" />
        <Leaf className="pointer-events-none absolute -right-10 bottom-24 h-80 w-80 rotate-[32deg] text-secondary/20" />
        <Leaf className="pointer-events-none absolute left-1/3 top-10 h-24 w-24 rotate-12 text-primary-foreground/10" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground text-primary">
            <Activity className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-semibold tracking-tight text-primary-foreground">Kinetix</span>
            <span className="block text-xs text-primary-foreground/60">Home Care</span>
          </span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-primary-foreground">
            Physiotherapy,
            <br />
            at home
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            One secure account for patients, therapists and clinic teams — with a portal crafted for everyone.
          </p>
          <div className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-primary-foreground/85">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/50">© {year} Kinetix Home Care</p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-secondary/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -right-24 h-[26rem] w-[26rem] rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground/25 blur-3xl" />
        <Leaf className="pointer-events-none absolute -right-12 top-10 h-72 w-72 rotate-12 text-primary/5" />
        <Leaf className="pointer-events-none absolute -left-16 bottom-8 h-96 w-96 -rotate-6 text-secondary/10" />

        <header className="relative flex items-center justify-between px-6 py-5 lg:justify-end">
          <div className="lg:hidden">
            <Brand />
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">Physiotherapy, at home</span>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-12 pt-6">
          <div className="w-full">{children}</div>
        </div>

        <footer className="relative pb-6 text-center text-xs text-muted-foreground lg:hidden">
          © {year} Kinetix Home Care
        </footer>
      </main>
    </div>
  )
}