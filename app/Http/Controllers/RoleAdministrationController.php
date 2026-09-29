<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleAdministrationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('administration/roles', [
            'roles' => Role::with('permissions:id,name,label')->withCount('users')->orderBy('label')->get(),
            'permissions' => Permission::orderBy('name')->get(['id', 'name', 'label']),
        ]);
    }

    public function update(Request $request, Role $role, AuditService $audit): RedirectResponse
    {
        abort_if($role->name === 'super-admin', 403, 'Permission Super Admin tidak dapat dikurangi.');
        $data = $request->validate([
            'label' => ['required', 'string', 'max:100', Rule::unique('roles', 'label')->ignore($role)],
            'permission_ids' => ['required', 'array'],
            'permission_ids.*' => ['integer', 'distinct', 'exists:permissions,id'],
        ]);
        DB::transaction(function () use ($role, $data, $audit, $request): void {
            $old = ['label' => $role->label, 'permissions' => $role->permissions()->pluck('permissions.id')->all()];
            $role->update(['label' => $data['label']]);
            $role->permissions()->sync($data['permission_ids']);
            $audit->record('permission-change', $role, $old, $data, $request);
        });

        return back()->with('success', 'Role dan permission berhasil diperbarui.');
    }
}
