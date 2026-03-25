"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { auth, db, googleProvider } from "@/lib/firebase.config";
import { useRouter } from "next/navigation";


type AuthMode = "login" | "signup";

async function saveUserToFirestore(user: User, provider: "password" | "google") {
    const userRef = doc(db, "users", user.uid);
    const existingUser = await getDoc(userRef);

    await setDoc(
        userRef,
        {
            uid: user.uid,
            email: user.email ?? "",
            displayName: user.displayName ?? "",
            photoURL: user.photoURL ?? "",
            provider,
            lastLoginAt: serverTimestamp(),
            ...(existingUser.exists() ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true },
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const submitText = useMemo(() => {
        if (loading) {
            return "Please wait...";
        }

        return mode === "login" ? "Login with Email" : "Create Account";
    }, [loading, mode]);

    async function handleEmailPasswordAuth(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const credentials =
                mode === "login"
                    ? await signInWithEmailAndPassword(auth, email, password)
                    : await createUserWithEmailAndPassword(auth, email, password);

            await saveUserToFirestore(credentials.user, "password");
            setSuccess(mode === "login" ? "Logged in successfully." : "Account created successfully.");
            setEmail("");
            setPassword("");
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "Authentication failed. Please try again.";

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleAuth() {
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const credentials = await signInWithPopup(auth, googleProvider);
            await saveUserToFirestore(credentials.user, "google");
            setSuccess("Google sign-in successful.");
            router.replace("/");
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "Google sign-in failed. Please try again.";

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-black dark:text-zinc-100">
            <main className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Login</h1>
                    <Link
                        href="/"
                        className="text-sm text-zinc-600 underline hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                        Back to app
                    </Link>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Continue with email-password or Google. Authenticated users are stored in Firestore.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                    <button
                        type="button"
                        className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "login"
                            ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                            : "text-zinc-600 dark:text-zinc-300"
                            }`}
                        onClick={() => setMode("login")}
                        disabled={loading}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "signup"
                            ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                            : "text-zinc-600 dark:text-zinc-300"
                            }`}
                        onClick={() => setMode("signup")}
                        disabled={loading}
                    >
                        Sign up
                    </button>
                </div>

                <form className="mt-5 space-y-3" onSubmit={handleEmailPasswordAuth}>
                    <label className="flex flex-col gap-1 text-sm">
                        Email
                        <input
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm">
                        Password
                        <input
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                        {submitText}
                    </button>
                </form>

                <div className="my-4 flex items-center gap-2">
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">OR</span>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>

                <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                    Continue with Google
                </button>

                {error ? (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        {error}
                    </p>
                ) : null}

                {success ? (
                    <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                        {success}
                    </p>
                ) : null}
            </main>
        </div>
    );
}
