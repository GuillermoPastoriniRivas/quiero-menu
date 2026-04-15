export function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #18181b; }
    h1 { margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; }
    p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #3f3f46; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #f97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .footer { text-align: center; margin-top: 24px; font-size: 13px; color: #a1a1aa; }
    .footer a { color: #a1a1aa; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
    .highlight { background: #fff7ed; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .highlight p { margin: 0; color: #9a3412; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">quiero-menu</div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} quiero-menu. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}
