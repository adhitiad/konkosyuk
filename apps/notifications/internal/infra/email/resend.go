package email

import (
	"fmt"
	"strings"

	"github.com/resend/resend-go/v3"
)

type EmailSender struct {
	client    *resend.Client
	fromEmail string
}

func NewEmailSender(apiKey, fromEmail string) *EmailSender {
	if apiKey == "" {
		return nil
	}
	client := resend.NewClient(apiKey)
	return &EmailSender{
		client:    client,
		fromEmail: getFromEmail(fromEmail),
	}
}

func getFromEmail(configuredFrom string) string {
	if configuredFrom != "" {
		return configuredFrom
	}
	return "KonkosYuk <onboarding@resend.dev>"
}

func escapeHtml(value string) string {
	value = strings.ReplaceAll(value, "&", "&amp;")
	value = strings.ReplaceAll(value, "<", "&lt;")
	value = strings.ReplaceAll(value, ">", "&gt;")
	value = strings.ReplaceAll(value, "'", "&#39;")
	value = strings.ReplaceAll(value, "\"", "&quot;")
	return value
}

func (s *EmailSender) SendMaintenanceReportCreated(to, recipientName, propertyName, category, description string) error {
	if s == nil {
		return nil
	}

	subject := "Laporan Masalah Baru - KonkosYuk"
	heading := fmt.Sprintf("Halo %s, ada laporan masalah baru", escapeHtml(recipientName))
	content := fmt.Sprintf("<p><strong>Properti:</strong> %s</p><p><strong>Kategori:</strong> %s</p><p><strong>Deskripsi:</strong> %s</p>",
		escapeHtml(propertyName), escapeHtml(category), escapeHtml(description))

	return s.sendEmail(to, subject, heading, content)
}

func (s *EmailSender) SendMaintenanceReportUpdated(to, recipientName, status, resolutionNote string) error {
	if s == nil {
		return nil
	}

	subject := "Status Laporan Masalah Diperbarui - KonkosYuk"
	heading := fmt.Sprintf("Halo %s, status laporan Anda berubah", escapeHtml(recipientName))
	var contentBuilder strings.Builder
	contentBuilder.WriteString(fmt.Sprintf("<p><strong>Status:</strong> %s</p>", escapeHtml(status)))
	if resolutionNote != "" {
		contentBuilder.WriteString(fmt.Sprintf("<p><strong>Catatan:</strong> %s</p>", escapeHtml(resolutionNote)))
	}

	return s.sendEmail(to, subject, heading, contentBuilder.String())
}

func (s *EmailSender) SendApprovalEmail(tenantEmail, tenantName, propertyName, unitName string, dpAmount float64, invoiceURL string) error {
	if s == nil {
		return nil
	}

	subject := "Permintaan Sewa Anda Disetujui - KonkosYuk"
	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
			<h2 style="color: #2563eb;">Halo %s,</h2>
			<p>Permintaan sewa Anda telah disetujui oleh pemilik properti.</p>
			<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
				<p><strong>Properti:</strong> %s</p>
				<p><strong>Unit:</strong> %s</p>
				<p><strong>DP yang harus dibayar:</strong> Rp %s</p>
			</div>
			<p>Silakan selesaikan pembayaran DP untuk mengunci kamar Anda.</p>
			<a href="%s" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Bayar DP Sekarang</a>
			<p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
		</div>
	`,
		escapeHtml(tenantName),
		escapeHtml(propertyName),
		escapeHtml(unitName),
		fmt.Sprintf("%.2f", dpAmount),
		escapeHtml(invoiceURL),
	)

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{tenantEmail},
		Subject: subject,
		Html:    htmlContent,
	})
	if err != nil {
		return fmt.Errorf("failed to send approval email: %w", err)
	}
	return nil
}

func (s *EmailSender) SendBookingRequestEmail(ownerEmail, ownerName, tenantName, propertyName, unitName, bookingURL string) error {
	if s == nil {
		return nil
	}

	subject := "Permintaan Booking Baru - KonkosYuk"
	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
			<h2 style="color: #2563eb;">Halo %s,</h2>
			<p>Ada permintaan booking baru untuk properti Anda.</p>
			<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
				<p><strong>Tenant:</strong> %s</p>
				<p><strong>Properti:</strong> %s</p>
				<p><strong>Unit:</strong> %s</p>
			</div>
			<a href="%s" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Lihat Detail Booking</a>
			<p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
		</div>
	`,
		escapeHtml(ownerName),
		escapeHtml(tenantName),
		escapeHtml(propertyName),
		escapeHtml(unitName),
		escapeHtml(bookingURL),
	)

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{ownerEmail},
		Subject: subject,
		Html:    htmlContent,
	})
	if err != nil {
		return fmt.Errorf("failed to send booking request email: %w", err)
	}
	return nil
}

