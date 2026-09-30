<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Models\UserInvitation;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = UserInvitation::where('token', $token)->first();

        if (! $invitation) {
            return redirect()->route('login')->with('error', 'Tautan undangan tidak valid atau tidak ditemukan.');
        }

        if ($invitation->isAccepted()) {
            return redirect()->route('login')->with('status', 'Undangan ini sudah pernah digunakan. Silakan masuk menggunakan kata sandi Anda.');
        }

        if ($invitation->isExpired()) {
            return redirect()->route('login')->with('error', 'Tautan undangan ini telah kedaluwarsa. Silakan hubungi administrator laboratorium Anda.');
        }

        return Inertia::render('auth/accept-invitation', [
            'invitation' => [
                'token' => $invitation->token,
                'name' => $invitation->name,
                'email' => $invitation->email,
                'role' => $invitation->role,
            ],
        ]);
    }

    public function store(Request $request, string $token, AuditService $audit): RedirectResponse
    {
        $invitation = UserInvitation::where('token', $token)->first();

        if (! $invitation || $invitation->isAccepted()) {
            return redirect()->route('login')->with('error', 'Undangan tidak valid atau sudah digunakan.');
        }

        if ($invitation->isExpired()) {
            return redirect()->route('login')->with('error', 'Tautan undangan telah kedaluwarsa.');
        }

        if (User::where('email', $invitation->email)->exists()) {
            return redirect()->route('login')->with('error', 'Akun dengan email ini sudah terdaftar. Silakan masuk.');
        }

        $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($invitation, $request, $audit): User {
            $user = User::create([
                'name' => $invitation->name,
                'email' => $invitation->email,
                'password' => Hash::make($request->password),
                'default_laboratory_id' => $invitation->default_laboratory_id,
                'is_active' => true,
            ]);

            $user->markEmailAsVerified();

            $staffRole = Role::where('name', $invitation->role ?: 'staff')->first()
                ?? Role::where('name', 'staff')->firstOrFail();
            $user->roles()->sync([$staffRole->id]);

            if (! empty($invitation->laboratory_ids)) {
                $user->laboratories()->sync($invitation->laboratory_ids);
            }

            $invitation->update(['accepted_at' => now()]);

            $audit->record('accept-invitation', $user, null, [
                'email' => $user->email,
                'name' => $user->name,
                'role' => $staffRole->name,
            ], $request);

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard')->with('success', "Selamat datang, {$user->name}! Akun Anda telah aktif sebagai staf.");
    }
}
