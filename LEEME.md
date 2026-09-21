# Flores amarillas 🌻

Una página de una sola pantalla: primero un viaje por el espacio donde cada estrella
es una flor amarilla con una frase, luego la entrada a la Tierra, y al final un jardín
que crece con el mensaje.

## Cómo verla

Abre `index.html` con doble clic. No necesita instalar nada, no hay build, no hay servidor.

## Qué puedes cambiar (todo está hasta arriba de `script.js`)

Abre `script.js` con el Bloc de notas o VS Code. Las primeras 40 líneas son el objeto
`CONFIG` y ahí vive todo lo editable:

- `frases`: las que salen junto a cada flor durante el viaje. Pon las que quieras, en el
  orden que quieras. Entre más pongas, menos se repiten.
- `mensajeFinal.lineas`: el texto del final. La línea que lleva `em: true` sale más
  grande y en cursiva, úsala para la frase fuerte.
- `mensajeFinal.firma`: la letra chiquita de hasta abajo.
- `duracionFrase`: cuánto se queda cada frase en pantalla (3000 = 3 segundos).
  Súbelo si quieres darle más tiempo de leerlas.
- `duracionViaje`: milisegundos que dura el espacio (17000 = 17 segundos).
- `duracionTierra`: lo que tarda la Tierra en crecer y tragarse la pantalla.
- `calidad`: cuántas flores hay en el viaje. La página ya se ajusta sola al
  tamaño de la pantalla; bájalo a `0.7` si algún celular viejito se siente
  pesado, o súbelo a `1.3` en una compu potente.

Respeta las comillas y las comas, es lo único que puede romperlo.

## Música

Pon un archivo llamado `music.mp3` en esta misma carpeta y suena solo al darle Empezar.
Entra despacito, sube durante unos 3 segundos y se queda de fondo al 22 por ciento,
para que acompañe sin tapar nada. Se repite sola hasta el final.

Si quieres moverle, cambia `volumen` en el CONFIG: `0.22` es 22 por ciento, `0.3` es
más alto, `0` la apaga. Si no hay archivo, la página lo detecta y quita sola la línea
de "súbele el volumen".

Algo instrumental y tranquilo funciona mejor que una canción con letra, porque la letra
compite con las frases que van pasando.

## Si ella lo abre en un iPhone

Safari de iPhone no deja que una página baje el volumen por código, ahí manda el
botón del teléfono. Para que el 22 por ciento sí se respete, la página usa otro
camino (Web Audio) que **solo funciona si está publicada con https**, como el link
de Netlify. Si ella abriera el archivo suelto, la música le sonaría a todo volumen.

Dos cosas más de iPhone que no dependen de la página:

- Si trae el switch de silencio activado, no va a oír la música. Ninguna página
  puede saltarse eso.
- Si tiene activado "Reducir movimiento" en Ajustes, verá una versión más corta y
  con menos animación. Es a propósito, para que no le maree.

## Atajos para probar sin aventarte todo el viaje

Agrégalos al final de la dirección:

- `index.html?ir=jardin` abre directo el jardín y el mensaje final.
- `index.html?ir=tierra` abre en la llegada a la Tierra.
- `index.html?rapido=1` corre el viaje completo en la mitad de tiempo.

## Cómo mandárselo

Necesitas un link, porque el archivo suelto por WhatsApp no se abre bien.

La forma más rápida: entra a [app.netlify.com/drop](https://app.netlify.com/drop) y
arrastra la carpeta completa (`index.html`, `style.css`, `script.js` y el mp3 si le
pusiste). Te da un link en segundos y funciona en celular.

Si prefieres GitHub Pages: sube los archivos a un repo, entra a Settings, Pages, y
publica la rama `main`.

Antes de mandarlo, ábrelo una vez en tu propio celular. Es donde ella lo va a ver.
