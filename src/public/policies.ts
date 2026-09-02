function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function publicPolicyPage(
  title: string,
  summary: string,
  sections: Array<{ heading: string; body: string }>,
): string {
  const renderedSections = sections
    .map(
      ({ heading, body }) => `
        <section>
          <h2>${escapeHtml(heading)}</h2>
          <p>${escapeHtml(body)}</p>
        </section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} | MeshTalk by DarCloud</title>
  <style>
    :root{color-scheme:dark;background:#07090f;color:#e6edf3;font-family:Inter,system-ui,sans-serif}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:linear-gradient(180deg,#07111c,#07090f)}
    header,main,footer{width:min(900px,calc(100% - 2rem));margin:auto}header{padding:2.5rem 0 1.25rem;border-bottom:1px solid #243142}
    a{color:#55d7ff}h1{font-size:clamp(2rem,6vw,3.5rem);margin:.5rem 0}h2{color:#6ee7b7;margin-bottom:.4rem}
    .eyebrow{color:#f7c65f;text-transform:uppercase;letter-spacing:.14em;font-size:.8rem}.summary{color:#a8b3c7;font-size:1.1rem;line-height:1.7}
    section{background:#0d1520;border:1px solid #243142;border-radius:14px;padding:1.25rem;margin:1rem 0}section p{line-height:1.7;color:#c4cedd;margin:.25rem 0}
    nav{display:flex;gap:1rem;flex-wrap:wrap;margin-top:1.25rem}footer{padding:2rem 0;color:#8b98aa;font-size:.9rem}
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">MeshTalk · DarCloud</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="summary">${escapeHtml(summary)}</p>
    <nav>
      <a href="/messages">Open Messages</a>
      <a href="/meshtalk/privacy">Privacy</a>
      <a href="/meshtalk/terms">Terms</a>
      <a href="/meshtalk/child-safety">Child Safety</a>
      <a href="https://www.darcloud.host/">DarCloud</a>
    </nav>
  </header>
  <main>${renderedSections}</main>
  <footer>© 2026 DarCloud. MeshTalk communications and policy information.</footer>
</body>
</html>`;
}

export const MESHTALK_HOME_PAGE = publicPolicyPage(
  "MeshTalk",
  "A DarCloud messaging surface for authorized users, with account controls and safety-first operations.",
  [
    {
      heading: "Messages",
      body: "Sign in with your DarCloud account to start or continue conversations. Messaging APIs require an authenticated session.",
    },
    {
      heading: "Privacy and safety",
      body: "Review the privacy, terms, and child-safety pages before using MeshTalk. Report abuse through the support channels shown in the application.",
    },
  ],
);

export const MESHTALK_PRIVACY_PAGE = publicPolicyPage(
  "MeshTalk Privacy Policy",
  "How MeshTalk handles account and conversation information.",
  [
    {
      heading: "Information used",
      body: "MeshTalk uses DarCloud account identity and conversation data needed to deliver messaging features. Access is limited to authenticated users and authorized operations.",
    },
    {
      heading: "Retention and requests",
      body: "Retention is limited to operational and legal needs. Users may submit access, correction, or deletion requests through DarCloud privacy support.",
    },
    {
      heading: "Security",
      body: "Credentials, session tokens, and private message content must not be placed in public pages, logs, or issue trackers.",
    },
  ],
);

export const MESHTALK_TERMS_PAGE = publicPolicyPage(
  "MeshTalk Terms of Service",
  "Rules for lawful, respectful use of MeshTalk.",
  [
    {
      heading: "Authorized use",
      body: "Users may access only their own account and conversations or information they are explicitly authorized to use.",
    },
    {
      heading: "Prohibited activity",
      body: "Abuse, harassment, fraud, malware, credential theft, unauthorized access, and unlawful content are prohibited.",
    },
    {
      heading: "Service changes",
      body: "DarCloud may restrict or suspend access to protect users, comply with law, or preserve platform security and reliability.",
    },
  ],
);

export const MESHTALK_CHILD_SAFETY_PAGE = publicPolicyPage(
  "MeshTalk Child Safety",
  "Safety controls and reporting expectations for content involving minors.",
  [
    {
      heading: "Zero tolerance",
      body: "Child sexual abuse material, exploitation, grooming, trafficking, and sexualization of minors are prohibited and may be reported to relevant authorities.",
    },
    {
      heading: "Reporting",
      body: "Users should report suspected child-safety violations through the in-product support channel and appropriate emergency or law-enforcement services when immediate danger exists.",
    },
    {
      heading: "Account protection",
      body: "Guard account credentials, use age-appropriate supervision, and do not share private contact or location information with unknown parties.",
    },
  ],
);
