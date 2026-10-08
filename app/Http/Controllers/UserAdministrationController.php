<?php

namespace App\Http\Controllers;

use App\Models\Laboratory;
use App\Models\MaterialUsage;
use App\Models\Role;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\UserInvitation;
use App\Services\AuditService;
use App\Services\InvitationMailService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserAdministrationController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Collection<int, UserInvitation> $invitations */
        $invitations = UserInvitation::with(['defaultLaboratory:id,name', 'inviter:id,name'])
            ->latest()
            ->get();

        return Inertia::render('administration/users', [
            'users' => User::with(['roles:id,name,label', 'laboratories:id,name', 'defaultLaboratory:id,name'])->orderBy('name')->paginate(20),
            'invitations' => $invitations
                ->map(fn (UserInvitation $invitation): array => [
                    'id' => (int) $invitation->id,
                    'email' => (string) $invitation->email,
                    'name' => (string) $invitation->name,
                    'role' => (string) $invitation->role,
                    'laboratory_ids' => (array) $invitation->laboratory_ids,
                    'default_laboratory' => $invitation->defaultLaboratory ? [
                        'id' => (int) $invitation->defaultLaboratory->id,
                        'name' => (string) $invitation->defaultLaboratory->name,
                    ] : null,
                    'inviter' => $invitation->inviter ? [
                        'id' => (int) $invitation->inviter->id,
                        'name' => (string) $invitation->inviter->name,
                    ] : null,
                    'is_pending' => $invitation->isPending(),
                    'is_expired' => $invitation->isExpired(),
                    'is_accepted' => $invitation->isAccepted(),
                    'accept_url' => route('invitations.accept', ['token' => $invitation->token]),
                    'expires_at' => $invitation->expires_at->toIso8601String(),
                    'created_at' => $invitation->created_at?->toIso8601String(),
                ])->all(),
            'roles' => Role::orderBy('label')->get(['id', 'name', 'label']),
            'laboratories' => Laboratory::orderBy('name')->get(['id', 'name']),
            'can' => [
                'manage' => $request->user()->can('users.manage'),
            ],
            'currentUserId' => $request->user()->id,
        ]);
    }

    public function invite(Request $request, AuditService $audit, InvitationMailService $mailService): RedirectResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'laboratory_ids' => ['required', 'array', 'min:1'],
            'laboratory_ids.*' => ['integer', 'distinct', 'exists:laboratories,id'],
            'default_laboratory_id' => ['nullable', 'integer', 'exists:laboratories,id'],
        ]);

        if (! empty($data['default_laboratory_id']) && ! in_array((int) $data['default_laboratory_id'], array_map('intval', $data['laboratory_ids']), true)) {
            throw ValidationException::withMessages(['default_laboratory_id' => 'Laboratorium default harus termasuk dalam akses user.']);
        }

        // Clean up previous pending invitations for the same email
        UserInvitation::where('email', $data['email'])->whereNull('accepted_at')->delete();

        $invitation = UserInvitation::create([
            'email' => $data['email'],
            'name' => $data['name'],
            'laboratory_ids' => array_values(array_map('intval', $data['laboratory_ids'])),
            'default_laboratory_id' => $data['default_laboratory_id'] ? (int) $data['default_laboratory_id'] : null,
            'role' => 'staff',
            'token' => Str::random(64),
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(3),
        ]);

        $mailService->send($invitation);

        $audit->record('invite', $invitation, null, $invitation->toArray(), $request);

        return back()->with('success', "Undangan berhasil dikirim ke {$invitation->email}.");
    }

    public function resendInvitation(Request $request, UserInvitation $invitation, AuditService $audit, InvitationMailService $mailService): RedirectResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);

        if ($invitation->isAccepted()) {
            return back()->with('error', 'Undangan ini sudah diterima oleh user.');
        }

        $invitation->update([
            'token' => Str::random(64),
            'expires_at' => now()->addDays(3),
        ]);

        $mailService->send($invitation);

        $audit->record('resend-invite', $invitation, null, $invitation->toArray(), $request);

        return back()->with('success', "Undangan berhasil dikirim ulang ke {$invitation->email}.");
    }

    public function destroyInvitation(Request $request, UserInvitation $invitation, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);

        if ($invitation->isAccepted()) {
            return back()->with('error', 'Undangan yang sudah diterima tidak dapat dibatalkan.');
        }

        $old = $invitation->toArray();
        $invitation->delete();
        $audit->record('cancel-invite', $invitation, $old, null, $request);

        return back()->with('success', 'Undangan berhasil dibatalkan.');
    }

    public function update(Request $request, User $user, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'distinct', 'exists:roles,id'],
            'laboratory_ids' => ['required', 'array', 'min:1'],
            'laboratory_ids.*' => ['integer', 'distinct', 'exists:laboratories,id'],
            'default_laboratory_id' => ['nullable', 'integer', 'exists:laboratories,id'],
            'is_active' => ['required', 'boolean'],
        ]);
        if (! empty($data['default_laboratory_id']) && ! in_array((int) $data['default_laboratory_id'], array_map('intval', $data['laboratory_ids']), true)) {
            throw ValidationException::withMessages(['default_laboratory_id' => 'Laboratorium default harus termasuk dalam akses user.']);
        }
        $superAdminId = Role::where('name', 'super-admin')->value('id');
        $removesSuperAdmin = $user->roles()->whereKey($superAdminId)->exists()
            && (! in_array((int) $superAdminId, array_map('intval', $data['role_ids']), true) || ! $data['is_active']);
        if ($removesSuperAdmin && User::where('is_active', true)->whereHas('roles', fn ($query) => $query->where('roles.id', $superAdminId))->count() <= 1) {
            throw ValidationException::withMessages(['role_ids' => 'Super Admin aktif terakhir tidak dapat dinonaktifkan atau dihapus rolenya.']);
        }
        DB::transaction(function () use ($user, $data, $audit, $request): void {
            $old = [
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles()->pluck('roles.id'),
                'laboratories' => $user->laboratories()->pluck('laboratories.id'),
                'is_active' => $user->is_active,
            ];
            $user->roles()->sync($data['role_ids']);
            $user->laboratories()->sync($data['laboratory_ids']);

            $updatePayload = [
                'name' => $data['name'],
                'email' => $data['email'],
                'default_laboratory_id' => $data['default_laboratory_id'],
                'is_active' => $data['is_active'],
            ];

            if (! empty($data['password'])) {
                $updatePayload['password'] = Hash::make($data['password']);
            }

            $user->update($updatePayload);
            $audit->record('update', $user, $old, array_diff_key($data, array_flip(['password', 'password_confirmation'])), $request);
        });

        return back()->with('success', "Data user {$user->name} berhasil diperbarui.");
    }

    public function store(Request $request, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'distinct', 'exists:roles,id'],
            'laboratory_ids' => ['required', 'array', 'min:1'],
            'laboratory_ids.*' => ['integer', 'distinct', 'exists:laboratories,id'],
            'default_laboratory_id' => ['nullable', 'integer', 'exists:laboratories,id'],
        ]);
        if (! empty($data['default_laboratory_id']) && ! in_array((int) $data['default_laboratory_id'], array_map('intval', $data['laboratory_ids']), true)) {
            throw ValidationException::withMessages(['default_laboratory_id' => 'Laboratorium default harus termasuk dalam akses user.']);
        }
        $user = DB::transaction(function () use ($data, $audit, $request): User {
            $user = User::create([
                'name' => $data['name'], 'email' => $data['email'], 'password' => Hash::make($data['password']),
                'default_laboratory_id' => $data['default_laboratory_id'], 'is_active' => true,
            ]);
            $user->markEmailAsVerified();
            $user->roles()->sync($data['role_ids']);
            $user->laboratories()->sync($data['laboratory_ids']);
            $audit->record('create', $user, null, array_diff_key($data, array_flip(['password', 'password_confirmation'])), $request);

            return $user;
        });

        return back()->with('success', "User {$user->name} berhasil dibuat.");
    }

    public function destroy(Request $request, User $user, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('users.manage'), 403);

        if ($request->user()->id === $user->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $superAdminId = Role::where('name', 'super-admin')->value('id');
        $isSuperAdmin = $user->roles()->whereKey($superAdminId)->exists();
        if ($isSuperAdmin && User::where('is_active', true)->whereHas('roles', fn ($q) => $q->where('roles.id', $superAdminId))->count() <= 1) {
            return back()->with('error', 'Super Admin aktif terakhir tidak dapat dihapus.');
        }

        if (StockMovement::where('created_by', $user->id)->exists() || MaterialUsage::where('created_by', $user->id)->exists()) {
            return back()->with('error', 'User tidak dapat dihapus karena memiliki riwayat transaksi tercatat. Anda dapat menonaktifkan status akunnya.');
        }

        $old = [
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles()->pluck('roles.id'),
            'laboratories' => $user->laboratories()->pluck('laboratories.id'),
        ];

        DB::transaction(function () use ($user, $audit, $request, $old): void {
            $user->roles()->detach();
            $user->laboratories()->detach();
            $audit->record('delete', $user, $old, null, $request);
            $user->delete();
        });

        return back()->with('success', "User {$user->name} berhasil dihapus.");
    }
}
