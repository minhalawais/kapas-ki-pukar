"use client";

import { t } from "@kapas/localization";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { BrandMark } from "@/components/layout/BrandMark";
import { PortalFooter } from "@/components/layout/PortalFooter";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/stores/locale-store";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("manager@puwf.org.pk");
  const [password, setPassword] = useState("demo-access");
  const isUrdu = locale === "ur";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.replace("/dashboard");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[var(--page-worker)] px-4 py-5 pb-24 text-ink sm:px-6 sm:py-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(5,63,41,0.08),rgba(250,247,239,0))]" />
      <div className="relative mx-auto grid min-h-[calc(100dvh-96px)] w-full max-w-[1360px] items-center gap-5 sm:gap-6 lg:grid-cols-[minmax(680px,1.35fr)_minmax(420px,0.75fr)]">
        <section className="relative min-h-[350px] overflow-hidden rounded-card border border-white/40 bg-institutional text-[color:var(--on-institutional)] shadow-[0_22px_60px_rgba(5,63,41,0.22)] sm:min-h-[560px] lg:min-h-[620px] xl:min-h-[680px]">
          <Image
            src="/illustrations/login-worker-voice.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,63,41,0.92),rgba(5,63,41,0.58)_48%,rgba(5,63,41,0.08))]" />
          <div className="relative flex min-h-[350px] flex-col p-5 sm:min-h-[560px] sm:p-8 lg:min-h-[620px] xl:min-h-[680px]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandMark size={38} />
                <div>
                  <p className="text-base font-semibold leading-5">{t(locale, "app.name")}</p>
                  <p className="mt-1 text-xs opacity-80">{t(locale, "portal.role")}</p>
                </div>
              </div>
              <div className="flex rounded-control border border-white/20 bg-white/10 p-0.5">
                <button
                  type="button"
                  className={`h-7 rounded-[6px] px-2 text-xs font-semibold ${locale === "en" ? "bg-white text-institutional" : "text-white/80 hover:bg-white/10"}`}
                  onClick={() => setLocale("en")}
                  aria-pressed={locale === "en"}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`h-7 rounded-[6px] px-2 font-urdu text-xs font-semibold ${locale === "ur" ? "bg-white text-institutional" : "text-white/80 hover:bg-white/10"}`}
                  onClick={() => setLocale("ur")}
                  aria-pressed={locale === "ur"}
                >
                  اردو
                </button>
              </div>
            </div>

            <div className="mt-auto max-w-xl">
              <p className="inline-flex rounded-full border border-white/25 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-white/90">
                {t(locale, "portal.login.eyebrow")}
              </p>
              <h1 className={`mt-4 max-w-lg text-3xl font-semibold leading-tight text-white sm:mt-5 sm:text-5xl ${isUrdu ? "font-urdu" : ""}`}>
                {t(locale, "portal.login.heroTitle")}
              </h1>
              <p className={`mt-3 max-w-lg text-sm leading-6 text-white/82 sm:mt-4 sm:text-base sm:leading-7 ${isUrdu ? "font-urdu text-base sm:text-lg" : ""}`}>
                {t(locale, "portal.login.heroBody")}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center rounded-card border border-border bg-surface p-5 shadow-[0_18px_48px_rgba(23,35,30,0.11)] sm:p-7 lg:min-h-[620px] xl:min-h-[680px]">
          <div>
            <div className="mb-8 flex justify-center">
              <div className="flex items-center justify-center gap-4" aria-label={t(locale, "app.name")}>
                <picture className="block shrink-0 leading-none">
                  <source srcSet="/brand/logo-mark.webp" type="image/webp" />
                  <img src="/brand/logo-mark.png" alt="" className="h-20 w-20 object-contain sm:h-24 sm:w-24" />
                </picture>
                <div className="text-start leading-none">
                  <p className="text-[40px] font-extrabold uppercase leading-none tracking-normal text-action sm:text-[46px]">
                    KAPAS
                  </p>
                  <p className="mt-2 text-[15px] font-bold uppercase tracking-[0.32em] text-[#2B9C8C] sm:text-[17px]">
                    KI PUKAAR
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h2 className={`text-2xl font-semibold text-ink ${isUrdu ? "font-urdu" : ""}`}>{t(locale, "portal.login.title")}</h2>
            </div>

            <form className="mt-7 space-y-4" onSubmit={submit}>
              <label className="block text-xs font-semibold text-muted">
                {t(locale, "portal.login.email")}
                <span className="relative mt-1 block">
                  <Mail size={17} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 w-full rounded-control border border-border bg-page ps-9 pe-3 text-sm text-ink outline-none transition-colors focus:border-action"
                    autoComplete="email"
                    required
                    dir="ltr"
                  />
                </span>
              </label>

              <label className="block text-xs font-semibold text-muted">
                {t(locale, "portal.login.password")}
                <span className="relative mt-1 block">
                  <LockKeyhole size={17} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-control border border-border bg-page ps-9 pe-11 text-sm text-ink outline-none transition-colors focus:border-action"
                    autoComplete="current-password"
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-control text-muted hover:bg-surface hover:text-ink"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={t(locale, showPassword ? "portal.login.hidePassword" : "portal.login.showPassword")}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="inline-flex items-center gap-2 text-muted">
                  <input type="checkbox" className="h-4 w-4 rounded border-border accent-[var(--action-primary)]" defaultChecked />
                  {t(locale, "portal.login.keepSignedIn")}
                </label>
                <button type="button" className="font-semibold text-action hover:underline">
                  {t(locale, "portal.login.needHelp")}
                </button>
              </div>

              <Button type="submit" className="h-11 w-full text-sm">
                {t(locale, "portal.login.submit")}
                <ArrowRight size={17} className={isUrdu ? "rotate-180" : ""} />
              </Button>
            </form>

            <div className="mt-8 border-t border-border pt-5">
              <div className="flex items-center justify-center gap-8">
                <img
                  src="/partners/ilo_logo.png"
                  alt="International Labour Organization"
                  className="h-auto w-[88px] object-contain"
                />
                <span className="h-9 w-px bg-border" aria-hidden />
                <img
                  src="/partners/puwf_logo.png"
                  alt="Pakistan Workers Federation"
                  className="h-auto w-[58px] object-contain"
                />
              </div>
            </div>

          </div>

        </section>
      </div>
      <PortalFooter fullWidth />
    </main>
  );
}
