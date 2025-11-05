"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { registerCompany } from "@/app/store/companySlice";
import { setUser } from "@/app/store/authSlice";
import { AppDispatch, RootState } from "@/app/store/store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Mail, Lock, User, Building2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterCompany() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.company);

  const [formData, setFormData] = useState({
    companyName: "",
    domain: "",
    adminName: "",
    email: "",
    password: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(false);

    // Validate password length
    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return;
    }

    // Validate company name
    if (!formData.companyName.trim()) {
      setValidationError("Company name is required");
      return;
    }

    // Validate admin name
    if (!formData.adminName.trim()) {
      setValidationError("Admin name is required");
      return;
    }

    const result = await dispatch(registerCompany({
      companyName: formData.companyName,
      domain: formData.domain || undefined,
      adminName: formData.adminName,
      email: formData.email,
      password: formData.password,
    }));

    if (registerCompany.fulfilled.match(result)) {
      setSuccess(true);
      // Set user in auth state if admin data is returned
      if (result.payload?.admin) {
        dispatch(setUser(result.payload.admin));
      }
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Illustration */}
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
            Register your company
            <br />
            and get started
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Create your company workspace and become the administrator. Invite your team and start managing projects.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Complete workspace isolation</h3>
                <p className="text-sm text-white/70">
                  Your company data is completely separate and secure
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Role-based access control</h3>
                <p className="text-sm text-white/70">
                  Manage your team with admin, manager, and user roles
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Instant setup</h3>
                <p className="text-sm text-white/70">
                  Get started in minutes with your own workspace
                </p>
              </div>
            </div>
          </div>
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
              Register your company
            </h2>
            <p className="mt-2 text-muted-foreground">
              Already have a company?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Company registered successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {displayError && !success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Acme Corp"
                  className="pl-9"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  disabled={isLoading || success}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain (optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="domain"
                  name="domain"
                  type="text"
                  placeholder="acme.com"
                  className="pl-9"
                  value={formData.domain}
                  onChange={handleChange}
                  disabled={isLoading || success}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your company domain (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminName">Your name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="adminName"
                  name="adminName"
                  type="text"
                  placeholder="John Doe"
                  className="pl-9"
                  value={formData.adminName}
                  onChange={handleChange}
                  required
                  disabled={isLoading || success}
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
                  placeholder="john@acme.com"
                  className="pl-9"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading || success}
                />
              </div>
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
                  onChange={handleChange}
                  required
                  disabled={isLoading || success}
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
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering company...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Registered!
                </>
              ) : (
                "Register company"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            By registering, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

