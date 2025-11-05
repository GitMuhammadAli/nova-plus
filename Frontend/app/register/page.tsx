"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { register, clearError } from "@/app/store/authSlice";
import { registerCompany } from "@/app/store/companySlice";
import { setUser } from "@/app/store/authSlice";
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

  const isLoading = authLoading || companyLoading;
  const error = validationError || authError || companyError;

  useEffect(() => {
    dispatch(clearError());
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
      router.push("/dashboard");
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
      setValidationError(err.response?.data?.message || "Invalid or expired invite");
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(false);

    if (createCompanyData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return;
    }

    if (!createCompanyData.companyName.trim()) {
      setValidationError("Company name is required");
      return;
    }

    const result = await dispatch(registerCompany({
      companyName: createCompanyData.companyName,
      domain: createCompanyData.domain || undefined,
      adminName: createCompanyData.adminName,
      email: createCompanyData.email,
      password: createCompanyData.password,
    }));

    if (registerCompany.fulfilled.match(result)) {
      setSuccess(true);
      if (result.payload?.admin) {
        dispatch(setUser(result.payload.admin));
      }
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(false);

    if (!joinCompanyData.inviteToken) {
      setValidationError("Invite token is required");
      return;
    }

    if (joinCompanyData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return;
    }

    try {
      const { inviteAPI } = await import("@/app/services");
      const response = await inviteAPI.acceptInvite(joinCompanyData.inviteToken, {
        name: joinCompanyData.name,
        email: joinCompanyData.email,
        password: joinCompanyData.password,
      });

      if (response.data?.user) {
        dispatch(setUser(response.data.user));
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err: any) {
      setValidationError(err.response?.data?.message || "Failed to accept invite");
    }
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
            Create your company workspace or join an existing team. Start managing projects and tasks in minutes.
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
              Create your account
            </h2>
            <p className="mt-2 text-muted-foreground">
              Already have an account?{" "}
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
                {activeTab === "create" 
                  ? "Company registered successfully! Redirecting..." 
                  : "Invite accepted! Redirecting to dashboard..."}
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

          {/* Tabs for Create/Join */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Building2 className="w-4 h-4 mr-2" />
                Create Company
              </TabsTrigger>
              <TabsTrigger value="join">
                <Users className="w-4 h-4 mr-2" />
                Join Company
              </TabsTrigger>
            </TabsList>

            {/* Create Company Tab */}
            <TabsContent value="create" className="space-y-4 mt-6">
              <form onSubmit={handleCreateCompany} className="space-y-4">
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
                      value={createCompanyData.companyName}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, companyName: e.target.value })}
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
                      value={createCompanyData.domain}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, domain: e.target.value })}
                      disabled={isLoading || success}
                    />
                  </div>
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
                      value={createCompanyData.adminName}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, adminName: e.target.value })}
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
                      value={createCompanyData.email}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, email: e.target.value })}
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
                      value={createCompanyData.password}
                      onChange={(e) => setCreateCompanyData({ ...createCompanyData, password: e.target.value })}
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
                      Creating company...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Registered!
                    </>
                  ) : (
                    "Create company"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Join Company Tab */}
            <TabsContent value="join" className="space-y-4 mt-6">
              <form onSubmit={handleJoinCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteToken">Invite token or link</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="inviteToken"
                      name="inviteToken"
                      type="text"
                      placeholder="Paste invite link or token"
                      className="pl-9"
                      value={joinCompanyData.inviteToken}
                      onChange={(e) => {
                        const token = e.target.value.includes('/invite/') 
                          ? e.target.value.split('/invite/')[1] 
                          : e.target.value;
                        handleInviteTokenChange(token);
                      }}
                      required
                      disabled={isLoading || success || loadingInvite}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the invite token or paste the full invite link
                  </p>
                </div>

                {loadingInvite && (
                  <div className="text-sm text-muted-foreground">Validating invite...</div>
                )}

                {inviteInfo && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold">Invite to {inviteInfo.company?.name || 'company'}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Role: {inviteInfo.role}
                        {inviteInfo.email && ` • Email: ${inviteInfo.email}`}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="joinName">Your name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="joinName"
                      name="joinName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-9"
                      value={joinCompanyData.name}
                      onChange={(e) => setJoinCompanyData({ ...joinCompanyData, name: e.target.value })}
                      required
                      disabled={isLoading || success}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinEmail">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="joinEmail"
                      name="joinEmail"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-9"
                      value={joinCompanyData.email}
                      onChange={(e) => setJoinCompanyData({ ...joinCompanyData, email: e.target.value })}
                      required
                      disabled={isLoading || success || (inviteInfo?.email !== undefined)}
                    />
                  </div>
                  {inviteInfo?.email && (
                    <p className="text-xs text-muted-foreground">
                      This invite is for: {inviteInfo.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="joinPassword"
                      name="joinPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={joinCompanyData.password}
                      onChange={(e) => setJoinCompanyData({ ...joinCompanyData, password: e.target.value })}
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
                  disabled={isLoading || success || !inviteInfo}
                >
                  {isLoading ? (
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
                    "Join company"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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
