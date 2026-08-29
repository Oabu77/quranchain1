/**
 * The legacy DarCloud messaging client is retired.
 *
 * It previously copied an HttpOnly session design into JavaScript-accessible
 * bearer-token handling and called endpoints that are no longer public. Keep a
 * static, non-interactive page so an accidental import cannot restore that
 * behavior. The separate MeshTalk service owns the supported messaging UI.
 */
import { pageShell } from "../pages";

const MESSAGING_BODY = `
<main style="max-width:720px;margin:4rem auto;padding:0 1.25rem">
  <h1>Legacy messaging is unavailable</h1>
  <p>This retired DarCloud prototype does not send, store, or retrieve messages.</p>
  <p>The supported closed-test messaging experience is provided by the separately deployed MeshTalk service.</p>
  <p><a href="https://darcloud.host/meshtalk">Open MeshTalk</a></p>
</main>`;

export const MESSAGING_PAGE = pageShell("Messaging unavailable", MESSAGING_BODY);
