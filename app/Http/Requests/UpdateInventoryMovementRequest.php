<?php

namespace App\Http\Requests;

class UpdateInventoryMovementRequest extends InventoryMovementRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('inventory.update') === true;
    }
}
