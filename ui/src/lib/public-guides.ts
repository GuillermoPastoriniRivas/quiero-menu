export type PublicGuide = {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: { title: string; paragraphs: string[]; items?: string[] }[];
};

export const PUBLIC_GUIDES: PublicGuide[] = [
  {
    slug: "menu-digital-gratis",
    title: "Cómo crear un menú digital gratis para tu restaurante",
    description: "Qué preparar, cómo publicar una carta online y cómo compartirla con tus clientes sin confundir menú, pedidos y publicidad.",
    updatedAt: "2026-10-11",
    sections: [
      {
        title: "Qué es un menú digital y qué incluye la opción gratuita",
        paragraphs: [
          "Un menú digital es una carta que tus clientes pueden consultar desde un enlace. No exige instalar una app: se abre en el navegador del teléfono. El QR es otra forma de abrir ese mismo enlace, no un menú distinto.",
          "En quiero.menu podés crear y publicar tu carta gratis. La carta puede incluir categorías, productos, precios, fotos y datos de tu local. Hay funciones opcionales y límites de pedidos según el plan: publicar la carta y contratar servicios adicionales son decisiones diferentes. Revisá los planes vigentes en la página principal antes de elegir.",
        ],
      },
      {
        title: "Prepará la información antes de publicar",
        paragraphs: [
          "Empezá por el nombre del negocio, ciudad, dirección y número de contacto. Agrupá los platos en categorías comprensibles y revisá qué precio corresponde a cada tamaño o presentación. Una carta corta y correcta es más útil que una larga con productos que ya no vendés.",
          "Si tenés una foto de tu carta, podés usar la importación con IA como punto de partida. Comprobá nombres, cantidades y precios después de importar: una foto borrosa o una columna mal interpretada puede producir errores. La revisión del dueño sigue siendo necesaria.",
        ],
        items: ["Nombres y precios actuales de los productos.", "Horarios reales y formas de contacto.", "Fotos propias y descripciones que coincidan con lo que ofrecés."],
      },
      {
        title: "Publicá y probá la carta como si fueras un cliente",
        paragraphs: [
          "Creá la cuenta, cargá o importá los productos y abrí la dirección pública del local desde un teléfono. Revisá que se lean los precios, que las categorías tengan sentido y que el contacto sea correcto. No compartas una vista de edición ni el enlace privado del panel.",
          "Si habilitás pedidos, probá también el recorrido completo y quién los atiende. Si solo necesitás mostrar la carta, podés comenzar por ese uso. Consultar un menú, hacer clic en WhatsApp y recibir un pedido son acciones distintas.",
        ],
      },
      {
        title: "Compartí el enlace donde ya están tus clientes",
        paragraphs: [
          "Poné la dirección pública en la bio de tu Instagram, compartila por WhatsApp y usá el QR en las mesas o el mostrador. En el panel, Mi menú reúne las opciones para copiar el enlace, compartirlo y descargar el QR. No necesitás que quiero.menu tenga una cuenta de Instagram para usar el enlace en tu propia bio.",
          "Después de publicar, mantené actualizados los precios y la disponibilidad. Medí consultas y contactos para entender el uso, pero no interpretes cada visita como una venta nueva. Publicar una carta tampoco garantiza aparecer en Google: el buscador decide qué páginas mostrar.",
        ],
      },
    ],
  },
  {
    slug: "carta-qr",
    title: "Carta QR: cómo crearla, imprimirla y mantenerla actualizada",
    description: "Una guía práctica para usar el QR de tu menú en mesas, mostrador e Instagram y evitar enlaces rotos o precios desactualizados.",
    updatedAt: "2026-10-11",
    sections: [
      {
        title: "El QR debe abrir la carta pública",
        paragraphs: [
          "Un QR guarda una dirección web. Cuando el cliente lo escanea, el teléfono abre la carta en el navegador. Usá la dirección pública del negocio, no el panel de administración ni una pantalla que requiera iniciar sesión.",
          "En quiero.menu el menú vive en una dirección como quiero.menu/nombre-del-local. El panel permite descargar un QR con la marca del negocio y una hoja imprimible. El QR no necesita una app especial de quiero.menu para abrirse.",
        ],
      },
      {
        title: "Probá el código antes de imprimir muchas copias",
        paragraphs: [
          "Descargá el QR desde Mi menú y hacé una prueba impresa. Escaneala con más de un teléfono, con la iluminación y distancia reales de tu salón. Conservá el contraste y el margen blanco alrededor del código: recortarlo demasiado o ponerlo sobre un fondo cargado dificulta la lectura.",
          "Mostrá también el nombre del local y la dirección web en texto. Eso permite abrir la carta si un cliente no puede escanear el QR. Mantené una alternativa de atención o una carta física para quienes no tengan conexión o teléfono disponible.",
        ],
        items: ["Una copia de prueba antes de imprimir el lote.", "Un QR legible, sin deformar ni tapar el margen.", "El enlace en texto y una alternativa para consultar la carta."],
      },
      {
        title: "Actualizá precios sin cambiar el enlace",
        paragraphs: [
          "Editar productos y precios en el mismo menú evita volver a imprimir el QR por cada cambio. Los clientes consultan la carta publicada en esa dirección. Después de editar, abrila desde el teléfono para verificar cómo quedó.",
          "Cambiar el slug —la parte final de la dirección— es diferente de cambiar un precio. Los QR impresos conservan la dirección anterior. Antes de renombrar el enlace, revisá dónde lo compartiste y prepará nuevos códigos si hace falta. No supongas que un enlace antiguo redirige automáticamente.",
        ],
      },
      {
        title: "Usalo en el salón y en tus canales digitales",
        paragraphs: [
          "En mesas y mostrador el QR ayuda al cliente que ya está en tu negocio. En Instagram o WhatsApp suele resultar más práctico compartir un enlace clickeable: escanear un QR mostrado en el mismo teléfono agrega una dificultad innecesaria.",
          "El QR distribuye la carta, pero no reemplaza la operación del local. Acordá cómo se hacen y confirman los pedidos. Una visita al menú o un clic de contacto demuestra interés; no acredita una compra ni que la compra sea incremental.",
        ],
      },
    ],
  },
  {
    slug: "menu-digital-vs-pdf",
    title: "Menú digital, PDF o pedidos online: qué conviene para tu local",
    description: "Compará una carta en PDF, un menú web con QR y un sistema de pedidos según cómo actualizás precios y atendés a tus clientes.",
    updatedAt: "2026-10-11",
    sections: [
      {
        title: "Elegí según el problema que querés resolver",
        paragraphs: [
          "Mostrar precios, mantener la carta al día y organizar pedidos son necesidades diferentes. Una herramienta puede cubrir más de una, pero no conviene agregar pasos que tus clientes o tu equipo no van a usar. Empezá por el recorrido real de tu negocio: dónde te descubren, dónde ven la carta y cómo te hacen un pedido.",
          "Si tu audiencia ya llega desde la bio de Instagram, un enlace claro a la carta puede ser suficiente para empezar. Si vendés desde el salón, importa que el QR sea legible. Si el problema son pedidos incompletos o difíciles de ordenar, evaluá además un flujo de pedidos.",
        ],
      },
      {
        title: "Carta en PDF: simple, pero hay que mantener el archivo",
        paragraphs: [
          "Un PDF conserva el diseño que preparaste y puede servir si la carta cambia poco. En un teléfono puede requerir zoom, descarga o desplazarse por páginas grandes. Cada actualización exige reemplazar el archivo y revisar los enlaces que distribuiste.",
          "No todos los PDF se leen igual: uno generado con texto suele ser más accesible que una foto incrustada. Si elegís esta opción, probá el archivo en un teléfono y evitá mandar versiones distintas con precios diferentes por cada canal.",
        ],
      },
      {
        title: "Menú web con QR: carta editable en una dirección estable",
        paragraphs: [
          "Un menú web permite separar productos en categorías y adaptar la lectura a la pantalla. El QR y el enlace de Instagram apuntan a la misma carta. Si mantenés la dirección, podés editar los productos sin sustituir todos los materiales impresos.",
          "En quiero.menu la publicación de la carta es gratuita. La carta pública muestra el contenido del negocio y puede compartirse por enlace o QR. Su utilidad depende de que el local mantenga nombres, precios, horarios y contacto correctos; la herramienta no corrige sola los cambios del negocio.",
        ],
      },
      {
        title: "Pedidos online: agregan una responsabilidad operativa",
        paragraphs: [
          "Un sistema de pedidos agrega selección de productos y opciones, datos del cliente y seguimiento. Eso puede reducir intercambios para armar un pedido, pero exige que alguien del local atienda el canal, confirme disponibilidad y coordine retiro o entrega.",
          "Antes de habilitarlo, probá una compra y decidí quién responde en cada horario. Los pagos, las confirmaciones y las entregas deben quedar claros. Tener una carta consultada no prueba que exista demanda de pedidos online; podés medir el uso de la carta y avanzar cuando la operación lo justifique.",
        ],
        items: ["Carta que cambia poco: evaluá un PDF legible y actualizado.", "Precios y productos que cambian: evaluá una carta web con enlace estable.", "Pedidos desordenados: evaluá un flujo de pedidos y el equipo que lo atenderá."],
      },
    ],
  },
];

export function getPublicGuide(slug: string): PublicGuide | undefined {
  return PUBLIC_GUIDES.find((guide) => guide.slug === slug);
}

export function guidesPlainText(): string {
  return PUBLIC_GUIDES.map((guide) => [
    `# ${guide.title}`, `URL: https://quiero.menu/guias/${guide.slug}`, `Actualizado: ${guide.updatedAt}`, guide.description,
    ...guide.sections.flatMap((section) => [`## ${section.title}`, ...section.paragraphs, ...(section.items ?? []).map((item) => `- ${item}`)]),
  ].join("\n\n")).join("\n\n---\n\n");
}
