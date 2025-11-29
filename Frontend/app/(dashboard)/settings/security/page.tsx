"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  QrCode,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Key,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";

interface MfaStatus {
  enabled: boolean;
  secret?: string;
  recoveryCodes?: string[];
}

export default function SecurityPage() {
  const { toast } = useToast();
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setupStep, setSetupStep] = useState<"none" | "setup" | "verify">("none");
  const [qrCode, setQrCode] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      // Check if MFA is enabled (you may need to add this endpoint)
      // For now, we'll assume it's not enabled if we can't check
      setMfaStatus({ enabled: false });
    } catch (error) {
      setMfaStatus({ enabled: false });
    }
  };

  const handleSetupMfa = async () => {
    try {
      setIsLoading(true);
      const response = await api.post("/auth/mfa/setup");
      const data = response.data?.data || response.data;
      setQrCode(data.qrCode);
      setRecoveryCodes(data.recoveryCodes || []);
      setSetupStep("verify");
      toast({
        title: "MFA Setup Started",
        description: "Scan the QR code with your authenticator app",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to setup MFA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code from your authenticator app",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/auth/mfa/verify", { token: verificationCode });
      if (response.data?.success || response.data?.data?.success) {
        setMfaStatus({ enabled: true, recoveryCodes });
        setSetupStep("none");
        setVerificationCode("");
        toast({
          title: "Success",
          description: "MFA has been enabled successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code from your authenticator app",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/auth/mfa/disable", { token: disableCode });
      setMfaStatus({ enabled: false });
      setDisableCode("");
      toast({
        title: "Success",
        description: "MFA has been disabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to disable MFA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    if (recoveryCodes.length > 0) {
      navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast({
        title: "Copied",
        description: "Recovery codes copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Security Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account security settings</p>
      </motion.div>

      {/* MFA Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Multi-Factor Authentication (MFA)</h2>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          {mfaStatus?.enabled ? (
            <Badge className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Enabled
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="w-4 h-4 mr-1" /> Disabled
            </Badge>
          )}
        </div>

        {!mfaStatus?.enabled ? (
          <div className="space-y-4">
            {setupStep === "none" && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    MFA adds an extra layer of security. You'll need an authenticator app (like
                    Google Authenticator or Authy) to set this up.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleSetupMfa} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Enable MFA
                    </>
                  )}
                </Button>
              </>
            )}

            {setupStep === "verify" && (
              <div className="space-y-4">
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Scan this QR code with your authenticator app, then enter the 6-digit code to
                    complete setup.
                  </AlertDescription>
                </Alert>

                {qrCode && (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="MFA QR Code" className="border rounded-lg" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                {recoveryCodes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Recovery Codes</Label>
                      <Button variant="outline" size="sm" onClick={copyRecoveryCodes}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Save these recovery codes in a safe place. You can use them to access your
                        account if you lose your authenticator device.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-md">
                      {recoveryCodes.map((code, index) => (
                        <code key={index} className="text-sm font-mono">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleVerifyMfa} disabled={isLoading || verificationCode.length !== 6}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Enable"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSetupStep("none");
                      setVerificationCode("");
                      setQrCode("");
                      setRecoveryCodes([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                MFA is currently enabled. You'll need to enter a code from your authenticator app
                when logging in.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="disableCode">Enter Code to Disable MFA</Label>
              <Input
                id="disableCode"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={isLoading || disableCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Disabling...
                </>
              ) : (
                "Disable MFA"
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Additional Security Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Additional Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-muted-foreground">
                Change your account password regularly
              </p>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Active Sessions</h3>
              <p className="text-sm text-muted-foreground">
                View and manage your active sessions
              </p>
            </div>
            <Button variant="outline">Manage Sessions</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

