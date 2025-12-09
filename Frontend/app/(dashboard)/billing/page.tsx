"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Receipt
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

export default function BillingPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentPlan, setCurrentPlan] = useState({
    name: "Professional",
    price: 99,
    billingCycle: "monthly",
    features: ["Unlimited users", "Advanced analytics", "Priority support"],
  });

  useEffect(() => {
    if (user) {
      loadBillingData();
    }
  }, [user]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const response = await billingAPI.getBillingInfo();
      const data = response.data || response;
      if (data.subscription) {
        setCurrentPlan({
          name: data.subscription.planName || "Professional",
          price: 99,
          billingCycle: "monthly",
          features: ["Unlimited users", "Advanced analytics", "Priority support"],
        });
      }
      setInvoices((data.invoices || []).map((inv: any) => ({
        _id: inv._id,
        invoiceNumber: inv.stripeInvoiceId,
        amount: inv.amount / 100, // Convert from cents
        status: inv.status === "paid" ? "paid" : inv.status === "open" ? "pending" : "overdue",
        dueDate: inv.dueDate || inv.createdAt,
        issueDate: inv.createdAt,
        description: "Subscription payment",
      })));
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
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">API Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">12,345</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        of 50,000 this month
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "25%" }} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Storage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">2.5 GB</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        of 10 GB used
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success" style={{ width: "25%" }} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">25</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        of unlimited
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-success">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">No limit</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  );
}

