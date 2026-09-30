<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('name');
            $table->json('laboratory_ids');
            $table->foreignId('default_laboratory_id')->nullable()->constrained('laboratories')->nullOnDelete();
            $table->string('role')->default('staff');
            $table->string('token', 64)->unique();
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->index();
            $table->timestamp('accepted_at')->nullable()->index();
            $table->timestamps();
        });

        // Ensure material-usage.delete permission is present and granted to super-admin and supervisor
        $now = now();
        $permId = DB::table('permissions')->where('name', 'material-usage.delete')->value('id');
        if (! $permId) {
            $permId = DB::table('permissions')->insertGetId([
                'name' => 'material-usage.delete',
                'label' => 'Menghapus draf penggunaan bahan',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $roles = DB::table('roles')->whereIn('name', ['super-admin', 'supervisor'])->pluck('id');
        foreach ($roles as $roleId) {
            DB::table('permission_role')->insertOrIgnore([
                'permission_id' => $permId,
                'role_id' => $roleId,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_invitations');

        $permId = DB::table('permissions')->where('name', 'material-usage.delete')->value('id');
        if ($permId) {
            DB::table('permission_role')->where('permission_id', $permId)->delete();
            DB::table('permissions')->where('id', $permId)->delete();
        }
    }
};
