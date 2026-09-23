"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { api, ApiError } from "@/lib/api";
import { useAuthStore, type AcceptInvitationBody } from "@/stores/auth.store";
import type { InvitationPreview } from "@/types";
import { getCategoryDef } from "@/lib/restaurant-categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/ui/material-icon";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const INACTIVE_COPY: Record<"expired" | "accepted" | "revoked", { title: string; body: string }> = {
  expired: {
    title: "Esta invitación venció",
    body: "Pedile un link nuevo a quien te la mandó.",
  },
  accepted: {
    title: "Esta invitación ya se usó",
    body: "Si sos quien la aceptó, entrá con tu cuenta para ver tu local.",
  },
  revoked: {
    title: "Esta invitación fue cancelada",
    body: "Pedile un link nuevo a quien te la mandó.",
  },
};

type LoadState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; preview: InvitationPreview };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <header className="border-b border-outline-variant/40">
        <div className="mx-auto flex max-w-xl items-center px-5 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface"
          >
            quiero<span className="text-primary">.menu</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-8 sm:py-12">{children}</main>
    </div>
  );
}

function Notice({ title, body, withLogin }: { title: string; body: string; withLogin?: boolean }) {
  return (
    <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
        {title}
      </h1>
      <p className="mt-2 text-on-surface-variant">{body}</p>
      {withLogin && (
        <Link
          href="/login"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          Entrar a mi cuenta
        </Link>
      )}
    </div>
  );
}

export function InvitationView({ token }: { token: string }) {
  const router = useRouter();
  const acceptInvitation = useAuthStore((s) => s.acceptInvitation);
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(!GOOGLE_CLIENT_ID);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    let cancelled = false;
    api
      .get<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`)
      .then((preview) => {
        if (!cancelled) setState({ kind: "ready", preview });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) setState({ kind: "missing" });
        else setState({ kind: "error", message: "No pudimos abrir la invitación. Probá de nuevo en un rato." });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const accept = async (body: AcceptInvitationBody) => {
    setAccepting(true);
    setError("");
    try {
      await acceptInvitation(token, body);
      router.replace("/dashboard?bienvenida=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos completar la invitación.");
      setAccepting(false);
    }
  };

  if (state.kind === "loading") {
    return (
      <Shell>
        <p className="text-on-surface-variant">Abriendo tu invitación...</p>
      </Shell>
    );
  }
  if (state.kind === "missing") {
    return (
      <Shell>
        <Notice
          title="Este link no existe"
          body="Puede que esté incompleto. Revisá que lo hayas copiado entero o pedí uno nuevo."
        />
      </Shell>
    );
  }
  if (state.kind === "error") {
    return (
      <Shell>
        <Notice title="Algo salió mal" body={state.message} />
      </Shell>
    );
  }

  const { preview } = state;
  if (preview.status !== "active") {
    const copy = INACTIVE_COPY[preview.status];
    return (
      <Shell>
        <Notice title={copy.title} body={copy.body} withLogin={preview.status === "accepted"} />
      </Shell>
    );
  }

  const r = preview.restaurant;
  const category = getCategoryDef(r.category);
  const cover = r.bannerUrl || r.photos[0] || r.logoUrl;
  const facts = [
    r.items > 0 ? `${r.items} platos en ${r.categories} categorías` : null,
    r.hasHours ? "Horarios cargados" : null,
    r.photos.length > 0 ? `${r.photos.length} fotos` : null,
  ].filter(Boolean) as string[];

  const content = (
    <Shell>
      <p className="text-sm font-bold uppercase tracking-wide text-primary">Tu local ya está listo</p>
      <h1 className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface">
        {r.name} ya está en quiero.menu
      </h1>
      <p className="mt-2 text-on-surface-variant">
        Lo armamos con tu menú y los datos del local. Entrá con tu cuenta y queda a tu nombre: lo
        editás cuando quieras, recibís pedidos y ves quién lo visita. Es gratis.
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-outline-variant/40 bg-white">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={r.name} className="h-40 w-full object-cover" />
        ) : null}
        <div className="p-5">
          <div className="flex items-center gap-3">
            {r.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-primary">
                <MaterialIcon name="storefront" size="md" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold text-on-surface">{r.name}</p>
              <p className="text-sm text-on-surface-variant">
                {[category && category.value !== "otro" ? category.label : null, r.city]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          {facts.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {facts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant"
                >
                  <MaterialIcon name="check_circle" size="xs" className="text-primary" />
                  {fact}
                </li>
              ))}
            </ul>
          )}
          <a
            href={`/${r.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            Ver cómo quedó
            <MaterialIcon name="open_in_new" size="xs" />
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-primary/30 bg-primary/5 p-5">
        {preview.emailHint && (
          <p className="mb-3 text-sm text-on-surface-variant">
            Esta invitación es para <span className="font-bold">{preview.emailHint}</span>.
          </p>
        )}
        {error && (
          <div className="mb-3 rounded-xl bg-error-container/30 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        )}

        {GOOGLE_CLIENT_ID && (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(response) => {
                if (response.credential) accept({ kind: "google", credential: response.credential });
              }}
              onError={() => setError("No se pudo entrar con Google. Probá de nuevo.")}
              width="320"
              shape="pill"
              size="large"
              text="continue_with"
            />
          </div>
        )}
        {accepting && (
          <p className="mt-3 text-center text-sm text-on-surface-variant">Preparando tu panel...</p>
        )}

        {!showEmailForm ? (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="mt-4 w-full text-center text-sm font-semibold text-on-surface-variant hover:text-primary"
          >
            Prefiero usar email y contraseña
          </button>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              accept({ kind: "password", ...form });
            }}
          >
            {GOOGLE_CLIENT_ID && (
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-outline-variant/40" />
                <span className="text-xs font-semibold text-on-surface-variant">o con email</span>
                <span className="h-px flex-1 bg-outline-variant/40" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="inv-name" className="ml-1 text-xs font-bold text-on-surface-variant">
                Tu nombre
              </Label>
              <Input
                id="inv-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email" className="ml-1 text-xs font-bold text-on-surface-variant">
                Email
              </Label>
              <Input
                id="inv-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-password" className="ml-1 text-xs font-bold text-on-surface-variant">
                Contraseña (mínimo 8 caracteres)
              </Label>
              <Input
                id="inv-password"
                type="password"
                minLength={8}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={accepting}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {accepting ? "Entrando..." : "Quedarme con mi local"}
            </button>
          </form>
        )}
      </div>
    </Shell>
  );

  return GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
  ) : (
    content
  );
}
