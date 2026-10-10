"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RestaurantFilter } from "./restaurant-filter";
import { api } from "@/lib/api";
import type { BehaviorReport } from "@/types/behavior";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/ui/material-icon";

const LABELS: Record<string, string> = {
  storefront_view: "Menú consultado",
  item_add: "Producto agregado",
  checkout_start: "Pedido iniciado",
  order_created: "Pedido creado",
  direct: "Directo",
  qr: "QR",
  ig: "Instagram",
  wa: "WhatsApp",
  dir: "Directorio",
  powered: "Marca quiero.menu",
  google: "Google",
  campaign: "Campaña",
  referral: "Sitio externo",
  unknown: "Sin atribución",
  diner: "Comensal",
  acquisition: "Adquisición",
  owner: "Panel",
  mobile: "Celular",
  desktop: "Computadora",
  tablet: "Tablet",
};
const label = (key: string) => LABELS[key] ?? key.replaceAll("_", " ");
const rate = (value: number, eligible: number) =>
  eligible
    ? `${value}/${eligible} · ${((value / eligible) * 100).toFixed(0)}%`
    : "Esperando completar la ventana";
const date = (value?: string) =>
  value ? new Date(value).toLocaleDateString("es-AR") : "—";

export function BehaviorDashboard({ admin = false }: { admin?: boolean }) {
  const [days, setDays] = useState(30);
  const [restaurantId, setRestaurantId] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: BehaviorReport;
    error?: string;
  } | null>(null);
  const key = `${days}:${restaurantId}:${refresh}`;
  useEffect(() => {
    let cancelled = false;
    const endpoint = admin ? "/behavior/admin/overview" : "/behavior/overview";
    const filter =
      admin && restaurantId
        ? `&restaurantId=${encodeURIComponent(restaurantId)}`
        : "";
    api
      .get<BehaviorReport>(`${endpoint}?days=${days}${filter}`)
      .then((data) => {
        if (!cancelled) {
          setResult({ key, data });
        }
      })
      .catch(() => {
        if (!cancelled)
          setResult({
            key,
            error: "No se pudo cargar el análisis. Podés reintentar.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [admin, days, restaurantId, key]);
  const current = result?.key === key ? result : null;
  const data = current?.data;
  const adoption = data?.owners.funnel[0];
  const visits = data?.dinerFunnel[0]?.count ?? 0;
  const orderedSessions =
    data?.dinerFunnel.find((step) => step.event === "order_created")?.count ??
    0;
  const conversion = visits
    ? `${((orderedSessions / visits) * 100).toFixed(1)}%`
    : "—";

  return (
    <div className="space-y-6 [&_[data-slot=card]]:p-4 [&_[data-slot=card-header]]:px-0 [&_[data-slot=card-content]]:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold font-[family-name:var(--font-heading)]">
            {admin ? "Comportamiento" : "Resultados de tu menú"}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {admin
              ? "Origen, pedidos, adopción de locales y recompra."
              : "Conocé qué funciona y encontrá tu próximo paso."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((range) => (
            <Button
              key={range}
              size="sm"
              variant={days === range ? "default" : "outline"}
              aria-pressed={days === range}
              onClick={() => setDays(range)}
            >
              {range} días
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefresh((n) => n + 1)}
            aria-label="Actualizar datos"
          >
            <MaterialIcon name="refresh" size="sm" />
          </Button>
        </div>
      </div>
      {admin && (
        <RestaurantFilter
          value={restaurantId}
          onChange={setRestaurantId}
          known={(result?.data?.owners.accounts ?? []).map((account) => ({
            id: account.restaurantId,
            name: account.name ?? account.slug ?? "Local",
          }))}
        />
      )}
      {!current ? (
        <div role="status" className="py-16 text-center">
          <span className="sr-only">Cargando resultados…</span>
          <MaterialIcon
            name="progress_activity"
            size="xl"
            className="animate-spin text-primary"
          />
        </div>
      ) : current.error ? (
        <div role="alert" className="rounded-xl bg-error-container/30 p-4">
          <p>{current.error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setRefresh((n) => n + 1)}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        data && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Visitas al menú", visits],
                ["Pedidos recibidos", data.orders.orders],
                ["Conversión del menú", conversion],
                [
                  "Entregados · últimos 7 días",
                  data.orders.completedLast7 ?? 0,
                ],
              ].map(([title, value]) => (
                <Card key={title}>
                  <CardContent className="p-0">
                    <p className="text-xs text-on-surface-variant">{title}</p>
                    <p className="mt-2 text-3xl font-extrabold">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </section>
            <p className="text-xs text-on-surface-variant">
              La conversión usa visitas y pedidos de la misma sesión con
              medición habilitada. Los pedidos recibidos incluyen todos los
              pedidos del menú.
            </p>
            {!admin && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>Tu próximo paso</CardTitle>
                  <CardDescription>
                    {visits === 0
                      ? "Compartí tu menú para empezar a recibir visitas."
                      : data.checkoutDropoff > 0
                        ? `${data.checkoutDropoff} visitas iniciaron un pedido y no lo terminaron. Revisá precios, opciones y formas de entrega.`
                        : orderedSessions === 0
                          ? "Ya recibís visitas. Revisá que tus productos tengan precios claros, fotos y opciones fáciles de elegir."
                          : "Tu menú ya recibe pedidos. Mantenelo actualizado y volvé a compartirlo para atraer más clientes."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    render={
                      <Link
                        href={visits === 0 ? "/mi-menu?tab=compartir" : "/menu"}
                      />
                    }
                    nativeButton={false}
                  >
                    {visits === 0 ? "Compartir mi menú" : "Revisar mi menú"}
                  </Button>
                  <Button
                    variant="outline"
                    render={<Link href="/orders" />}
                    nativeButton={false}
                  >
                    Ver pedidos
                  </Button>
                </CardContent>
              </Card>
            )}
            <div className={`grid gap-6 ${admin ? "lg:grid-cols-2" : ""}`}>
              <Card>
                <CardHeader>
                  <CardTitle>De la visita al pedido</CardTitle>
                  <CardDescription>
                    Cuántas visitas avanzan en cada paso. El porcentaje compara
                    con el paso anterior.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.dinerFunnel.map((step) => (
                    <div key={step.event}>
                      <div className="mb-1 flex justify-between gap-2 text-sm">
                        <span>{label(step.event)}</span>
                        <strong>
                          {step.count}{" "}
                          {step.fromPrevious !== null &&
                            `· ${step.fromPrevious.toFixed(1)}%`}
                        </strong>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-surface-container">
                        <div
                          className="h-full rounded bg-primary"
                          style={{
                            width: `${data.dinerFunnel[0].count ? (step.count / data.dinerFunnel[0].count) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-on-surface-variant">
                    {data.checkoutDropoff} visitas iniciaron un pedido y no lo
                    terminaron y llevan más de 30 minutos sin pasos del embudo.
                    Es abandono probable, no una confirmación del motivo.
                  </p>
                </CardContent>
              </Card>
              {admin && (
                <Card>
                  <CardHeader>
                    <CardTitle>Adopción del local</CardTitle>
                    <CardDescription>
                      Cuentas registradas en el período. Hitos independientes,
                      no porcentajes entre pasos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(
                      [
                        ["Registro", adoption?.registered],
                        ["Email verificado", adoption?.verified],
                        [
                          "Menú con al menos 5 productos visibles",
                          adoption?.menu,
                        ],
                        ["Link copiado/compartido", adoption?.shared],
                        ["Primer pedido no cancelado", adoption?.firstOrder],
                        ["Suscripción autorizada", adoption?.subscribed],
                        ["Cobro exitoso confirmado", adoption?.paid],
                      ] as const
                    ).map(([title, count]) => (
                      <div
                        key={title}
                        className="flex justify-between gap-2 rounded-lg bg-surface-container-low p-3 text-sm"
                      >
                        <span>{title}</span>
                        <strong>{count ?? 0}</strong>
                      </div>
                    ))}
                    <p className="text-xs text-on-surface-variant">
                      Compartir es una acción observada en la app, no prueba de
                      distribución efectiva. Una suscripción autorizada puede
                      estar en prueba: no equivale a un pago.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Conversión por origen del menú</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-on-surface-variant">
                      <th className="p-2">Origen</th>
                      <th>Visitas</th>
                      <th>Agregó</th>
                      <th>Inició pedido</th>
                      <th>Pedido</th>
                      <th>Conversión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byChannel.map(({ channel, stages }) => (
                      <tr
                        key={channel}
                        className="border-t border-outline-variant/20"
                      >
                        <td className="p-2">{label(channel)}</td>
                        {stages.map((step) => (
                          <td key={step.event}>{step.count}</td>
                        ))}
                        <td>
                          {stages[0].count
                            ? `${((stages[3].count / stages[0].count) * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.byChannel.length && (
                  <p className="py-4 text-on-surface-variant">
                    Todavía no hay sesiones registradas.
                  </p>
                )}
              </CardContent>
            </Card>
            {admin && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Activación y retención por cohorte de alta
                  </CardTitle>
                  <CardDescription>
                    Últimos 180 días de altas instrumentadas. Activación: 5
                    pedidos no cancelados en 14 días. Retención de uso de
                    pedidos: al menos uno en la última semana de la ventana
                    D30/D60/D90. No representa la retención de locales que usan
                    solo carta QR.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-on-surface-variant">
                        <th className="p-2">Alta</th>
                        <th>Locales</th>
                        <th>Activación D14</th>
                        <th>Retención D30</th>
                        <th>D60</th>
                        <th>D90</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.owners.cohorts.map((cohort) => (
                        <tr
                          key={cohort._id}
                          className="border-t border-outline-variant/20"
                        >
                          <td className="p-2">{cohort._id}</td>
                          <td>{cohort.accounts}</td>
                          <td>{rate(cohort.activated14, cohort.eligible14)}</td>
                          <td>{rate(cohort.retained30, cohort.eligible30)}</td>
                          <td>{rate(cohort.retained60, cohort.eligible60)}</td>
                          <td>{rate(cohort.retained90, cohort.eligible90)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!data.owners.cohorts.length && (
                    <p className="py-4 text-on-surface-variant">
                      Las cohortes se formarán con las nuevas altas. No se
                      reconstruyen acciones históricas que no se midieron.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Recompra de comensales</CardTitle>
                <CardDescription>
                  Clientes cuyo primer pedido entregado fue en los últimos{" "}
                  {data.customerCohortDays ?? 90} días, independiente del filtro
                  de actividad. La recompra mide si volvieron a pedir dentro de
                  los primeros 30 días; solo cuenta clientes que ya completaron
                  esa ventana.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.customerCohorts.map((cohort) => (
                  <div
                    key={cohort._id}
                    className="flex flex-wrap justify-between gap-2 rounded-lg bg-surface-container-low p-3 text-sm"
                  >
                    <span>
                      {cohort._id} · {cohort.customers} clientes nuevos
                    </span>
                    <strong>
                      {rate(cohort.repeated30, cohort.eligible30)}
                    </strong>
                  </div>
                ))}
                {!data.customerCohorts.length && (
                  <p className="text-sm text-on-surface-variant">
                    Todavía no hay primeros pedidos entregados en los últimos 90
                    días.
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Productos: interés y carrito</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.products.map((product) => (
                    <div
                      key={`${product.restaurantId}:${product.itemId}`}
                      className="flex justify-between gap-2 text-sm"
                    >
                      <span>{product.name ?? "Producto eliminado"}</span>
                      <strong>
                        {product.views} vistas · {product.adds} agregados
                      </strong>
                    </div>
                  ))}
                  {!data.products.length && (
                    <p className="text-sm text-on-surface-variant">
                      Todavía no hay interacciones con productos.
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Demanda de búsqueda</CardTitle>
                  <CardDescription>
                    Consultas tras pausa al escribir. Las que parecen datos
                    personales se descartan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.searches.map((search) => (
                    <div key={JSON.stringify(search._id)} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span>{search._id.query}</span>
                        <strong>
                          {search.count} búsquedas · {search.zeroResults} sin
                          resultado
                        </strong>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {search._id.scope === "directory_search"
                          ? "Directorio"
                          : "Menú"}
                        {search._id.city && ` · ${search._id.city}`}
                      </p>
                    </div>
                  ))}
                  {!data.searches.length && (
                    <p className="text-sm text-on-surface-variant">
                      Sin búsquedas registradas.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            {admin && (
              <Card>
                <CardHeader>
                  <CardTitle>Nuevos locales y seguimiento</CardTitle>
                  <CardDescription>
                    Últimas 100 altas instrumentadas; el estado describe datos
                    observados, no churn confirmado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.owners.accounts.map((account) => {
                    const age =
                      (Date.parse(data.until) -
                        Date.parse(account.first.owner_signup)) /
                      86_400_000;
                    const next = !account.first.menu_loaded
                      ? "Menú incompleto"
                      : !account.first.link_shared
                        ? "Falta compartir"
                        : !account.firstOrderAt && age > 7
                          ? "Sin primer pedido después de 7 días"
                          : !account.firstOrderAt
                            ? "Esperando primer pedido"
                            : "Primer valor observado";
                    return (
                      <div
                        key={account.restaurantId}
                        className="rounded-xl bg-surface-container-low p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link
                            className="font-bold text-primary"
                            href={`/admin/locales/${account.restaurantId}`}
                          >
                            {account.name ?? account.slug ?? "Local"}
                          </Link>
                          <span>{next}</span>
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Alta {date(account.first.owner_signup)} · Origen{" "}
                          {label(account.acquisitionChannel ?? "unknown")} ·
                          Última actividad del panel{" "}
                          {date(account.lastActiveAt)} · Primer pedido{" "}
                          {date(account.firstOrderAt)}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-xs font-bold text-primary"
                          onClick={() => setRestaurantId(account.restaurantId)}
                        >
                          Analizar este local
                        </button>
                      </div>
                    );
                  })}
                  {!data.owners.accounts.length && (
                    <p className="text-sm text-on-surface-variant">
                      Todavía no hay nuevas altas instrumentadas.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            <details className="rounded-2xl border border-outline-variant/20 p-4">
              <summary className="cursor-pointer text-sm font-semibold">
                Detalles de medición
              </summary>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-primary/5 p-4 text-sm text-on-surface-variant">
                  Datos instrumentados desde{" "}
                  {date(data.totals.coverage[0]?.earliest)}. Eventos
                  individuales: {data.rawRetentionDays} días; conteos diarios
                  agregados: historial conservado. Fechas en {data.timezone}.
                  <br />
                  El embudo conecta pasos en orden dentro de la misma sesión y
                  local. Los pedidos y cobros provienen del servidor. Un clic de
                  contacto no acredita un mensaje enviado.
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Eventos registrados</CardTitle>
                    <CardDescription>
                      Sirve para comprobar cobertura y uso de funciones; no
                      equivale a personas únicas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.totals.events.map((event) => (
                      <div
                        key={event._id}
                        className="flex justify-between gap-2 rounded-lg bg-surface-container-low p-2 text-xs"
                      >
                        <span>{label(event._id)}</span>
                        <strong>{event.count}</strong>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </details>
          </>
        )
      )}
    </div>
  );
}
