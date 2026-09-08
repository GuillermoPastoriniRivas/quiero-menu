"use client";

import { useState } from "react";
import { getApiBase } from "@/lib/storefront-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaterialIcon } from "@/components/ui/material-icon";

type Status = "idle" | "sending" | "success" | "error";

export function ClaimForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch(
        `${getApiBase()}/storefront/${encodeURIComponent(slug)}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, message }),
        },
      );
      if (res.status === 409) {
        setError("Este local ya tiene dueño. Si sos del local, escribinos.");
        setStatus("error");
        return;
      }
      if (res.status === 404) {
        setError("No encontramos ese local.");
        setStatus("error");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
    } catch {
      setError("No pudimos enviar tu pedido. Probá de nuevo en un rato.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-600/20 bg-green-600/10 p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600/15 text-green-700">
          <MaterialIcon name="check" size="lg" />
        </span>
        <p className="mt-3 font-bold text-on-surface">¡Pedido recibido!</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Te vamos a escribir por WhatsApp al {phone} para verificar que sos
          del local. Después te llega el acceso por email.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6"
    >
      {error && (
        <div className="rounded-xl bg-error-container/30 px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="claim-name">Tu nombre</Label>
        <Input
          id="claim-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cómo te llamás"
          required
          maxLength={120}
          autoComplete="name"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="claim-phone">Tu WhatsApp</Label>
          <Input
            id="claim-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 9 ..."
            required
            maxLength={30}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="claim-email">Tu email</Label>
          <Input
            id="claim-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@mail.com"
            required
            maxLength={120}
            autoComplete="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="claim-message">
          Algo que nos ayude a verificarte{" "}
          <span className="font-normal text-on-surface-variant">(opcional)</span>
        </Label>
        <Textarea
          id="claim-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ej: soy el encargado, el teléfono del local es el mío..."
          rows={3}
          maxLength={500}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={status === "sending"}
        className="w-full sm:w-auto"
      >
        {status === "sending" ? "Enviando..." : "Pedir mi cuenta gratis"}
      </Button>
    </form>
  );
}
