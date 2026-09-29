<?php

namespace Database\Seeders;

use App\Models\Laboratory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $laboratory = Laboratory::where('code', 'MIKRO')->firstOrFail();
            $role = Role::where('name', 'super-admin')->firstOrFail();

            $user = User::firstOrCreate(['email' => 'admin@lab.test'], [
                'name' => 'Administrator Laboratorium',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'default_laboratory_id' => $laboratory->id,
                'is_active' => true,
            ]);

            $user->laboratories()->syncWithoutDetaching([$laboratory->id]);
            $user->roles()->syncWithoutDetaching([$role->id]);
        });
    }
}
