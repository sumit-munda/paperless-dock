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
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // Firebase
  // const { signupWithEmailAndPassword, signinWithGoogle, loading } = useAuth();

  // Backend
  const [register, { isLoading }] = useRegisterMutation();

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // const firebaseRes = await signupWithEmailAndPassword(
      //   form.email,
      //   form.password
      // );

      // if (!firebaseRes?.user) {
      //   throw new Error("Firebase signup failed");
      // }

      // await register({
      //   email: firebaseRes.user.email,
      //   firebaseUid: firebaseRes.user.uid,
      // }).unwrap();

      await register(form).unwrap();

      toast.success("Account created successfully 🎉");
      navigate("/login");
    } catch (error: any) {
      console.error(error);

      toast.error(error?.message || "Something went wrong. Please try again.");
    }
  };

  const signinWithGoogleHandler = async () => {
    try {
      // const firebaseRes = await signinWithGoogle();

      // if (!firebaseRes?.user) {
      //   throw new Error("Google sign-in failed");
      // }

      await register(form).unwrap();

      // await register({
      //   email: firebaseRes.user.email,
      //   firebaseUid: firebaseRes.user.uid,
      //   name: firebaseRes.user.displayName,
      //   avatar: firebaseRes.user.photoURL,
      // }).unwrap();

      toast.success("Signed up with Google 🚀");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Google signup failed. Try again");
    }
  };

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
          <Button type="submit" disabled={isLoading} className="w-full" onClick={onSubmitHandler}>
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
