import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terminos y Condiciones | quiero.menu',
  description: 'Terminos y condiciones de uso de la plataforma quiero.menu',
};

export default function TermsPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <nav className="bg-white border-b border-outline-variant/30 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-extrabold text-on-surface tracking-tight font-[family-name:var(--font-heading)]">quiero</span>
            <span className="text-xl font-extrabold text-primary tracking-tight font-[family-name:var(--font-heading)]">.menu</span>
          </Link>
          <Link href="/" className="text-sm text-primary hover:underline">Volver al inicio</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold mb-2 font-[family-name:var(--font-heading)]">Terminos y Condiciones de Uso</h1>
        <p className="text-sm text-on-surface-variant mb-10">Ultima actualizacion: 14 de abril de 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-on-surface/90 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:text-on-surface [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1">

          <section>
            <h2>1. Informacion general</h2>
            <p>
              quiero.menu es una plataforma de tecnologia que permite a establecimientos gastronomicos
              crear menus digitales, recibir pedidos online y gestionar su operacion a traves de herramientas
              digitales (en adelante, &ldquo;la Plataforma&rdquo;, &ldquo;nosotros&rdquo;
              o &ldquo;quiero.menu&rdquo;).
            </p>
            <p>
              <strong>Datos del responsable:</strong>
            </p>
            <ul>
              <li>Titular: Guillermo Rene Pastorini Rivas</li>
              <li>Argentina: CUIT 20-95431673-8 — Maximo Alvarez 421, Concepcion del Uruguay, Entre Rios, Argentina — Tel: 03442670825</li>
              <li>Uruguay: RUT 150788960019 — Charruas 727, Paysandu, Uruguay — Tel: 091260680</li>
              <li>Email: legal@quiero.menu</li>
            </ul>
            <p>
              Al registrarte o utilizar quiero.menu, aceptas estos Terminos y Condiciones en su totalidad.
              Si no estas de acuerdo, no debes utilizar el servicio.
            </p>
            <p>
              Estos terminos se redactan en cumplimiento de la Ley 24.240 de Defensa del Consumidor (Argentina)
              y la Ley 17.250 de Relaciones de Consumo (Uruguay).
            </p>
          </section>

          <section>
            <h2>2. Naturaleza del servicio</h2>
            <p>
              quiero.menu actua exclusivamente como intermediario tecnologico. No somos parte en la relacion
              comercial entre el establecimiento gastronomico y el consumidor final. Cada restaurante es el
              unico responsable de:
            </p>
            <ul>
              <li>La calidad, seguridad e higiene de los productos que ofrece.</li>
              <li>La veracidad de los precios, descripciones e imagenes publicados en su menu.</li>
              <li>El cumplimiento de las normativas sanitarias, fiscales y de defensa del consumidor aplicables en su jurisdiccion.</li>
              <li>La gestion de entregas, tiempos de preparacion y atencion al cliente.</li>
            </ul>
          </section>

          <section>
            <h2>3. Registro y cuenta</h2>
            <p>
              Para utilizar quiero.menu como establecimiento, debes crear una cuenta proporcionando informacion
              veraz y actualizada. Sos responsable de mantener la confidencialidad de tus credenciales de acceso
              y de todas las actividades que ocurran bajo tu cuenta.
            </p>
            <p>
              Debes ser mayor de 18 anos para registrarte como establecimiento. Los consumidores finales que
              realicen pedidos deben ser mayores de 16 anos o contar con autorizacion de un adulto responsable.
            </p>
          </section>

          <section>
            <h2>4. Planes y facturacion</h2>
            <p>
              quiero.menu ofrece un plan gratuito con funcionalidades basicas y planes pagos con caracteristicas
              adicionales. Los precios estan publicados en la seccion de precios de nuestro sitio web y pueden
              modificarse con previo aviso de 30 dias.
            </p>
            <ul>
              <li>Los pagos se procesan de forma mensual o anual segun el plan elegido.</li>
              <li>No cobramos comisiones sobre las ventas del establecimiento.</li>
              <li>Podes cancelar tu suscripcion en cualquier momento. El servicio permanecera activo hasta el final del periodo ya abonado.</li>
              <li>Fuera del plazo de arrepentimiento (ver seccion 11), no se realizan reembolsos por periodos parciales ya consumidos.</li>
            </ul>
          </section>

          <section>
            <h2>5. Pedidos y transacciones</h2>
            <p>
              Los pedidos realizados a traves de quiero.menu se envian directamente al establecimiento mediante
              WhatsApp u otros canales configurados. quiero.menu no interviene en el proceso de pago entre el
              consumidor y el establecimiento, ni es responsable por disputas, devoluciones o reclamos derivados
              de la transaccion comercial.
            </p>
            <p>
              Es responsabilidad del consumidor proporcionar informacion correcta y actualizada para la entrega
              o retiro de su pedido.
            </p>
          </section>

          <section>
            <h2>6. Uso aceptable</h2>
            <p>Al utilizar quiero.menu, te comprometes a no:</p>
            <ul>
              <li>Publicar contenido falso, enganoso, ilegal u ofensivo.</li>
              <li>Utilizar la plataforma para actividades fraudulentas o ilicitas.</li>
              <li>Intentar acceder a cuentas o datos de otros usuarios.</li>
              <li>Interferir con el funcionamiento de la plataforma o sus sistemas.</li>
              <li>Revender o redistribuir el servicio sin autorizacion.</li>
            </ul>
            <p>
              En caso de incumplimiento, notificaremos al usuario por email otorgando un plazo razonable
              (no menor a 5 dias habiles) para regularizar la situacion antes de suspender o cancelar la cuenta.
              En casos de gravedad manifiesta (fraude, actividad ilegal, riesgo para terceros), podremos
              suspender la cuenta de forma inmediata, notificando al usuario dentro de las 24 horas siguientes
              con los motivos de la suspension y la posibilidad de presentar descargo.
            </p>
          </section>

          <section>
            <h2>7. Propiedad intelectual</h2>
            <p>
              Todo el diseno, codigo, marca y contenido de la plataforma son propiedad de quiero.menu. Los establecimientos
              conservan la propiedad sobre el contenido que publican (imagenes, descripciones, logos) y nos otorgan
              una licencia limitada para mostrarlo dentro de la plataforma.
            </p>
          </section>

          <section>
            <h2>8. Disponibilidad del servicio y fuerza mayor</h2>
            <p>
              Nos esforzamos por mantener la plataforma disponible de forma continua, pero no garantizamos
              un funcionamiento ininterrumpido. Pueden ocurrir interrupciones por mantenimiento programado
              (que sera notificado con anticipacion razonable), actualizaciones o causas de fuerza mayor.
            </p>
            <p>
              Se consideran causas de fuerza mayor: desastres naturales, interrupciones de servicios de
              terceros (infraestructura cloud, WhatsApp/Meta, proveedores de internet), acciones gubernamentales,
              pandemias, conflictos belicos y cualquier otro evento imprevisible e inevitable fuera de nuestro
              control razonable. No somos responsables por perdidas derivadas de la indisponibilidad del
              servicio causada por fuerza mayor.
            </p>
          </section>

          <section>
            <h2>9. Limitacion de responsabilidad</h2>
            <p>
              En la maxima medida permitida por la legislacion aplicable de cada jurisdiccion:
            </p>
            <ul>
              <li>quiero.menu no es responsable por danos indirectos, incidentales o consecuentes derivados del uso de la plataforma.</li>
              <li>No garantizamos que el uso de la plataforma generara un volumen especifico de ventas o resultados comerciales.</li>
              <li>Nuestra responsabilidad total no excedera el monto pagado por el establecimiento en los ultimos 12 meses, salvo donde la legislacion local no permita dicha limitacion.</li>
            </ul>
            <p>
              Esta limitacion no aplica en casos de dolo o culpa grave, ni cuando la legislacion de proteccion
              al consumidor vigente en tu jurisdiccion establezca un regimen de responsabilidad que no pueda
              ser limitado contractualmente.
            </p>
          </section>

          <section>
            <h2>10. Responsabilidad de los establecimientos</h2>
            <p>
              Los establecimientos que utilizan quiero.menu como canal de venta son los unicos responsables
              frente al consumidor final por la calidad, seguridad, legalidad e idoneidad de los productos
              y servicios que ofrecen. El establecimiento se compromete a mantener indemne a quiero.menu
              frente a cualquier reclamo, demanda o sancion derivada de:
            </p>
            <ul>
              <li>Productos defectuosos, en mal estado o que no cumplan las normativas sanitarias.</li>
              <li>Informacion inexacta o enganosa en su menu (precios, descripciones, alergenos, imagenes).</li>
              <li>Incumplimiento de entregas, demoras o problemas en la atencion al cliente.</li>
              <li>Infracciones a las normas de defensa del consumidor, tributarias o de cualquier otra indole.</li>
            </ul>
          </section>

          <section>
            <h2>11. Derecho de arrepentimiento</h2>
            <p>
              Por tratarse de una contratacion a distancia (electronica), tenes derecho a arrepentirte
              y revocar la aceptacion sin necesidad de indicar motivo y sin penalidad alguna, dentro de
              los siguientes plazos segun tu jurisdiccion:
            </p>

            <h3>Argentina (Ley 24.240, Art. 34)</h3>
            <p>
              10 (diez) dias corridos desde la contratacion. Se restituira la totalidad de los importes
              abonados dentro de los 10 dias habiles siguientes a la comunicacion del arrepentimiento.
            </p>

            <h3>Uruguay (Ley 17.250, Art. 16)</h3>
            <p>
              7 (siete) dias habiles desde la contratacion. Se restituira la totalidad de los importes
              abonados dentro de los 10 dias habiles siguientes a la comunicacion.
            </p>

            <h3>Como ejercer el arrepentimiento</h3>
            <p>
              Podes ejercer tu derecho de arrepentimiento de forma sencilla por cualquiera de estos medios:
            </p>
            <ul>
              <li>Enviando un email a <strong>legal@quiero.menu</strong> con el asunto &ldquo;Arrepentimiento&rdquo;.</li>
              <li>Desde la configuracion de tu cuenta, en la seccion &ldquo;Cancelar suscripcion&rdquo;.</li>
            </ul>
            <p>
              No es necesario indicar el motivo. El reembolso se procesara por el mismo medio de pago utilizado
              en la contratacion.
            </p>
          </section>

          <section>
            <h2>12. Resolucion de conflictos</h2>
            <p>
              Ante cualquier controversia, las partes intentaran resolverla de buena fe mediante negociacion
              directa. Si no se alcanza una solucion:
            </p>
            <ul>
              <li><strong>Argentina:</strong> Seran competentes los tribunales ordinarios de la Ciudad Autonoma de Buenos Aires, sin perjuicio del derecho del consumidor a iniciar acciones en su domicilio (Ley 26.993).</li>
              <li><strong>Uruguay:</strong> Seran competentes los tribunales de Montevideo, conforme a la legislacion uruguaya.</li>
            </ul>
          </section>

          <section>
            <h2>13. Modificaciones</h2>
            <p>
              Podemos modificar estos Terminos notificando los cambios por correo electronico o mediante
              un aviso en la plataforma con al menos 30 dias de anticipacion.
            </p>
            <p>
              Para modificaciones menores (correcciones de estilo, aclaraciones que no alteran derechos),
              el uso continuado del servicio despues de la notificacion implica la aceptacion.
              Para modificaciones sustanciales (cambios en precios, limitaciones de responsabilidad,
              tratamiento de datos), solicitaremos tu aceptacion explicita. Si no aceptas los nuevos
              terminos, podras cancelar tu cuenta sin penalidad.
            </p>
          </section>

          <section>
            <h2>14. Legislacion aplicable</h2>
            <p>
              Estos terminos se rigen por la legislacion del pais de residencia del usuario, en particular:
            </p>
            <ul>
              <li><strong>Argentina:</strong> Ley 24.240 de Defensa del Consumidor y normativa complementaria.</li>
              <li><strong>Uruguay:</strong> Ley 17.250 de Relaciones de Consumo.</li>
            </ul>
          </section>

          <section>
            <h2>15. Contacto</h2>
            <p>
              Para consultas sobre estos terminos, podes contactarnos en:
            </p>
            <ul>
              <li>Email: legal@quiero.menu</li>
              <li>Sitio web: quiero.menu</li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t border-outline-variant/30 py-8 text-center text-sm text-on-surface-variant">
        <p>&copy; 2026 quiero.menu. Todos los derechos reservados.</p>
        <div className="flex justify-center gap-6 mt-3">
          <span className="font-medium text-on-surface">Terminos</span>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
        </div>
      </footer>
    </div>
  );
}
