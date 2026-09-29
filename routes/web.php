<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\MaterialUsageController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleAdministrationController;
use App\Http\Controllers\UserAdministrationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->middleware('can:dashboard.view')->name('dashboard');

    Route::get('material-usages/items', [MaterialUsageController::class, 'items'])->name('material-usages.items');
    Route::get('material-usages', [MaterialUsageController::class, 'index'])->middleware('can:material-usage.view')->name('material-usages.index');
    Route::get('material-usages/create', [MaterialUsageController::class, 'create'])->middleware('can:material-usage.create')->name('material-usages.create');
    Route::post('material-usages', [MaterialUsageController::class, 'store'])->name('material-usages.store');
    Route::get('material-usages/{materialUsage}/edit', [MaterialUsageController::class, 'edit'])->middleware('can:material-usage.update')->name('material-usages.edit');
    Route::put('material-usages/{materialUsage}', [MaterialUsageController::class, 'update'])->name('material-usages.update');
    Route::get('material-usages/{materialUsage}', [MaterialUsageController::class, 'show'])->middleware('can:material-usage.view')->name('material-usages.show');
    Route::post('material-usages/{materialUsage}/void', [MaterialUsageController::class, 'void'])->name('material-usages.void');

    Route::get('inventory/stock', [InventoryController::class, 'stock'])->middleware('can:inventory.view')->name('inventory.stock');
    Route::get('inventory/movements', [InventoryController::class, 'movements'])->middleware('can:inventory.view')->name('inventory.movements');
    Route::get('inventory/create', [InventoryController::class, 'create'])->middleware('can:inventory.view')->name('inventory.create');
    Route::post('inventory/movements', [InventoryController::class, 'store'])->name('inventory.store');

    Route::get('master/items', [ItemController::class, 'index'])->middleware('can:items.view')->name('items.index');
    Route::post('master/items', [ItemController::class, 'store'])->name('items.store');
    Route::put('master/items/{item}', [ItemController::class, 'update'])->name('items.update');
    Route::get('master/{resource}', [MasterDataController::class, 'index'])->whereIn('resource', ['laboratories', 'item-types', 'categories', 'units', 'storage-locations'])->name('master.index');
    Route::post('master/{resource}', [MasterDataController::class, 'store'])->whereIn('resource', ['laboratories', 'item-types', 'categories', 'units', 'storage-locations'])->name('master.store');
    Route::put('master/{resource}/{id}', [MasterDataController::class, 'update'])->whereIn('resource', ['laboratories', 'item-types', 'categories', 'units', 'storage-locations'])->name('master.update');

    Route::get('reports', [ReportController::class, 'index'])->middleware('can:reports.view')->name('reports.index');
    Route::get('reports/export', [ReportController::class, 'export'])->middleware('can:reports.view')->name('reports.export');
    Route::get('administration/audit', AuditLogController::class)->middleware('can:audit.view')->name('audit.index');
    Route::get('administration/users', [UserAdministrationController::class, 'index'])->middleware('can:users.manage')->name('users.index');
    Route::post('administration/users', [UserAdministrationController::class, 'store'])->middleware('can:users.manage')->name('users.store');
    Route::put('administration/users/{user}', [UserAdministrationController::class, 'update'])->middleware('can:users.manage')->name('users.update');
    Route::get('administration/roles', [RoleAdministrationController::class, 'index'])->middleware('can:roles.manage')->name('roles.index');
    Route::put('administration/roles/{role}', [RoleAdministrationController::class, 'update'])->middleware('can:roles.manage')->name('roles.update');
});

require __DIR__.'/settings.php';
