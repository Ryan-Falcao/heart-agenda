import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase processes the recovery hash and emits a session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== senha2) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate({ to: "/" }), 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#F3F4F6]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white px-5 pt-10">
        <h1 className="mb-1 text-xl font-bold text-[#1A1A1A]">Nova senha</h1>
        <p className="mb-6 text-xs text-gray-500">
          Defina uma nova senha para sua conta.
        </p>

        {!ready ? (
          <div className="rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            Abra esta página pelo link enviado no seu e-mail.
          </div>
        ) : success ? (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Senha atualizada! Redirecionando…
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-[#2563EB]">
              <Lock size={16} className="text-gray-400" />
              <input
                type="password"
                placeholder="Nova senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-[#2563EB]">
              <Lock size={16} className="text-gray-400" />
              <input
                type="password"
                placeholder="Confirmar senha"
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </label>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Salvar senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
