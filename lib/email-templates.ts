export function baseEmailShell(title: string, bodyHtml: string) {
  // Simple, neutral styling consistent with the app's tone
  return `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { background:#f6f7f9; color:#0f172a; margin:0; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
        .wrapper { width:100%; background:#f6f7f9; padding:24px 0; }
        .container { max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; }
        .header { padding:16px 20px; border-bottom:1px solid #e5e7eb; }
        .header h1 { font-size:16px; margin:0; color:#111827; }
        .content { padding:20px; font-size:14px; line-height:1.6; color:#111827; }
        .muted { color:#6b7280; }
        .btn { display:inline-block; background:#111827; color:#ffffff !important; text-decoration:none; padding:10px 14px; border-radius:6px; font-weight:600; }
        .footer { padding:16px 20px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; }
        a { color:#111827; }
        .sp { height:12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header"><h1>${escapeHtml(title)}</h1></div>
          <div class="content">${bodyHtml}</div>
          <div class="footer">This email was sent by your e-commerce platform.</div>
        </div>
      </div>
    </body>
  </html>`;
}

export function inviteEmail(opts: { storeName: string; role: "STORE_OWNER" | "STAFF"; actionUrl: string }) {
  const roleLabel = opts.role === "STORE_OWNER" ? "Store Owner" : "Staff";
  const body = `
    <p>You have been invited to join <strong>${escapeHtml(opts.storeName)}</strong> as <strong>${roleLabel}</strong>.</p>
    <div class="sp"></div>
    <p>To get started, please create your password by clicking the button below:</p>
    <p>
      <a class="btn" href="${escapeAttr(opts.actionUrl)}" target="_blank" rel="noopener">Create password</a>
    </p>
    <p class="muted">If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${escapeAttr(opts.actionUrl)}" target="_blank" rel="noopener">${escapeHtml(opts.actionUrl)}</a>
    </p>
  `;
  return baseEmailShell("You're invited", body);
}

export function resetPasswordEmail(opts: { actionUrl: string }) {
  const body = `
    <p>We received a request to reset your password.</p>
    <div class="sp"></div>
    <p>Click the button below to set a new password:</p>
    <p>
      <a class="btn" href="${escapeAttr(opts.actionUrl)}" target="_blank" rel="noopener">Reset password</a>
    </p>
    <p class="muted">If you didn't request this, you can safely ignore this email.</p>
    <p class="muted">Or use this link:<br />
      <a href="${escapeAttr(opts.actionUrl)}" target="_blank" rel="noopener">${escapeHtml(opts.actionUrl)}</a>
    </p>
  `;
  return baseEmailShell("Reset your password", body);
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(input: string) {
  // Minimal escaping suitable for attribute context
  return input.replace(/"/g, "&quot;");
}
