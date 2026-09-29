<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Laboratory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditService
{
    /** @var array<int, string> */
    private const SENSITIVE_KEYS = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];

    /**
     * @param  array<string|int, mixed>|null  $oldValues
     * @param  array<string|int, mixed>|null  $newValues
     */
    public function record(
        string $action,
        Model $entity,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null,
    ): AuditLog {
        return AuditLog::create([
            'actor_id' => auth()->id(),
            'laboratory_id' => $this->laboratoryId($entity),
            'action' => $action,
            'entity_type' => class_basename($entity),
            'entity_id' => (string) $entity->getKey(),
            'old_values' => $this->sanitize($oldValues),
            'new_values' => $this->sanitize($newValues),
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }

    /**
     * @param  array<string|int, mixed>|null  $values
     * @return array<string|int, mixed>|null
     */
    private function sanitize(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        return collect($values)
            ->reject(fn (mixed $value, string|int $key): bool => in_array($key, self::SENSITIVE_KEYS, true))
            ->map(fn (mixed $value): mixed => is_array($value) ? $this->sanitize($value) : $value)
            ->all();
    }

    private function laboratoryId(Model $entity): ?int
    {
        if ($entity instanceof Laboratory) {
            return (int) $entity->getKey();
        }

        $value = $entity->getAttribute('laboratory_id');

        return $value === null ? null : (int) $value;
    }
}
