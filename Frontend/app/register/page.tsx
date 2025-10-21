import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            N
          </div>
          <span className="text-2xl font-bold text-foreground">NovaPulse</span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create account</h1>
          <p className="text-muted-foreground mb-8">Join NovaPulse to get started</p>

          <RegisterForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">© 2025 NovaPulse. All rights reserved.</p>
      </div>
    </div>
  )
}
