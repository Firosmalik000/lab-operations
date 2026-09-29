<?php

namespace App\Http\Controllers;

use App\Models\Laboratory;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserAdministrationController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('administration/users', [
            'users' => User::with(['roles:id,name,label', 'laboratories:id,name', 'defaultLaboratory:id,name'])->orderBy('name')->paginate(20),
            'roles' => Role::orderBy('label')->get(['id', 'name', 'label']),
            'laboratories' => Laboratory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, User $user, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('roles.manage'), 403);
        $data = $request->validate([
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
            $old = ['roles' => $user->roles()->pluck('roles.id'), 'laboratories' => $user->laboratories()->pluck('laboratories.id'), 'is_active' => $user->is_active];
            $user->roles()->sync($data['role_ids']);
            $user->laboratories()->sync($data['laboratory_ids']);
            $user->update(['default_laboratory_id' => $data['default_laboratory_id'], 'is_active' => $data['is_active']]);
            $audit->record('permission-change', $user, $old, $data, $request);
        });

        return back()->with('success', 'Akses user berhasil diperbarui.');
    }

    public function store(Request $request, AuditService $audit): RedirectResponse
    {
        abort_unless($request->user()->can('roles.manage'), 403);
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
}
