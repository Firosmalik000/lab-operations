<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('item_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('item_categories')->nullOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->unique(['item_type_id', 'name']);
        });

        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('symbol')->unique();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('storage_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laboratory_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->unique(['laboratory_id', 'name']);
        });

        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name')->index();
            $table->foreignId('item_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('item_categories')->nullOnDelete();
            $table->foreignId('default_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->string('inventory_mode', 16)->default('NONE')->index();
            $table->decimal('minimum_stock', 18, 4)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('item_laboratory', function (Blueprint $table) {
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('laboratory_id')->constrained()->cascadeOnDelete();
            $table->primary(['item_id', 'laboratory_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_laboratory');
        Schema::dropIfExists('items');
        Schema::dropIfExists('storage_locations');
        Schema::dropIfExists('units');
        Schema::dropIfExists('item_categories');
        Schema::dropIfExists('item_types');
    }
};
