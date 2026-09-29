<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_usage_sequences', function (Blueprint $table) {
            $table->date('usage_date')->primary();
            $table->unsignedInteger('last_number')->default(0);
        });

        Schema::create('material_usages', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->date('usage_date')->index();
            $table->foreignId('laboratory_id')->constrained()->restrictOnDelete();
            $table->string('purpose')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 16)->default('SUBMITTED')->index();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('void_reason')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();
            $table->index(['laboratory_id', 'usage_date']);
        });

        Schema::create('material_usage_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_usage_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 18, 4);
            $table->foreignId('unit_id')->constrained()->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['material_usage_id', 'item_id']);
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->restrictOnDelete();
            $table->foreignId('laboratory_id')->constrained()->restrictOnDelete();
            $table->foreignId('storage_location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 24)->index();
            $table->decimal('quantity', 18, 4);
            $table->foreignId('unit_id')->constrained()->restrictOnDelete();
            $table->nullableMorphs('reference');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('created_at')->useCurrent()->index();
            $table->index(['item_id', 'laboratory_id', 'unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('material_usage_items');
        Schema::dropIfExists('material_usages');
        Schema::dropIfExists('material_usage_sequences');
    }
};
