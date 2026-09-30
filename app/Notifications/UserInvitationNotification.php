<?php

namespace App\Notifications;

use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(public UserInvitation $invitation) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $acceptUrl = url(route('invitations.accept', ['token' => $this->invitation->token]));

        return (new MailMessage)
            ->subject('Undangan Bergabung ke Sistem Operasional Lab')
            ->greeting("Halo, {$this->invitation->name}")
            ->line('Anda telah diundang untuk bergabung ke sistem operasional laboratorium sebagai staf.')
            ->action('Aktivasi Akun & Buat Password', $acceptUrl)
            ->line("Tautan undangan ini berlaku hingga {$this->invitation->expires_at->format('d/m/Y H:i')}.")
            ->line('Jika Anda merasa tidak seharusnya menerima undangan ini, silakan abaikan email ini.');
    }
}
