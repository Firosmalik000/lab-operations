<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Undangan Bergabung ke Sistem Operasional Laboratorium</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 12px !important; }
            .content-card { padding: 24px 18px !important; }
            .button { width: 100% !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 32px 0; background-color: #f8fafc; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <!-- Wrapper -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto;" class="email-container">
                    
                    <!-- Header / Branding -->
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color: #0f172a; padding: 8px 16px; border-radius: 9999px;">
                                        <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                                            {{ $appName }} &bull; Operasional Lab
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); padding: 36px 32px;" class="content-card">
                            
                            <!-- Greeting & Intro -->
                            <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                                Undangan Bergabung
                            </h1>
                            <p style="margin: 0 0 20px 0; font-size: 15px; color: #64748b; line-height: 1.5;">
                                Halo <strong style="color: #0f172a;">{{ $invitation->name }}</strong>,
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                                Anda telah diundang oleh administrator untuk bergabung ke sistem manajemen operasional laboratorium. Akun Anda telah disiapkan dan siap diaktifkan.
                            </p>

                            <!-- Information Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 18px 20px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 10px; font-size: 13px; color: #64748b; width: 130px;">Peran Akses</td>
                                                <td style="padding-bottom: 10px; font-size: 13px; color: #0f172a; font-weight: 600;">
                                                    <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; padding: 2px 10px; border-radius: 9999px; font-size: 11px; text-transform: uppercase; font-weight: 700;">
                                                        {{ $invitation->role ?? 'Staff' }}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 10px; font-size: 13px; color: #64748b;">Email Terdaftar</td>
                                                <td style="padding-bottom: 10px; font-size: 13px; color: #0f172a; font-weight: 600;">
                                                    {{ $invitation->email }}
                                                </td>
                                            </tr>
                                            @if(!empty($laboratoryNames))
                                            <tr>
                                                <td style="padding-bottom: 10px; font-size: 13px; color: #64748b; vertical-align: top;">Akses Laboratorium</td>
                                                <td style="padding-bottom: 10px; font-size: 13px; color: #0f172a; font-weight: 500; line-height: 1.4;">
                                                    {{ implode(', ', $laboratoryNames) }}
                                                </td>
                                            </tr>
                                            @endif
                                            <tr>
                                                <td style="font-size: 13px; color: #64748b;">Berlaku Hingga</td>
                                                <td style="font-size: 13px; color: #dc2626; font-weight: 600;">
                                                    {{ $invitation->expires_at->format('d/m/Y H:i') }} WIB
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Primary Action Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $acceptUrl }}" target="_blank" class="button" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; letter-spacing: 0.01em; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);">
                                            Aktivasi Akun &amp; Buat Kata Sandi &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Fallback Link -->
                            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 20px;">
                                <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; line-height: 1.4;">
                                    Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di peramban Anda:
                                </p>
                                <p style="margin: 0; font-size: 11px; word-break: break-all; color: #2563eb; background-color: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: monospace;">
                                    {{ $acceptUrl }}
                                </p>
                            </div>

                            <!-- Security Notice -->
                            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 14px;">
                                <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                                    <strong>Perhatian:</strong> Tautan aktivasi ini berlaku selama 3 hari. Jangan bagikan email ini kepada siapapun untuk menjaga keamanan akun Anda. Jika Anda tidak mengenali undangan ini, Anda dapat mengabaikan email ini.
                                </p>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding-top: 28px; padding-bottom: 16px;">
                            <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;">
                                &copy; {{ date('Y') }} {{ $appName }}. Seluruh hak cipta dilindungi.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                                Email ini dibuat secara otomatis oleh sistem, mohon untuk tidak membalas langsung email ini.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
