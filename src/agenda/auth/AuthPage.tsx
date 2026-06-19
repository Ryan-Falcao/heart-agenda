import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, ImagePlus, Loader2, Lock, Mail, User } from "lucide-react";
import { useAuth } from "./AuthContext";

type Mode = "login" | "signup" | "forgot";

const todayMinusYears = (y: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - y);
  return d;
};

export const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // shared
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // signup
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setInfo(null);
  };

  const validateSignup = (): string | null => {
    if (!nome.trim()) return "Informe seu nome.";
    if (!sobrenome.trim()) return "Informe seu sobrenome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Informe um e-mail válido.";
    if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    if (!dataNascimento) return "Informe sua data de nascimento.";
    const min = todayMinusYears(13);
    if (new Date(dataNascimento) > min)
      return "Você deve ter pelo menos 13 anos.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      if (mode === "login") {
        const r = await signIn(email, senha);
        if (r.error) setError(r.error);
        else navigate({ to: "/" });
      } else if (mode === "signup") {
        const v = validateSignup();
        if (v) {
          setError(v);
          return;
        }
        const r = await signUp({
          nome,
          sobrenome,
          email,
          senha,
          dataNascimento,
          avatarFile,
        });
        if (r.error) setError(r.error);
        else navigate({ to: "/" });
      } else {
        if (!email) {
          setError("Informe seu e-mail.");
          return;
        }
        const r = await resetPassword(email);
        if (r.error) setError(r.error);
        else setInfo("Enviamos um link de recuperação para seu e-mail.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onAvatarChange = (f: File | null) => {
    setAvatarFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else setAvatarPreview(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#F3F4F6]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white px-5 pb-10 pt-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] text-white">
            <Calendar size={26} />
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Agenda Digital</h1>
          <p className="mt-1 text-xs text-gray-500">
            {mode === "login" && "Acesse sua conta"}
            {mode === "signup" && "Crie sua conta"}
            {mode === "forgot" && "Recuperar senha"}
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                reset();
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-[#2563EB] shadow-sm" : "text-gray-600"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                reset();
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === "signup" ? "bg-white text-[#2563EB] shadow-sm" : "text-gray-600"
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <div className="flex justify-center">
                <label className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus size={22} className="text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field
                  icon={User}
                  placeholder="Nome"
                  value={nome}
                  onChange={setNome}
                />
                <Field
                  icon={User}
                  placeholder="Sobrenome"
                  value={sobrenome}
                  onChange={setSobrenome}
                />
              </div>
              <Field
                icon={Calendar}
                type="date"
                placeholder="Data de nascimento"
                value={dataNascimento}
                onChange={setDataNascimento}
              />
            </>
          )}

          <Field
            icon={Mail}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
          />

          {mode !== "forgot" && (
            <Field
              icon={Lock}
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={setSenha}
            />
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login" && "Entrar"}
            {mode === "signup" && "Criar conta"}
            {mode === "forgot" && "Enviar link"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                reset();
              }}
              className="w-full text-center text-xs font-medium text-[#2563EB]"
            >
              Esqueci minha senha
            </button>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                reset();
              }}
              className="w-full text-center text-xs font-medium text-[#2563EB]"
            >
              Voltar para o login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

const Field = ({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 focus-within:border-[#2563EB]">
    <Icon size={16} className="text-gray-400" />
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-sm text-[#1A1A1A] outline-none placeholder:text-gray-400"
    />
  </label>
);
