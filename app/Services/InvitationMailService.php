<?php

namespace App\Services;

use App\Mail\UserInvitationMail;
use App\Models\UserInvitation;
use Illuminate\Support\Facades\Mail;

class InvitationMailService
{
    public function send(UserInvitation $invitation): void
    {
        Mail::to($invitation->email)->send(new UserInvitationMail($invitation));
    }
}
