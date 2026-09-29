<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SuperAdminSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_the_super_admin_outside_the_local_environment(): void
    {
        config(['app.env' => 'production']);

        $this->seed(DatabaseSeeder::class);

        $admin = User::where('email', 'admin@lab.test')->firstOrFail();

        $this->assertTrue($admin->hasRole('super-admin'));
        $this->assertTrue($admin->laboratories()->where('code', 'MIKRO')->exists());
        $this->assertTrue(Hash::check('password', $admin->password));
    }

    public function test_reseeding_does_not_reset_an_existing_admin_password(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('email', 'admin@lab.test')->firstOrFail();
        $admin->update(['password' => 'a-new-secure-password']);

        $this->seed(DatabaseSeeder::class);

        $this->assertTrue(Hash::check('a-new-secure-password', $admin->fresh()->password));
        $this->assertDatabaseCount('users', 1);
    }
}
