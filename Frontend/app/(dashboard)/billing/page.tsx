"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Download, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  FolderTree,
  Briefcase,
  HardDrive,
  UsersRound,
  Workflow
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { billingAPI } from "@/app/services";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  issueDate: string;
  description?: string;
}

interface PaymentMethod {
  _id: string;
  type: "card" | "bank";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface UsageStat {
  current: number;
  max: number;
  percentage: number;
  currentGB?: number;
  maxGB?: number;
}

interface UsageStats {
  users: UsageStat;
  departments: UsageStat;
  projects: UsageStat;
  storage: UsageStat & { currentGB: number; maxGB: number };
  teams: UsageStat;
  workflows: UsageStat;
}

interface PlanFeatures {
  analytics: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  customBranding: boolean;
  sso: boolean;
  auditLogs: boolean;
  prioritySupport: boolean;
}

interface PlanInfo {
  planName: string;
  limits: {
    maxUsers: number;
    maxDepartments: number;
    maxProjects: number;
    maxStorageGB: number;
    maxTeams: number;
    maxWorkflows: number;
    features: PlanFeatures;
  };
  usage: UsageStats;
  features: PlanFeatures;
}

export default function BillingPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [currentPlan, setCurrentPlan] = useState({
    name: "Free",
    price: 0,
    billingCycle: "monthly",
    features: ["5 users", "Basic features"],
  });

