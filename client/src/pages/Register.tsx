import Logo from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useLoginGoogleMutation,
  useRegisterMutation,
} from "@/redux/api/authApi";
import { signinWithGoogle } from "@/services/auth.service";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// pages/Register.tsx
// Register page
// Handles email/password registration and Google signup

const Register = () => {
  // Local form state for controlled inputs
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // RTK Query mutation
  const [register, { isLoading }] = useRegisterMutation();
  const [loginGoogle] = useLoginGoogleMutation();

  // Handles input field updates
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handles email/password registration flow
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // Send credentials to backend for registration
      await register({
        email: form.email,
        password: form.password,
      }).unwrap();

      // Confirms backend auth flow is working
      toast.success("Account created successfully 🎉 Please log in");
      navigate("/login");
    } catch (error: any) {
      console.error("REGISTER ERROR:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again.",
      );
    }
  };

  // Handles Google sign-up using Firebase + backend sync
  const handleGoogleSignup = async () => {
    try {
      // Authenticate user with Google via Firebase
      const firebaseRes = await signinWithGoogle();

      if (!firebaseRes?.user) {
        throw new Error("Google authentication failed");
      }

      // Register or sync Google user with backend
      await loginGoogle({
        email: firebaseRes.user.email!,
        googleId: firebaseRes.user.uid,
        name: firebaseRes.user.displayName || undefined,
        photo: firebaseRes.user.photoURL || undefined,
      }).unwrap();

      // Confirms Firebase → Backend auth pipeline works
      toast.success("Signed up with Google 🚀");
      navigate("/");
    } catch (error: any) {
      console.error("GOOGLE SIGNUP ERROR:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Google signup failed. Try again",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        {/* Card Header: Logo + description */}
        <CardHeader>
          <CardTitle>
            <Logo className="p-0" onClick={() => navigate("/")} />
          </CardTitle>

          <CardDescription>
            Enter your email below to create your account
          </CardDescription>

          <CardAction>
            <Button variant="link" onClick={() => navigate("/login")}>
              Login
            </Button>
          </CardAction>
        </CardHeader>

        {/* Card Content: Registration form */}
        <CardContent>
          <form id="register-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Email field */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password field */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          </form>
        </CardContent>

        {/* Card Footer: Submit buttons */}
        <CardFooter className="flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full"
            form="register-form"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create account"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            Continue with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
