<?php

namespace Tests\Feature;

use App\Enums\MaterialUsageStatus;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\ItemType;
use App\Models\Laboratory;
use App\Models\MaterialUsage;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use App\Models\UserInvitation;
use App\Notifications\UserInvitationNotification;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class UserInvitationTest extends TestCase
{
    use RefreshDatabase;

    private Laboratory $laboratory;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(AuthorizationSeeder::class);

        $this->laboratory = Laboratory::create([
            'code' => 'LAB01',
            'name' => 'Lab Utama',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'default_laboratory_id' => $this->laboratory->id,
        ]);
        $this->admin->roles()->attach(Role::where('name', 'super-admin')->firstOrFail());
        $this->admin->laboratories()->attach($this->laboratory);
    }

    public function test_admin_can_invite_staff_via_email(): void
    {
        Notification::fake();

        $response = $this->actingAs($this->admin)->post('/administration/users/invite', [
            'name' => 'Budi Santoso',
            'email' => 'budi@lab.id',
            'laboratory_ids' => [$this->laboratory->id],
            'default_laboratory_id' => $this->laboratory->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('user_invitations', [
            'email' => 'budi@lab.id',
            'name' => 'Budi Santoso',
            'role' => 'staff',
            'default_laboratory_id' => $this->laboratory->id,
            'accepted_at' => null,
        ]);

        Notification::assertSentTo(
            Notification::route('mail', 'budi@lab.id'),
            UserInvitationNotification::class
        );
    }

    public function test_invited_user_can_view_invitation_page_with_valid_token(): void
    {
        $invitation = UserInvitation::create([
            'email' => 'ani@lab.id',
            'name' => 'Ani Wijaya',
            'role' => 'staff',
            'laboratory_ids' => [$this->laboratory->id],
            'default_laboratory_id' => $this->laboratory->id,
            'token' => 'valid-test-token-12345',
            'invited_by' => $this->admin->id,
            'expires_at' => now()->addDays(3),
        ]);

        $response = $this->get("/invitations/{$invitation->token}");
        $response->assertOk();
    }

    public function test_invited_user_cannot_view_expired_invitation(): void
    {
        $invitation = UserInvitation::create([
            'email' => 'ani@lab.id',
            'name' => 'Ani Wijaya',
            'role' => 'staff',
            'laboratory_ids' => [$this->laboratory->id],
            'default_laboratory_id' => $this->laboratory->id,
            'token' => 'expired-token-123',
            'invited_by' => $this->admin->id,
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->get("/invitations/{$invitation->token}");
        $response->assertRedirect('/login');
        $response->assertSessionHas('error');
    }

    public function test_invited_user_can_set_password_and_is_assigned_staff_role(): void
    {
        $invitation = UserInvitation::create([
            'email' => 'joko@lab.id',
            'name' => 'Joko Susilo',
            'role' => 'staff',
            'laboratory_ids' => [$this->laboratory->id],
            'default_laboratory_id' => $this->laboratory->id,
            'token' => 'joko-token-456',
            'invited_by' => $this->admin->id,
            'expires_at' => now()->addDays(3),
        ]);

        $response = $this->post("/invitations/{$invitation->token}", [
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $user = User::where('email', 'joko@lab.id')->firstOrFail();
        $this->assertEquals('Joko Susilo', $user->name);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue($user->hasRole('staff'));
        $this->assertTrue($user->laboratories->contains($this->laboratory));

        $invitation->refresh();
        $this->assertNotNull($invitation->accepted_at);
    }

    public function test_admin_can_resend_invitation(): void
    {
        Notification::fake();

        $invitation = UserInvitation::create([
            'email' => 'dewi@lab.id',
            'name' => 'Dewi Lestari',
            'role' => 'staff',
            'laboratory_ids' => [$this->laboratory->id],
            'token' => 'old-token',
            'invited_by' => $this->admin->id,
            'expires_at' => now()->subHour(),
        ]);

        $response = $this->actingAs($this->admin)->post("/administration/invitations/{$invitation->id}/resend");

        $response->assertRedirect();
        $invitation->refresh();
        $this->assertNotEquals('old-token', $invitation->token);
        $this->assertTrue($invitation->expires_at->isFuture());

        Notification::assertSentTo(
            Notification::route('mail', 'dewi@lab.id'),
            UserInvitationNotification::class
        );
    }

    public function test_admin_can_cancel_invitation(): void
    {
        $invitation = UserInvitation::create([
            'email' => 'batal@lab.id',
            'name' => 'User Batal',
            'role' => 'staff',
            'laboratory_ids' => [$this->laboratory->id],
            'token' => 'token-to-delete',
            'invited_by' => $this->admin->id,
            'expires_at' => now()->addDays(1),
        ]);

        $response = $this->actingAs($this->admin)->delete("/administration/invitations/{$invitation->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('user_invitations', ['id' => $invitation->id]);
    }

    public function test_can_delete_draft_material_usage_with_proper_permission(): void
    {
        $supervisor = User::factory()->create([
            'default_laboratory_id' => $this->laboratory->id,
        ]);
        $supervisor->roles()->attach(Role::where('name', 'supervisor')->firstOrFail());
        $supervisor->laboratories()->attach($this->laboratory);

        $type = ItemType::create(['name' => 'Reagen', 'is_active' => true]);
        $category = ItemCategory::create(['item_type_id' => $type->id, 'name' => 'Asam', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Mililiter', 'symbol' => 'ml', 'is_active' => true]);
        $item = Item::create([
            'code' => 'HCL',
            'name' => 'HCl 1N',
            'item_type_id' => $type->id,
            'item_category_id' => $category->id,
            'default_unit_id' => $unit->id,
            'inventory_mode' => \App\Enums\InventoryMode::Stock,
            'is_active' => true,
        ]);

        $usage = MaterialUsage::create([
            'laboratory_id' => $this->laboratory->id,
            'created_by' => $supervisor->id,
            'number' => 'USG-DRAFT-001',
            'usage_date' => now()->toDateString(),
            'status' => MaterialUsageStatus::Draft,
            'purpose' => 'Uji Coba Delete',
        ]);
        $usage->items()->create([
            'item_id' => $item->id,
            'unit_id' => $unit->id,
            'quantity' => 10,
        ]);

        $response = $this->actingAs($supervisor)->delete("/material-usages/{$usage->id}");

        $response->assertRedirect('/material-usages');
        $this->assertDatabaseMissing('material_usages', ['id' => $usage->id]);
        $this->assertDatabaseMissing('material_usage_items', ['material_usage_id' => $usage->id]);
    }
}
