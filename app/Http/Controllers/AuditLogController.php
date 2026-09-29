<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $query = AuditLog::query()->with('actor:id,name,email');
        if (! $request->user()->hasRole('super-admin')) {
            $query->whereIn('laboratory_id', $request->user()->laboratoryIds());
        }
        $query->when($request->filled('search'), function ($query) use ($request): void {
            $search = '%'.$request->string('search')->value().'%';
            $query->where(fn ($inner) => $inner->where('action', 'like', $search)->orWhere('entity_type', 'like', $search)->orWhere('entity_id', 'like', $search));
        });

        return Inertia::render('administration/audit', [
            'logs' => $query->latest('created_at')->paginate(25)->withQueryString(),
            'filters' => $request->only('search'),
        ]);
    }
}
