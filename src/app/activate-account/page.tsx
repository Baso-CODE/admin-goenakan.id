"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/helper/apiurl";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import { FormEvent, useEffect, useState } from "react";

import { toast } from "sonner";

export default function ActivateAccountPage() {
  const [token, setToken] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const activationToken = params.get("token") || "";

    setToken(activationToken);

    // Jangan biarkan token tersimpan di address bar.
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || isSuccess) return;

    if (!token) {
      toast.error("Token aktivasi tidak tersedia.");
      return;
    }

    if (password.length < 12 || password.length > 128) {
      toast.error("Password harus memiliki 12–128 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak sama.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/users/activate-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
        cache: "no-store",
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.message || "Gagal mengaktifkan akun.");
      }

      setToken("");
      setPassword("");
      setConfirmPassword("");
      setIsSuccess(true);

      toast.success("Akun Goenakan berhasil diaktifkan!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat aktivasi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/5 lg:min-h-[580px] lg:grid-cols-[0.95fr_1.05fr]">
        {/* ====================================
            BRAND SIDE
        ==================================== */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-primary p-7 text-primary-foreground sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/15"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/15"
          />

          <div className="relative z-10 space-y-9">
            <div className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 shadow-sm">
              <Image
                src="/images/logo_goenakan.png"
                alt="Goenakan Indonesia"
                width={150}
                height={60}
                priority
                className="h-11 w-auto max-w-[150px] object-contain"
              />
            </div>

            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure Account Setup
              </div>

              <div className="space-y-4">
                <h1 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Welcome to
                  <span className="block">Goenakan Indonesia.</span>
                </h1>

                <p className="max-w-sm text-sm leading-7 opacity-85">
                  Satu langkah lagi untuk mulai berkolaborasi. Aktifkan akun dan
                  buat password pribadi untuk mengakses sistem Admin Goenakan.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 space-y-5">
            <div className="h-px w-full bg-white/20" />

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold">Your security matters.</p>

                <p className="max-w-xs text-xs leading-6 opacity-80">
                  Password yang Anda buat akan disimpan secara aman dan tidak
                  dibagikan kepada Super Admin.
                </p>
              </div>
            </div>

            <p className="text-[11px] opacity-65">© Goenakan Indonesia</p>
          </div>
        </section>

        {/* ====================================
            FORM SIDE
        ==================================== */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          {token === null ? (
            <div
              className="flex flex-col items-center gap-4 py-12 text-center"
              aria-live="polite">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />

              <p className="text-sm text-muted-foreground">
                Memeriksa link aktivasi...
              </p>
            </div>
          ) : isSuccess ? (
            /* ==================================
               SUCCESS STATE
            ================================== */
            <div className="space-y-6 text-center" aria-live="polite">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Activation Successful
                </p>

                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Akun Berhasil Diaktifkan
                </h2>

                <p className="text-sm leading-7 text-muted-foreground">
                  Password berhasil dibuat. Akun Admin Goenakan Anda sekarang
                  siap digunakan.
                </p>
              </div>

              <Button
                asChild
                className="h-12 w-full rounded-lg font-semibold shadow-sm">
                <Link href="/login">
                  Login Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : !token ? (
            /* ==================================
               INVALID LINK STATE
            ================================== */
            <div className="space-y-6 text-center" aria-live="polite">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <KeyRound className="h-9 w-9 text-primary" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold">Link Tidak Valid</h2>

                <p className="text-sm leading-7 text-muted-foreground">
                  Link aktivasi tidak ditemukan. Silakan hubungi Super Admin
                  untuk mendapatkan undangan baru.
                </p>
              </div>

              <Button asChild variant="outline" className="h-11 w-full">
                <Link href="/login">Kembali ke Login</Link>
              </Button>
            </div>
          ) : (
            /* ==================================
               ACTIVATION FORM
            ================================== */
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                  <MailCheck className="h-3.5 w-3.5" />
                  Account Invitation
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Aktivasi Akun
                  </h2>

                  <p className="text-sm leading-7 text-muted-foreground">
                    Akun Anda telah dibuat oleh Super Admin. Silakan buat
                    password pribadi untuk menyelesaikan proses aktivasi.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="activation-password"
                    className="block text-sm font-semibold">
                    Password Baru
                  </label>

                  <div className="relative">
                    <Input
                      id="activation-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      maxLength={128}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 12 karakter"
                      disabled={isSubmitting}
                      className="h-12 rounded-lg border-border bg-background/70 pr-12 text-sm focus-visible:ring-primary/30"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      disabled={isSubmitting}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-primary">
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Gunakan 12–128 karakter dan password yang unik.
                  </p>
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <label
                    htmlFor="activation-confirm"
                    className="block text-sm font-semibold">
                    Konfirmasi Password
                  </label>

                  <div className="relative">
                    <Input
                      id="activation-confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      maxLength={128}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Masukkan ulang password"
                      disabled={isSubmitting}
                      className="h-12 rounded-lg border-border bg-background/70 pr-12 text-sm focus-visible:ring-primary/30"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={
                        showConfirm
                          ? "Sembunyikan konfirmasi password"
                          : "Tampilkan konfirmasi password"
                      }
                      disabled={isSubmitting}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-primary">
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-12 w-full rounded-lg text-sm font-semibold shadow-sm transition-all hover:opacity-90">
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Mengaktifkan Akun...
                    </>
                  ) : (
                    <>
                      Aktivasi Akun Saya
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/50 p-3.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <p className="text-xs leading-6 text-muted-foreground">
                    Link aktivasi hanya dapat digunakan satu kali. Password Anda
                    tidak dikirim melalui email maupun ditampilkan kepada Super
                    Admin.
                  </p>
                </div>
              </form>

              <div className="border-t border-border pt-5 text-center">
                <p className="text-xs text-muted-foreground">
                  Sudah memiliki akun aktif?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-primary underline-offset-4 hover:underline">
                    Masuk ke Goenakan
                  </Link>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
