<?php

namespace App\Actions\MaterialUsage;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class GenerateMaterialUsageNumber
{
    public function handle(Carbon $date): string
    {
        $key = $date->toDateString();
        DB::table('material_usage_sequences')->insertOrIgnore(['usage_date' => $key, 'last_number' => 0]);
        $sequence = DB::table('material_usage_sequences')->where('usage_date', $key)->lockForUpdate()->first();
        $next = ((int) $sequence->last_number) + 1;
        DB::table('material_usage_sequences')->where('usage_date', $key)->update(['last_number' => $next]);

        return sprintf('USE-%s-%04d', $date->format('Ymd'), $next);
    }
}
