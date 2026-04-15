import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Privacidad | quiero.menu',
  description: 'Politica de privacidad y proteccion de datos personales de quiero.menu',
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-extrabold mb-2 font-[family-name:var(--font-heading)]">Politica de Privacidad</h1>
        <p className="text-sm text-on-surface-variant mb-10">Ultima actualizacion: 14 de abril de 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-on-surface/90 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:text-on-surface [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:p-2 [&_th]:bg-surface-container [&_th]:font-semibold [&_td]:p-2 [&_td]:border-t [&_td]:border-outline-variant/20">

          <section>
            <p>
              En quiero.menu (en adelante &ldquo;la Plataforma&rdquo;, &ldquo;nosotros&rdquo;)
              nos comprometemos a proteger tu privacidad y tus datos personales. Esta politica describe que datos
              recopilamos, por que, como los protegemos y cuales son tus derechos.
            </p>
            <p>
              Esta politica se redacta en cumplimiento de la Ley N° 25.326 de Proteccion de Datos Personales
              de Argentina y la Ley N° 18.331 de Proteccion de Datos Personales de Uruguay.
            </p>
          </section>

          <section>
            <h2>1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales es:
            </p>
            <p>
              <strong>Titular:</strong> Guillermo Rene Pastorini Rivas<br />
              <strong>Argentina:</strong> CUIT 20-95431673-8 — Maximo Alvarez 421, Concepcion del Uruguay, Entre Rios, Argentina — Tel: 03442670825<br />
              <strong>Uruguay:</strong> RUT 150788960019 — Charruas 727, Paysandu, Uruguay — Tel: 091260680
            </p>
            <p>
              <strong>Responsable de Datos Personales:</strong><br />
              Guillermo Rene Pastorini Rivas<br />
              Email: privacidad@quiero.menu
            </p>
          </section>

          <section>
            <h2>2. Consentimiento</h2>
            <p>
              Al utilizar quiero.menu — ya sea como establecimiento registrado o como consumidor que realiza
              un pedido — prestas tu consentimiento previo, expreso e informado para el tratamiento de tus
              datos personales conforme a esta politica, en los terminos del Art. 5 de la Ley 25.326 (Argentina)
              y Art. 9 de la Ley 18.331 (Uruguay).
            </p>
            <p>
              El consentimiento es libre y voluntario. Podes revocarlo en cualquier momento contactandonos
              a privacidad@quiero.menu, sin que ello afecte la licitud del tratamiento previo a la revocacion.
              Ten en cuenta que la revocacion del consentimiento puede impedir la prestacion del servicio cuando
              el tratamiento sea necesario para su funcionamiento.
            </p>
          </section>

          <section>
            <h2>3. Datos que recopilamos</h2>

            <h3>De los establecimientos (restaurantes)</h3>
            <ul>
              <li>Nombre del establecimiento y datos de contacto (telefono, email, direccion).</li>
              <li>Numero de WhatsApp para recepcion de pedidos.</li>
              <li>Informacion del menu: productos, precios, descripciones, imagenes.</li>
              <li>Datos de facturacion y plan contratado.</li>
              <li>Datos de acceso: email y contrasena cifrada.</li>
            </ul>

            <h3>De los consumidores finales</h3>
            <ul>
              <li>Nombre y apellido.</li>
              <li>Numero de telefono.</li>
              <li>Direccion de entrega (cuando aplique).</li>
              <li>Coordenadas de geolocalizacion (solo si el usuario las comparte voluntariamente).</li>
              <li>Historial de pedidos realizados.</li>
              <li>Notas o comentarios incluidos en los pedidos.</li>
            </ul>

            <h3>Datos tecnicos (recopilados automaticamente)</h3>
            <ul>
              <li>Direccion IP y datos de conexion.</li>
              <li>Tipo de navegador y dispositivo.</li>
              <li>Paginas visitadas y tiempo de navegacion.</li>
            </ul>
          </section>

          <section>
            <h2>4. Finalidad del tratamiento</h2>
            <p>Utilizamos los datos personales para las siguientes finalidades:</p>
            <table>
              <thead>
                <tr>
                  <th>Finalidad</th>
                  <th>Base legal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Procesar y gestionar pedidos</td>
                  <td>Ejecucion del contrato</td>
                </tr>
                <tr>
                  <td>Crear y administrar cuentas de establecimientos</td>
                  <td>Ejecucion del contrato</td>
                </tr>
                <tr>
                  <td>Coordinar entregas entre consumidor y establecimiento</td>
                  <td>Ejecucion del contrato</td>
                </tr>
                <tr>
                  <td>Enviar notificaciones del servicio (estado del pedido, cambios en la cuenta)</td>
                  <td>Ejecucion del contrato</td>
                </tr>
                <tr>
                  <td>Mejorar la plataforma y analizar uso</td>
                  <td>Interes legitimo</td>
                </tr>
                <tr>
                  <td>Prevenir fraude y garantizar seguridad</td>
                  <td>Interes legitimo</td>
                </tr>
                <tr>
                  <td>Comunicaciones comerciales y promocionales</td>
                  <td>Consentimiento</td>
                </tr>
                <tr>
                  <td>Cumplir obligaciones legales y fiscales</td>
                  <td>Obligacion legal</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>5. Comparticion de datos</h2>
            <p>Compartimos datos personales unicamente en los siguientes casos:</p>
            <ul>
              <li><strong>Con el establecimiento:</strong> los datos del consumidor (nombre, telefono, direccion, pedido) se comparten con el restaurante correspondiente para la gestion del pedido.</li>
              <li><strong>Proveedores de servicios:</strong> utilizamos proveedores de hosting, infraestructura y servicios tecnicos que procesan datos en nuestro nombre bajo acuerdos de confidencialidad.</li>
              <li><strong>WhatsApp / Meta:</strong> los pedidos se envian a traves de WhatsApp. El uso de WhatsApp esta sujeto a sus propias politicas de privacidad.</li>
              <li><strong>Obligacion legal:</strong> cuando sea requerido por autoridad judicial o administrativa competente.</li>
            </ul>
            <p>No vendemos ni alquilamos datos personales a terceros.</p>
          </section>

          <section>
            <h2>6. Transferencia internacional de datos</h2>
            <p>
              Los datos son almacenados y procesados en servidores que pueden estar ubicados fuera de tu pais
              de residencia. En caso de transferencias internacionales:
            </p>
            <ul>
              <li>Las transferencias entre Argentina y Uruguay se realizan bajo el reconocimiento mutuo de nivel adecuado de proteccion.</li>
              <li>Para transferencias a otros paises, implementamos clausulas contractuales tipo aprobadas por las autoridades competentes y/o obtenemos tu consentimiento expreso cuando es requerido por la legislacion aplicable.</li>
            </ul>
          </section>

          <section>
            <h2>7. Conservacion de datos</h2>
            <ul>
              <li><strong>Datos de cuenta de establecimientos:</strong> mientras la cuenta este activa y hasta 2 anos despues de su cancelacion.</li>
              <li><strong>Datos de pedidos:</strong> 2 anos desde la fecha del pedido, para cumplir obligaciones legales y resolver eventuales reclamos.</li>
              <li><strong>Datos de consumidores:</strong> 1 ano desde el ultimo pedido realizado.</li>
            </ul>
            <p>Transcurridos los plazos, los datos seran eliminados o anonimizados.</p>
          </section>

          <section>
            <h2>8. Tus derechos</h2>
            <p>
              Segun la legislacion aplicable en tu pais, tenes derecho a:
            </p>

            <h3>Argentina (Ley 25.326)</h3>
            <ul>
              <li>Acceder a tus datos personales (gratuito, cada 6 meses).</li>
              <li>Solicitar la rectificacion, actualizacion o supresion de tus datos.</li>
              <li>Oponerte al tratamiento de tus datos.</li>
            </ul>
            <p className="text-xs text-on-surface-variant">
              La AGENCIA DE ACCESO A LA INFORMACION PUBLICA, en su caracter de Organo de Control de la
              Ley N° 25.326, tiene la atribucion de atender las denuncias y reclamos que interpongan quienes
              resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de
              proteccion de datos personales.
            </p>

            <h3>Uruguay (Ley 18.331)</h3>
            <ul>
              <li>Acceder, rectificar, actualizar, incluir o suprimir tus datos.</li>
              <li>Revocar el consentimiento en cualquier momento.</li>
            </ul>
            <p className="text-xs text-on-surface-variant">
              La Unidad Reguladora y de Control de Datos Personales (URCDP) es la autoridad competente para
              recibir denuncias en Uruguay.
            </p>
          </section>

          <section>
            <h2>9. Como ejercer tus derechos</h2>
            <p>
              Podes ejercer cualquiera de tus derechos enviando un email a <strong>privacidad@quiero.menu</strong> indicando:
            </p>
            <ol>
              <li>Tu nombre completo.</li>
              <li>El derecho que deseas ejercer.</li>
              <li>Un medio de contacto para responderte.</li>
            </ol>
            <p>
              Responderemos tu solicitud dentro de los plazos legales: 10 dias habiles (Argentina)
              o 5 dias habiles (Uruguay).
            </p>
          </section>

          <section>
            <h2>10. Seguridad de los datos</h2>
            <p>
              Implementamos medidas tecnicas y organizativas para proteger tus datos personales contra acceso
              no autorizado, perdida, alteracion o destruccion, incluyendo:
            </p>
            <ul>
              <li>Cifrado de datos en transito (HTTPS/TLS).</li>
              <li>Cifrado de contrasenas con algoritmos seguros.</li>
              <li>Control de acceso basado en roles.</li>
              <li>Monitoreo y auditorias periodicas de seguridad.</li>
            </ul>
          </section>

          <section>
            <h2>11. Cookies y tecnologias similares</h2>
            <p>
              Utilizamos los siguientes tipos de cookies:
            </p>
            <ul>
              <li><strong>Cookies esenciales:</strong> necesarias para el funcionamiento de la plataforma (sesion, autenticacion). No requieren consentimiento.</li>
              <li><strong>Cookies de analisis:</strong> nos ayudan a mejorar la experiencia de uso. Solo se activan con tu consentimiento previo.</li>
            </ul>
            <p>
              Al ingresar a la plataforma, te informaremos sobre el uso de cookies no esenciales y podras
              aceptarlas o rechazarlas. Tambien podes configurar tu navegador para gestionar cookies en
              cualquier momento. El rechazo de cookies no esenciales no afecta el funcionamiento basico del servicio.
            </p>
          </section>

          <section>
            <h2>12. Menores de edad</h2>
            <p>
              quiero.menu no recopila intencionalmente datos de menores de 16 anos. Si detectamos que hemos
              recopilado datos de un menor sin la autorizacion correspondiente, los eliminaremos de inmediato.
            </p>
          </section>

          <section>
            <h2>13. Modificaciones</h2>
            <p>
              Podemos actualizar esta politica periodicamente. Notificaremos los cambios relevantes por email
              o mediante un aviso en la plataforma con al menos 15 dias de anticipacion. La fecha de ultima
              actualizacion siempre estara visible al inicio de este documento.
            </p>
          </section>

          <section>
            <h2>14. Contacto</h2>
            <p>Para consultas sobre privacidad o proteccion de datos:</p>
            <ul>
              <li><strong>Privacidad y datos personales:</strong> privacidad@quiero.menu</li>
              <li><strong>Consultas legales generales:</strong> legal@quiero.menu</li>
              <li><strong>Sitio web:</strong> quiero.menu</li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t border-outline-variant/30 py-8 text-center text-sm text-on-surface-variant">
        <p>&copy; 2026 quiero.menu. Todos los derechos reservados.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/terms" className="hover:text-primary transition-colors">Terminos</Link>
          <span className="font-medium text-on-surface">Privacidad</span>
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
        </div>
      </footer>
    </div>
  );
}
