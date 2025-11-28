"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError, resetLoading } from "@/app/store/authSlice";
import { AppDispatch, RootState } from "@/app/store/store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Clear any errors and reset loading state when component mounts
    dispatch(clearError());
    dispatch(resetLoading());
  }, [dispatch]);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const joined = searchParams.get("joined");
    const inviteEmail = searchParams.get("email");

    if (joined) {
      setInviteSuccessMessage(
        "Your account is ready. Please sign in to continue."
      );
      if (inviteEmail) {
        setFormData((prev) => ({ ...prev, email: inviteEmail }));
      }
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Use local state to prevent blocking
    if (isSubmitting) {
      return;
    }

    if (!formData.email || !formData.password) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dispatch(login(formData));

      if (login.fulfilled.match(result)) {
        // Redirect will happen via useEffect
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormDisabled = isSubmitting || isLoading;

  return (
    <div className="min-h-screen w-full flex bg-background antialiased">
      {/* Left Panel - Illustration & Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-info to-success relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">NovaPulse</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-snug">
            Welcome back to <br />
            <span className="text-info-300">NovaPulse.</span>
          </h1>
          <p className="text-lg text-white/80 max-w-sm">
            Access your control center for automation, analytics, and team
            management.
          </p>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-2xl border border-border"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NovaPulse</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-2 text-muted-foreground">
              New here?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {inviteSuccessMessage && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {inviteSuccessMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-9"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full group shadow-md hover:shadow-lg transition-shadow"
              size="lg"
              disabled={isFormDisabled}
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