func (s *EmailSender) SendBookingRejectionEmail(tenantEmail, tenantName, propertyName, unitName, reason string) error {
	if s == nil {
		return nil
	}

	subject := "Permintaan Booking Ditolak - KonkosYuk"
	var reasonHTML string
	if reason != "" {
		reasonHTML = fmt.Sprintf("<p><strong>Alasan:</strong> %s</p>", escapeHtml(reason))
	}

	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
			<h2 style="color: #dc2626;">Halo %s,</h2>
			<p>Mohon maaf, permintaan booking Anda untuk properti berikut telah ditolak:</p>
			<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
				<p><strong>Properti:</strong> %s</p>
				<p><strong>Unit:</strong> %s</p>
				%s
			</div>
			<p>Silakan cari properti lain yang tersedia di KonkosYuk.</p>
			<p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
		</div>
	`,
		escapeHtml(tenantName),
		escapeHtml(propertyName),
		escapeHtml(unitName),
		reasonHTML,
	)

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{tenantEmail},
		Subject: subject,
		Html:    htmlContent,
	})
	if err != nil {
		return fmt.Errorf("failed to send booking rejection email: %w", err)
	}
	return nil
}

func (s *EmailSender) SendChatNotificationEmail(to, recipientName, senderName, messagePreview, chatURL string) error {
	if s == nil {
		return nil
	}

	subject := fmt.Sprintf("Pesan baru dari %s - KonkosYuk", escapeHtml(senderName))
	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
			<h2 style="color: #2563eb;">Halo %s,</h2>
			<p>Anda menerima pesan baru dari <strong>%s</strong>:</p>
			<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
				<p>"%s"</p>
			</div>
			<a href="%s" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Buka Chat</a>
			<p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
		</div>
	`,
		escapeHtml(recipientName),
		escapeHtml(senderName),
		escapeHtml(messagePreview),
		escapeHtml(chatURL),
	)

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{to},
		Subject: subject,
		Html:    htmlContent,
	})
	if err != nil {
		return fmt.Errorf("failed to send chat notification email: %w", err)
	}
	return nil
}

func (s *EmailSender) SendPaymentReceivedEmail(ownerEmail, ownerName, tenantName, propertyName string, amount float64, paymentURL string) error {
	if s == nil {
		return nil
	}

	subject := "Pembayaran Diterima - KonkosYuk"
	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
			<h2 style="color: #2563eb;">Halo %s,</h2>
			<p>Pembayaran dari <strong>%s</strong> telah diterima.</p>
			<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
				<p><strong>Properti:</strong> %s</p>
				<p><strong>Jumlah:</strong> Rp %.2f</p>
			</div>
			<a href="%s" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Lihat Detail</a>
			<p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
		</div>
	`,
		escapeHtml(ownerName),
		escapeHtml(tenantName),
		escapeHtml(propertyName),
		amount,
		escapeHtml(paymentURL),
	)

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{ownerEmail},
		Subject: subject,
		Html:    htmlContent,
	})
	if err != nil {
		return fmt.Errorf("failed to send payment received email: %w", err)
	}
	return nil
}

func (s *EmailSender) SendReEngagementEmail(to string, name string, isOwner bool) error {
	if s == nil {
		return nil
	}

	recipientName := "Pengguna"
	if name != "" {
		recipientName = name
	}

	subject := "KonkosYuk: Ada properti baru yang mungkin Anda suka!"
	var content string
	if isOwner {
		content = fmt.Sprintf(`<p>Properti Anda belum mendapatkan inquiry baru. Yuk, tingkatkan visibilitas dengan menambahkan foto dan verifikasi GPS.</p>
		<p><a href="%s/owner/properties" style="color:#2563eb;text-decoration:underline">Kelola Properti Saya</a></p>`,
			"https://konkosyuk.com")
	} else {
		content = fmt.Sprintf(`<p>Sudah lama kami tidak melihat aktivitas Anda. Kami ingin membantu Anda menemukan properti impian!</p>
		<p><a href="%s/properties" style="color:#2563eb;text-decoration:underline">Jelajahi Properti Sekarang</a></p>`,
			"https://konkosyuk.com")
	}

	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
			<h2 style="color: #2563eb;">%s</h2>
			%s
			<p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
		</div>
	`,
		escapeHtml(fmt.Sprintf("Kami merindukan Anda, %s!", recipientName)),
		content,
	)

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{to},
		Subject: subject,
		Html:    htmlContent,
	})
	if err != nil {
		return fmt.Errorf("failed to send re-engagement email: %w", err)
	}
	return nil
}

func (s *EmailSender) sendEmail(to, subject, heading, content string) error {
	if s == nil {
		return nil
	}

	htmlContent := fmt.Sprintf(`
		<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;color:#333">
			<h2 style="color:#2563eb">%s</h2>%s
			<p style="margin-top:24px;font-size:12px;color:#64748b">Email otomatis dari KonkosYuk.</p>
		</div>
	`, escapeHtml(heading), content)

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{to},
		Subject: subject,
		Html:    htmlContent,
	})
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	return nil
}
