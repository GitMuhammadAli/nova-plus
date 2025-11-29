"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearError, fetchMe, resetLoading, setUser } from "@/app/store/authSlice";
import { registerCompany } from "@/app/store/companySlice";
import { AppDispatch, RootState } from "@/app/store/store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Mail, Lock, User, Building2, AlertCircle, CheckCircle2, Users } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading: authLoading, error: authError, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isLoading: companyLoading, error: companyError } = useSelector((state: RootState) => state.company);

  const [activeTab, setActiveTab] = useState<string>("create");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Registration successful! Redirecting...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Company form data
  const [createCompanyData, setCreateCompanyData] = useState({
    companyName: "",
    domain: "",
    adminName: "",
    email: "",
    password: "",
  });

  // Join Company form data
  const [joinCompanyData, setJoinCompanyData] = useState({
    inviteToken: "",
    name: "",
    email: "",
    password: "",
  });

  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  const isLoading = authLoading || companyLoading || isSubmitting;
  const error = validationError || authError || companyError;

  useEffect(() => {
    dispatch(clearError());
    dispatch(resetLoading());
    // Check if there's an invite token in URL
    const token = searchParams.get('token');
    if (token) {
      setActiveTab("join");
      setJoinCompanyData(prev => ({ ...prev, inviteToken: token }));
      validateInviteToken(token);
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const validateInviteToken = async (token: string) => {
    if (!token) return;
    
    setLoadingInvite(true);
    try {
      const { inviteAPI } = await import("@/app/services");
      const response = await inviteAPI.getInvite(token);
      setInviteInfo(response.data.invite);
      if (response.data.invite?.email) {
        setJoinCompanyData(prev => ({ ...prev, email: response.data.invite.email }));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Invalid or expired invite";
      setValidationError(errorMessage);
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setValidationError(null);
    setSuccess(false);

    if (isSubmitting) {
      return;
    }

    if (createCompanyData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return;
    }

    if (!createCompanyData.companyName.trim()) {
      setValidationError("Company name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dispatch(registerCompany({
        companyName: createCompanyData.companyName,
        domain: createCompanyData.domain || undefined,
        adminName: createCompanyData.adminName,
        email: createCompanyData.email,
        password: createCompanyData.password,
      }));

      if (registerCompany.fulfilled.match(result)) {
        setSuccess(true);
        setSuccessMessage("Company created successfully! Redirecting to your dashboard...");
        // Fetch the complete user data from backend (cookies are set by backend)
        try {
          await dispatch(fetchMe()).unwrap();
          setTimeout(() => {
            router.replace("/dashboard");
          }, 500);
        } catch (error) {
          console.error('Failed to fetch user after registration:', error);
          setTimeout(() => {
            router.replace("/dashboard");
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setValidationError(null);
    setSuccess(false);

    // Prevent double submission
    if (isSubmitting || success) {
      return;
    }

    if (!joinCompanyData.inviteToken) {
      setValidationError("Invite token is required");
      return;
    }

    if (!joinCompanyData.name || joinCompanyData.name.trim().length === 0) {
      setValidationError("Name is required");
      return;
    }

    if (!joinCompanyData.email || joinCompanyData.email.trim().length === 0) {
      setValidationError("Email is required");
      return;
    }

    if (joinCompanyData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);

    try {
      const { inviteAPI } = await import("@/app/services");
      const response = await inviteAPI.acceptInvite(joinCompanyData.inviteToken, {
        name: joinCompanyData.name.trim(),
        email: joinCompanyData.email.trim(),
        password: joinCompanyData.password,
      });

      if (response.data?.user || response.data?.success) {
        setSuccess(true);
        setSuccessMessage("Account created successfully! Redirecting to your dashboard...");
        
        // Disable form to prevent re-submission
        // Keep isSubmitting true to prevent button clicks
        
        // Wait a bit to ensure cookies are set by the browser
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch the complete user data from backend (cookies are set by backend)
        try {
          const userResult = await dispatch(fetchMe()).unwrap();
          if (userResult) {
            // User is authenticated, redirect immediately
            router.push("/dashboard");
            return; // Exit early
          }
        } catch (error) {
          console.error('Failed to fetch user after invite acceptance:', error);
          // Set user from response if available
          if (response.data?.user) {
            dispatch(setUser(response.data.user));
          }
        }
        
        // Fallback redirect (cookies should be set by backend)
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error('Invite acceptance error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to accept invite";
      setValidationError(errorMessage);
      setIsSubmitting(false);
    }
    // Don't set isSubmitting to false if success - keep it true to prevent re-submission
  };

  const handleInviteTokenChange = (token: string) => {
    setJoinCompanyData(prev => ({ ...prev, inviteToken: token }));
    if (token.length > 20) {
      validateInviteToken(token);
    } else {
      setInviteInfo(null);
    }
  };

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
            Get started with
            <br />
            NovaPulse today
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Create your company workspace or join an existing team.
          </p>
        </div>
      </motion.div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Get Started</h1>
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Company</TabsTrigger>
              <TabsTrigger value="join">Join Company</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-6">
              <form onSubmit={handleCreateCompany} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Acme Inc."
                      className="pl-9"
                      value={createCompanyData.companyName}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, companyName: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (optional)</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="acme.com"
                    value={createCompanyData.domain}
                    onChange={(e) => setCreateCompanyData({ ...createCompanyData, domain: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminName">Your Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="adminName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-9"
                      value={createCompanyData.adminName}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, adminName: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      className="pl-9"
                      value={createCompanyData.email}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={createCompanyData.password}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, password: e.target.value })}
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Company"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="space-y-4 mt-6">
              <form onSubmit={handleJoinCompany} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="inviteToken">Invite Token *</Label>
                    <Input
                      id="inviteToken"
                      type="text"
                      placeholder="Enter invite token"
                      value={joinCompanyData.inviteToken}
                      onChange={(e) => handleInviteTokenChange(e.target.value)}
                      required
                      disabled={isLoading || loadingInvite || isSubmitting || success}
                    />
                  {loadingInvite && (
                    <p className="text-xs text-muted-foreground">Validating invite...</p>
                  )}
                  {inviteInfo && (
                    <div className="p-3 bg-muted rounded-md text-sm">
                      <p className="font-medium">Invite Details:</p>
                      <p className="text-muted-foreground">Company: {inviteInfo.companyName}</p>
                      <p className="text-muted-foreground">Role: {inviteInfo.role}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinName">Your Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="joinName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-9"
                      value={joinCompanyData.name}
                      onChange={(e) => setJoinCompanyData({ ...joinCompanyData, name: e.target.value })}
                      required
                      disabled={isLoading || isSubmitting || success}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinEmail">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="joinEmail"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      value={joinCompanyData.email}
                      onChange={(e) => setJoinCompanyData({ ...joinCompanyData, email: e.target.value })}
                      required
                      disabled={isLoading || isSubmitting || success}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinPassword">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="joinPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={joinCompanyData.password}
                      onChange={(e) => setJoinCompanyData({ ...joinCompanyData, password: e.target.value })}
                      required
                      minLength={6}
                      disabled={isLoading || isSubmitting || success}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || isSubmitting || success}>
                  {success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Redirecting...
                    </>
                  ) : isSubmitting ? (
                    "Joining..."
                  ) : (
                    "Join Company"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
