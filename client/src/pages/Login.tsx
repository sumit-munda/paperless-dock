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
import { useLoginGoogleMutation, useLoginMutation } from "@/redux/api/authApi";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  // Local state for controlled form inputs
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // Firebase auth helpers (Google sign-in)
  const { signinWithGoogle, loading: firebaseLoading } = useAuth();

  // Backend login mutations
  const [login, { isLoading: apiLoading }] = useLoginMutation();
  const [loginGoogle] = useLoginGoogleMutation();

  // Updates form fields on input change
  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handles email/password login flow
  const onSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // Authenticate user via backend
      const res = await login({
        email: form.email,
        password: form.password,
      }).unwrap();

      console.log(res);

      // Ensure backend returned a valid user
      if (!res?.user || !res?.token) {
        throw new Error("Login failed");
      }

      // Persist auth token for session handling
      localStorage.setItem("token", res.token);

      toast.success("Sign-in successful 🚀");
      navigate("/"); // redirect to protected/home route
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again.",
      );
    }
  };

  // Handles Google login using Firebase + backend sync
  const signinWithGoogleHandler = async () => {
    try {
      // Authenticate user with Google via Firebase
      const firebaseRes = await signinWithGoogle();

      if (!firebaseRes?.user) {
        throw new Error("Google sign-in failed");
      }

      // Login or sync Google user with backend
      const res = await loginGoogle({
        email: firebaseRes.user.email!,
        googleId: firebaseRes.user.uid,
        name: firebaseRes.user.displayName || undefined,
        photo: firebaseRes.user.photoURL || undefined,
      }).unwrap();

      if (!res?.token) {
        throw new Error("Backend Google login failed");
      }

      // Persist auth token for protected routes
      localStorage.setItem("token", res.token);

      toast.success("Signed in with Google 🚀");
      navigate("/");
    } catch (error: any) {
      console.error("GOOGLE LOGIN ERROR:", error);

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Google sign-in failed. Try again",
      );
    }
  };

  // Combined loading state to prevent duplicate actions
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
            Enter your email below to login to your account
          </CardDescription>

          <CardAction>
            <Button variant="link" onClick={() => navigate("/register")}>
              Create
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmitHandler}>
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
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
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
            className="w-full"
            disabled={isLoading}
            onClick={onSubmitHandler}
          >
            Login
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={signinWithGoogleHandler}
            disabled={isLoading}
          >
            Login with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