  useEffect(() => {
    if (user) {
      loadBillingData();
    }
  }, [user]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      // Load billing info and plan info in parallel
      const [billingResponse, planResponse] = await Promise.all([
        billingAPI.getBillingInfo().catch(() => ({ data: { data: {} } })),
        billingAPI.getPlanInfo().catch(() => ({ data: { data: null } })),
      ]);

      const billingData = billingResponse.data?.data || billingResponse.data || {};
      const planData = planResponse.data?.data || planResponse.data || null;

      // Set plan info
      if (planData) {
        setPlanInfo(planData);
        const planPrices: Record<string, number> = {
          free: 0,
          starter: 29,
          pro: 99,
          enterprise: 299,
        };
        const planFeaturesList: Record<string, string[]> = {
          free: ['5 users', '2 departments', '5 projects', '1 GB storage'],
          starter: ['25 users', '10 departments', '25 projects', '10 GB storage', 'Analytics', 'API Access'],
          pro: ['100 users', '50 departments', '100 projects', '100 GB storage', 'Advanced Reports', 'Custom Branding'],
          enterprise: ['Unlimited users', 'Unlimited departments', 'Unlimited projects', 'Unlimited storage', 'SSO', 'Priority Support'],
        };
        setCurrentPlan({
          name: planData.planName.charAt(0).toUpperCase() + planData.planName.slice(1),
          price: planPrices[planData.planName] || 0,
          billingCycle: "monthly",
          features: planFeaturesList[planData.planName] || planFeaturesList.free,
        });
      }

      // Set invoices
      if (billingData.invoices) {
        setInvoices((billingData.invoices || []).map((inv: any) => ({
          _id: inv._id,
          invoiceNumber: inv.stripeInvoiceId,
          amount: inv.amount / 100,
          status: inv.status === "paid" ? "paid" : inv.status === "open" ? "pending" : "overdue",
          dueDate: inv.dueDate || inv.createdAt,
          issueDate: inv.createdAt,
          description: "Subscription payment",
        })));
      }
      setPaymentMethods([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load billing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Downloading",
      description: "Invoice download started",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "overdue":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success/10 text-success border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "overdue":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription and payment methods
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Statements
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Your active subscription plan</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {currentPlan.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Monthly Cost</div>
                    <div className="text-3xl font-bold">${currentPlan.price}</div>
                    <div className="text-sm text-muted-foreground">per {currentPlan.billingCycle}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Billing Cycle</div>
                    <div className="text-xl font-semibold capitalize">{currentPlan.billingCycle}</div>
                    <div className="text-sm text-muted-foreground">Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Plan Features</div>
                    <ul className="space-y-1">
                      {currentPlan.features.map((feature, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button onClick={async () => {
                    try {
                      const plansResponse = await billingAPI.getPlans();
                      const plans = plansResponse.data || plansResponse;
                      if (plans.length > 0) {
                        const checkoutResponse = await billingAPI.createCheckoutSession({
                          priceId: plans[0].id,
                        });
                        if (checkoutResponse.data?.url) {
                          window.location.href = checkoutResponse.data.url;
                        }
                      }
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.response?.data?.message || "Failed to create checkout session",
                        variant: "destructive",
                      });
                    }
                  }}>Upgrade Plan</Button>
                  <Button variant="outline" onClick={async () => {
                    if (confirm("Are you sure you want to cancel your subscription?")) {
                      try {
                        await billingAPI.cancelSubscription({ immediately: false });
                        toast({
                          title: "Success",
                          description: "Subscription will be canceled at the end of the billing period",
                        });
                        loadBillingData();
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.response?.data?.message || "Failed to cancel subscription",
                          variant: "destructive",
                        });
                      }
                    }
                  }}>Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="invoices" className="space-y-6">
              <TabsList>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
              </TabsList>

              <TabsContent value="invoices" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>View and download your past invoices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invoices.length === 0 ? (
                      <div className="p-12 text-center">
                        <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No invoices found</p>
                        <p className="text-sm text-muted-foreground">
                          Invoices will appear here once you have billing activity
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {invoices.map((invoice, index) => (
                          <motion.div
                            key={invoice._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Receipt className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{invoice.invoiceNumber}</div>
                                <div className="text-sm text-muted-foreground">
                                  {invoice.description || "Subscription payment"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-bold">${invoice.amount.toLocaleString()}</div>
                                <Badge variant="outline" className={getStatusColor(invoice.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(invoice.status)}
                                    {invoice.status}
                                  </div>
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadInvoice(invoice._id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment-methods" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Manage your payment methods</CardDescription>
                      </div>
                      <Button>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {paymentMethods.length === 0 ? (
                      <div className="p-12 text-center">
                        <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No payment methods found</p>
                        <Button>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethods.map((method, index) => (
                          <motion.div
                            key={method._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <CreditCard className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {method.type === "card" 
                                    ? `${method.brand || "Card"} •••• ${method.last4 || "0000"}`
                                    : "Bank Account"}
                                </div>
                                {method.type === "card" && method.expiryMonth && method.expiryYear && (
                                  <div className="text-sm text-muted-foreground">
                                    Expires {method.expiryMonth}/{method.expiryYear}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {method.isDefault && (
                                <Badge variant="outline">Default</Badge>
                              )}
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                Remove
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="usage" className="space-y-6">
                {planInfo?.usage ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Users */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base">Users</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{planInfo.usage.users.current}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          of {planInfo.usage.users.max === -1 ? 'unlimited' : planInfo.usage.users.max}
                        </div>
                        {planInfo.usage.users.max !== -1 ? (
                          <Progress value={planInfo.usage.users.percentage} className="mt-2" />
                        ) : (
                          <div className="mt-2 flex items-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">No limit</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Departments */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base">Departments</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{planInfo.usage.departments.current}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          of {planInfo.usage.departments.max === -1 ? 'unlimited' : planInfo.usage.departments.max}
                        </div>
                        {planInfo.usage.departments.max !== -1 ? (
                          <Progress value={planInfo.usage.departments.percentage} className="mt-2" />
                        ) : (
                          <div className="mt-2 flex items-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">No limit</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Projects */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base">Projects</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{planInfo.usage.projects.current}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          of {planInfo.usage.projects.max === -1 ? 'unlimited' : planInfo.usage.projects.max}
                        </div>
                        {planInfo.usage.projects.max !== -1 ? (
                          <Progress value={planInfo.usage.projects.percentage} className="mt-2" />
                        ) : (
                          <div className="mt-2 flex items-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">No limit</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Storage */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base">Storage</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{planInfo.usage.storage.currentGB} GB</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          of {planInfo.usage.storage.maxGB === -1 ? 'unlimited' : `${planInfo.usage.storage.maxGB} GB`}
                        </div>
                        {planInfo.usage.storage.maxGB !== -1 ? (
                          <Progress value={planInfo.usage.storage.percentage} className="mt-2" />
                        ) : (
                          <div className="mt-2 flex items-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">No limit</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Teams */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <UsersRound className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base">Teams</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{planInfo.usage.teams.current}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          of {planInfo.usage.teams.max === -1 ? 'unlimited' : planInfo.usage.teams.max}
                        </div>
                        {planInfo.usage.teams.max !== -1 ? (
                          <Progress value={planInfo.usage.teams.percentage} className="mt-2" />
                        ) : (
                          <div className="mt-2 flex items-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">No limit</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Workflows */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Workflow className="w-4 h-4 text-primary" />
                          <CardTitle className="text-base">Workflows</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{planInfo.usage.workflows.current}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          of {planInfo.usage.workflows.max === -1 ? 'unlimited' : planInfo.usage.workflows.max}
                        </div>
                        {planInfo.usage.workflows.max !== -1 ? (
                          <Progress value={planInfo.usage.workflows.percentage} className="mt-2" />
                        ) : (
                          <div className="mt-2 flex items-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">No limit</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <HardDrive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Usage data not available</p>
                    </CardContent>
                  </Card>
                )}

                {/* Features included in current plan */}
                {planInfo?.features && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Features Included</CardTitle>
                      <CardDescription>Features available on your {currentPlan.name} plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        {Object.entries(planInfo.features).map(([feature, enabled]) => (
                          <div key={feature} className="flex items-center gap-2">
                            {enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className={enabled ? '' : 'text-muted-foreground'}>
                              {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  );
}

