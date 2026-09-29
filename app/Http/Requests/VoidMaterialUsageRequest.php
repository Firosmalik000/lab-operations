<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VoidMaterialUsageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('material-usage.void') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['reason' => ['required', 'string', 'min:5', 'max:1000']];
    }
}
