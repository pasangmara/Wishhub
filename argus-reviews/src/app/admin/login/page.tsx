import type { Metadata } from "next";
import Link from "next/link";
import { ArgusLogo } from "@/components/argus-logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-paper px-4 py-10">
      <div aria-hidden className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-forest-800 opacity-[0.07] blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-ember-500 opacity-[0.07] blur-3xl" />
      <div className="w-full max-w-[400px] animate-fade-up">
        <Link href="/" className="mx-auto flex w-fit">
          <ArgusLogo />
        </Link>
        <div className="mt-8 rounded-[28px] border border-line bg-white p-6 shadow-lift sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to manage your reviews.</p>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
        <p className="mt-6 text-center text-xs text-ink-400">
          Business accounts only. Guests never need to sign in.
        </p>
      </div>
    </main>
  );
}
