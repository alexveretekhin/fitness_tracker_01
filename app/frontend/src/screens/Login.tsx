import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { errorText, useAuthConfig, useLogin, useLoginGoogle, useRegister } from "../api";
import { GoogleButton } from "../components/GoogleButton";

type Mode = "login" | "register";

// Вход и регистрация на одном экране, переключатель сверху.
// После регистрации сразу выбор аватара, после входа главная.
export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const register = useRegister();
  const google = useLoginGoogle();
  const googleId = useAuthConfig().data?.google_client_id;
  const active = mode === "login" ? login : register;
  const error = google.isError ? google.error : active.isError ? active.error : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      // Стандарт OAuth2: почта едет в поле username
      login.mutate(
        { body: { username: email, password } },
        { onSuccess: () => navigate({ to: "/home", replace: true }) },
      );
    } else {
      register.mutate(
        { body: { email, password } },
        { onSuccess: () => navigate({ to: "/avatar", replace: true }) },
      );
    }
  }

  function switchTo(next: Mode) {
    setMode(next);
    login.reset();
    register.reset();
    google.reset();
  }

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto px-6 pt-12">
      <img
        src="/images/splash/skull-red.webp"
        alt=""
        className="size-32 rounded-full object-cover"
      />
      <h1 className="mt-4 text-2xl text-accent-soft">Fitness Tracker</h1>

      <div className="mt-8 flex w-full max-w-xs rounded-row border border-border bg-surface p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => switchTo(m)}
            className="relative h-9 flex-1 text-sm"
          >
            {mode === m && (
              <motion.span
                layoutId="auth-tab"
                className="absolute inset-0 rounded-[8px] bg-surface-strong"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className={`relative ${mode === m ? "text-text" : "text-text-muted"}`}>
              {m === "login" ? "Вход" : "Регистрация"}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex w-full max-w-xs flex-col gap-2">
        <Field label="Почта" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <Field
          label="Пароль"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={setPassword}
        />
        {mode === "register" && (
          <p className="px-1 text-[11px] text-text-faint">Пароль не короче 8 символов</p>
        )}

        <p className="min-h-5 px-1 text-sm text-weekend" role="alert">
          {error ? errorText(error) : ""}
        </p>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          disabled={active.isPending || !email || !password}
          className="h-11 rounded-row bg-accent font-bold text-bg disabled:opacity-50"
        >
          {active.isPending ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </motion.button>
      </form>

      {googleId && (
        <div className="mt-6 flex w-full max-w-xs flex-col items-center gap-4">
          <div className="flex w-full items-center gap-3 text-xs text-text-faint">
            <span className="h-px flex-1 bg-border" />
            или
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton
            clientId={googleId}
            onCredential={(credential) =>
              // Новый аккаунт без аватара главная сама отправит выбирать его
              google.mutate(
                { body: { credential } },
                { onSuccess: () => navigate({ to: "/home", replace: true }) },
              )
            }
          />
        </div>
      )}
    </div>
  );
}

type FieldProps = {
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
};

function Field({ label, type, autoComplete, value, onChange }: FieldProps) {
  return (
    <label className="flex h-tap items-center rounded-row border border-border bg-surface px-3 focus-within:border-accent">
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        required
        className="w-full bg-transparent outline-none placeholder:text-text-faint"
      />
    </label>
  );
}
