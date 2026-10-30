# Publicidad discreta: preparación, no activación

Estado: propuesta editorial para Cambio Claro. No se instaló publicidad, analítica,
seguimiento, cuenta de anuncios ni identificador de editor. No se publicaron espacios
vacíos ni se estimaron ingresos. Las guías de ciudades aportan fuentes y herramientas;
no prometen posiciones en buscadores ni generan páginas duplicadas por cada moneda.

## Reglas que no deben cambiar con un patrocinio

- El orden y el mejor precio dependen exclusivamente de cotizaciones comparables.
  Nunca vender una posición, incluir una promoción como cotización ni incorporar
  precios manuales al ranking.
- Mantener separados ciudad, sucursal, moneda, canal, importe y estado de la lectura.
  Un anuncio no demuestra licencia, disponibilidad, cobertura ni calidad del proveedor.
- Rotular cualquier contenido pagado como **Publicidad** o **Patrocinado** y nombrar
  al anunciante. Los enlaces comerciales deben identificarse con `rel="sponsored"`
  (y `noopener` cuando corresponda).
- No colocar publicidad dentro de controles, calculadora, primer resultado o tarjetas
  de cotización. Nunca usar ventanas emergentes, reproducción automática ni botones
  confundibles con acciones del comparador.

## Primera opción de diseño, cuando exista un acuerdo aprobado

Un único patrocinio estático, sin seguimiento, debajo del directorio y antes del pie.
En móvil debe conservar la separación visual del contenido editorial y permitir
consultar y comparar sin atravesar un anuncio. Mostrarlo solamente si hay contenido
real aprobado: no reservar ahora una caja vacía. Las guías no necesitan anuncios en
esta fase; mantenerlas útiles y ligeras.

Un patrocinador puede financiar el servicio, pero no seleccionar qué fuentes se leen,
qué cotización gana o qué competidores aparecen. Publicar esa independencia al lado
de la pieza comercial cuando se active.

## Decisiones pendientes antes de activar cualquier anuncio

1. Elegir con el propietario un patrocinador o red y revisar identidad, condiciones,
   contenido, destino del enlace, permisos y modalidad de pago. No crear cuentas ni
   aceptar acuerdos financieros o comerciales en su nombre sin el flujo apropiado.
2. Aprobar expresamente el contenido y la ubicación. Si una red exige una cuenta,
   identificador de editor o verificación del sitio, usar los datos reales autorizados:
   no inventar IDs, `ads.txt` ni registros de vendedor.
3. Evaluar qué datos enviaría la integración y qué cookies o almacenamiento usaría.
   Preparar avisos de privacidad y, cuando corresponda, consentimiento antes de cargar
   scripts. No enviar importes, filtros del usuario ni datos financieros a anunciantes.
4. Actualizar el texto público «Sin anuncios ni rastreadores» solo cuando la integración
   aprobada cambie ese estado, describiendo con exactitud qué se incorpora.
5. Probar accesibilidad, diseño móvil, contraste, peso de página y estabilidad visual;
   verificar que bloquear el anuncio no rompa fuentes, filtros ni calculadora.
6. Validar independencia con pruebas: el mismo conjunto de cotizaciones debe producir
   idéntico orden y mejor resultado con el anuncio activado o desactivado.
7. Publicar solo tras la aprobación pertinente y disponer de una desactivación sencilla.

## Medición sin promesas

No hay una previsión de ingresos ni datos de tráfico verificados. Antes de decidir una
red o precio comercial, el propietario debe elegir qué medición autoriza. No añadir
rastreadores para estimar tráfico sin esa decisión. La primera fase puede funcionar
sin analítica; evaluar calidad con pruebas funcionales y comentarios voluntarios.

## Mantenimiento de las guías

`node ciudades/build.mjs` regenera las páginas de Asunción, Ciudad del Este y
Encarnación a partir de `providers.js`, junto con el índice y `sitemap.xml`. El día de
revisión que muestran las páginas corresponde al catálogo verificado, no a una lectura
de cotizaciones. Actualizar esa fecha únicamente después de una nueva comprobación.

No crear más páginas sin cobertura verificable y una utilidad local concreta. Los
accesos a USD, BRL, ARS y EUR usan parámetros del comparador en vez de páginas casi
idénticas. El sitemap enumera únicamente páginas existentes, sin fechas de modificación
inventadas. En GitHub Pages de proyecto, el `robots.txt` de este repositorio queda en
`/BestEchangeRates/robots.txt`, no en la raíz del dominio; no controla el rastreo del host.
Para descubrimiento se puede enviar el sitemap real a la herramienta de buscadores
que el propietario autorice, sin afirmar que se haya enviado o indexado.

## Preparación técnica (30 de octubre de 2026)

`sponsorship-config.js` contiene `enabled: false`, ningún origen aprobado y ninguna
campaña. `sponsorship.js` muestra únicamente texto y un enlace HTTPS, sin imágenes,
solicitudes, cookies o medición. El espacio está oculto y vacío cuando no hay campaña
válida. No lee selecciones ni importa el ranking; utiliza `textContent`, etiqueta
«Publicidad», identifica al anunciante y aplica `rel="sponsored noopener noreferrer"`
y `referrerpolicy="no-referrer"`. Rechaza credenciales, consultas y fragmentos en el
destino. Una campaña debe tener `advertiser`, `message`, `linkLabel`, `url`,
`startsAt` y `endsAt` (instantes UTC `YYYY-MM-DDTHH:mm:ssZ`); solo aparece en un
origen expresamente aprobado y durante ese intervalo al cargar la página.

Existe un bloqueo adicional para `github.io`: este despliegue sigue siendo
informativo. Antes de operar comercialmente, el propietario debe aprobar un hosting
compatible y revisar sus condiciones. No se ha migrado el sitio. Las condiciones de
[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
no permiten usarlo para operar un negocio online; no asumir que preparar una ranura
publicitaria equivale a autorización de explotación comercial.

Para activar: confirmar host y origen final, acuerdo y anunciante reales, texto y
URL revisados, fechas de campaña y autorización expresa del propietario; actualizar
los avisos públicos de ausencia de anuncios. La activación es un cambio de código
revisado, no un parámetro de URL o almacenamiento del visitante. No hay cuenta
AdSense, ID, integración de red ni `ads.txt` ficticio. Si se elige una red, revisar
sus [políticas de contenido](https://support.google.com/publisherpolicies/answer/11190248),
[ubicación](https://support.google.com/adsense/answer/1346295),
[privacidad](https://support.google.com/publisherpolicies/answer/10437794) y
[consentimiento](https://support.google.com/adsense/answer/13554116), además de las
condiciones de las fuentes. Una red requiere otro proyecto de integración: esta
ranura estática no carga anuncios de red ni sustituye una CMP certificada.

Las páginas `ayuda.html`, `transparencia.html`, `privacidad.html` y `contacto.html`
aportan ayuda original y rutas públicas de corrección sin inventar empresa, correo,
tráfico o aprobación editorial. El canal actual de contacto es GitHub Issues,
público y con cuenta GitHub; no sirve para enviar información sensible. Completar
identidad y contacto privado reales con datos aprobados antes de acuerdos comerciales.
