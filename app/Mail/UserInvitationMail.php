<?php

namespace App\Mail;

use App\Models\Laboratory;
use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public UserInvitation $invitation) {}

    public function envelope(): Envelope
    {
        $appName = (string) config('app.name', 'Operasional Lab');

        return new Envelope(
            subject: "Undangan Bergabung ke Sistem Operasional Lab - {$appName}",
        );
    }

    public function content(): Content
    {
        $laboratoryNames = Laboratory::whereIn('id', $this->invitation->laboratory_ids)
            ->pluck('name')
            ->all();

        return new Content(
            view: 'emails.user-invitation',
            with: [
                'invitation' => $this->invitation,
                'acceptUrl' => url(route('invitations.accept', ['token' => $this->invitation->token])),
                'appName' => (string) config('app.name', 'Operasional Lab'),
                'laboratoryNames' => $laboratoryNames,
            ],
        );
    }
}
