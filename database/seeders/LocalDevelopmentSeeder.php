<?php

namespace Database\Seeders;

use App\Models\Laboratory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LocalDevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        $laboratory = Laboratory::where('code', 'MIKRO')->firstOrFail();
        $user = User::updateOrCreate(['email' => 'admin@lab.test'], [
            'name' => 'Administrator Laboratorium',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'default_laboratory_id' => $laboratory->id,
            'is_active' => true,
        ]);
        $user->laboratories()->syncWithoutDetaching([$laboratory->id]);
        $user->roles()->syncWithoutDetaching([Role::where('name', 'super-admin')->firstOrFail()->id]);
    }
}
