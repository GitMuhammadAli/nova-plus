"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser, fetchMe } from "@/app/store/authSlice";
import { AppDispatch } from "@/app/store/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { inviteAPI } from "@/app/services";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const token = params.token as string;

  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (token) {
      loadInvite();
    }
  }, [token]);

  const loadInvite = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inviteAPI.getInvite(token);
      setInviteInfo(response.data.invite);
      if (response.data.invite?.email) {
        setFormData((prev) => ({ ...prev, email: response.data.invite.email }));
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Invalid or expired invite";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Prevent double submission
    if (submitting || success) {
      return;
    }

    if (!formData.name || formData.name.trim().length === 0) {
      setError("Name is required");
      return;
    }

    if (!formData.email || formData.email.trim().length === 0) {
      setError("Email is required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);

    try {
      const response = await inviteAPI.acceptInvite(token, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.data?.user || response.data?.success) {
        setSuccess(true);
        // Wait a bit to ensure cookies are set by the browser
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Fetch the current user to verify authentication and get full user data
        try {
          const userResponse = await dispatch(fetchMe());
          if (fetchMe.fulfilled.match(userResponse)) {
            // Redirect immediately after successful authentication
            router.push("/dashboard");
            return; // Exit early
          }
        } catch (fetchError) {
          // Silently handle - user will be redirected anyway
        }

        // If fetchMe fails, still set the user from response and redirect
        if (response.data?.user) {
          dispatch(setUser(response.data.user));
        }
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to accept invite";
      setError(errorMessage);
      setSubmitting(false);
    }
    // Don't set submitting to false if success - keep it true to prevent re-submission
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Invite</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/register")}>
              Go to Registration
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-info to-success relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">NovaPulse</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Join {inviteInfo?.company?.name || "the team"}
          </h1>
          <p className="text-lg text-white/80 mb-8">
            You've been invited to join{" "}
            {inviteInfo?.company?.name || "a company"}. Complete your
            registration to get started.
          </p>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NovaPulse</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Accept Invitation
            </h2>
            <p className="mt-2 text-muted-foreground">
              Complete your registration to join{" "}
              {inviteInfo?.company?.name || "the team"}
            </p>
          </div>

          {/* Invite Info */}
          {inviteInfo && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">
                  Invite to {inviteInfo.company?.name || "company"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Role: <span className="capitalize">{inviteInfo.role}</span>
                  {inviteInfo.email && ` • Email: ${inviteInfo.email}`}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Invite accepted! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && !success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-9"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={submitting || success}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-9"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={
                    submitting || success || inviteInfo?.email !== undefined
                  }
                />
              </div>
              {inviteInfo?.email && (
                <p className="text-xs text-muted-foreground">
                  This invite is for: {inviteInfo.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={submitting || success}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting || success || !inviteInfo}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Accepting invite...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Accepted!
                </>
              ) : (
                "Accept invitation"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
