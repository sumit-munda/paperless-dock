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
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { signinWithEmailAndPassword, signinWithGoogle, loading } = useAuth();

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();
    const res = await signinWithEmailAndPassword(form.email, form.password);
    console.log(res);

    navigate("/");
  };

  const signinWithGoogleHandler = async () => {
    const res = await signinWithGoogle();
    console.log(res);

    navigate("/");
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
          <Button type="submit" className="w-full" disabled={loading} onClick={onSubmitHandler}>
            Login
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={signinWithGoogleHandler}
            disabled={loading}
          >
            Login with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
