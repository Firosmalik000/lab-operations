<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->seed(AuthorizationSeeder::class);
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('name', 'staff')->firstOrFail());
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_users_without_dashboard_permission_are_forbidden(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertForbidden();
    }
}
