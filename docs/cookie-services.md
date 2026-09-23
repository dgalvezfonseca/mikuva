# Cookies y servicios opcionales

Este documento describe únicamente el comportamiento implementado en el código. No sustituye un aviso de privacidad ni una política legal.

## Cookies necesarias

| Cookie                  | Finalidad confirmada                                           |
| ----------------------- | -------------------------------------------------------------- |
| `mikuva_cookie_consent` | Conserva las categorías y servicios elegidos en CookieConsent. |

La categoría `necessary` está siempre activa y no puede deshabilitarse.

## Servicio funcional: Chatwoot

El SDK del chat se descarga desde `https://chat.arguz.net` únicamente cuando se acepta el servicio Chatwoot dentro de la categoría `functional`.

| Cookie conocida        | Finalidad o condición                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `cw_conversation`      | Mantiene la conversación del widget de Chatwoot.                                             |
| `cw_user_{identifier}` | Puede existir si una integración llama a `setUser`. Mikuva no llama a `setUser` actualmente. |

Al rechazar o revocar el servicio se evita su inicialización en la siguiente carga. No se intenta desmontar dinámicamente un SDK que ya se ejecutó en la página actual, porque Chatwoot no documenta un teardown seguro para ese caso.

## Servicio funcional: Google Maps

El mapa de la página de contacto se descarga desde `https://www.google.com/maps/` únicamente cuando se acepta el servicio Google Maps dentro de la categoría `functional`. También se ofrece un enlace externo para consultar la ubicación sin cargar el mapa dentro de Mikuva.

No se documentan cookies específicas de Google Maps porque su presencia y alcance no se han confirmado en esta implementación.

## Medición del sitio: Matomo

El tracker se descarga desde `https://arguz.com/matomo/` con el identificador de sitio `3` en todas las páginas. Registra una vista inicial y los cambios de ruta sin duplicar la misma URL ni incluir query strings o fragments.

| Cookie conocida             | Finalidad o condición                          |
| --------------------------- | ---------------------------------------------- |
| `_pk_id.<sitio>.<dominio>`  | Distingue una visita recurrente en Matomo.     |
| `_pk_ses.<sitio>.<dominio>` | Conserva temporalmente los datos de la sesión. |

## Trabajo legal pendiente

- El aviso de privacidad y la información sobre cookies están publicados en
  `/aviso-de-privacidad`.
- No existe una ruta independiente de política de cookies; la información se concentra en la
  sección correspondiente del aviso de privacidad.
- Confirmar duración, dominio y alcance definitivo de las cookies de Chatwoot en la instalación operativa.
- Confirmar datos procesados, almacenamiento local y posibles cookies del mapa integrado de Google.
- Verificar en la instalación operativa que la duración de Matomo coincida con los 13 meses para
  `_pk_id` y 30 minutos para `_pk_ses` documentados en el aviso; confirmar también dominio,
  anonimización de IP y alcance definitivo.
