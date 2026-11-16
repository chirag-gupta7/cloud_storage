import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "../../services/authApi.js";
import { ping } from "../../services/healthApi.js";
import { getErrorMessage } from "../../services/apiClient.js";
import { useToast } from "../../state/toast.jsx";
import { Button } from "../components/Button.jsx";
import { TextInput } from "../components/TextInput.jsx";

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => register({ email, password }),
    onSuccess: () => {
      toast.success("Account created", "You can now sign in.");
      navigate("/login", { replace: true });
    },
    onError: (err) => toast.error("Registration failed", getErrorMessage(err)),
  });

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Create account</div>
          <div className="mt-1 text-sm text-slate-600">Register with email + password.</div>

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
              <TextInput value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required />
            </div>
            <Button className="w-full justify-center" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Creating…" : "Create account"}
            </Button>
          </form>

          <div className="mt-3">
            <button
              className="text-xs text-slate-500 underline"
              type="button"
              onClick={async () => {
                try {
                  await ping();
                  toast.success("Connected", "");
                } catch (e) {
                  toast.error("Connection failed", getErrorMessage(e));
                }
              }}
            >
              Test connection
            </button>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-medium text-slate-900 hover:underline" to="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
