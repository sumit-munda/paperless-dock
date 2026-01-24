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
import { useAuth } from "@/context/auth.context";
import { useRegisterMutation } from "@/redux/api/authApi";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Register = () => {
  // Local form state for controlled inputs
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // Firebase auth helpers (Google sign-in)
  const { signinWithGoogle, loading: firebaseLoading } = useAuth();

  // Backend registration mutation
  const [register, { isLoading: apiLoading }] = useRegisterMutation();

  // Handles input field updates
  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handles email/password registration flow
  const onSubmitHandler = async (e: FormEvent) => {
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
  const signinWithGoogleHandler = async () => {
    try {
      // Authenticate user with Google via Firebase
      const firebaseRes = await signinWithGoogle();

      if (!firebaseRes?.user) {
        throw new Error("Google authentication failed");
      }

      // Register or sync Google user with backend
       await register({
        email: firebaseRes.user.email,
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

  // Combined loading state to prevent double submits
  const isLoading = apiLoading || firebaseLoading;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <Button variant="unstyled" size="sm" onClick={() => navigate("/")}>
              <img src="./src/assets/logo.png" alt="" className="w-7" />
              <span className="text-start text-[.5rem]/2 ">
                The <br /> Paperless <br /> Dock
              </span>
            </Button>
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

        <CardContent>
          <form id="register-form" onSubmit={onSubmitHandler}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  name="email"
                  value={form.email}
                  onChange={onChangeHandler}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  name="password"
                  value={form.password}
                  onChange={onChangeHandler}
                />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
             form="register-form"
          >
            {isLoading ? "Creating..." : "Create account"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={signinWithGoogleHandler}
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
