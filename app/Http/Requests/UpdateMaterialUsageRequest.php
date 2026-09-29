<?php

namespace App\Http\Requests;

class UpdateMaterialUsageRequest extends StoreMaterialUsageRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('material-usage.update') === true;
    }
}
