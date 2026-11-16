import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../services/authApi.js";
import { getErrorMessage } from "../../services/apiClient.js";
import { useAuth } from "../../state/auth.jsx";
import { useToast } from "../../state/toast.jsx";
import { Button } from "../components/Button.jsx";
import { TextInput } from "../components/TextInput.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: (data) => {
      setToken(data.access_token);
      toast.success("Signed in", "");
      const to = location.state?.from || "/app/drive";
      navigate(to, { replace: true });
    },
    onError: (err) => toast.error("Login failed", getErrorMessage(err)),
  });

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Sign in</div>
          <div className="mt-1 text-sm text-slate-600">Use your account to access your drive.</div>

          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="space-y-1">
              <div className="text-sm text-slate-700">Email</div>
              <TextInput value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required />
            </div>
            <div className="space-y-1">
              <div className="text-sm text-slate-700">Password</div>
              <TextInput value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
            </div>
            <Button className="w-full justify-center" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-slate-600">
            New here?{" "}
            <Link className="font-medium text-slate-900 hover:underline" to="/register">
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">Use your email and password to sign in.</div>
      </div>
    </div>
  );
}
