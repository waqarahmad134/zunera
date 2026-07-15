<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\GeocodeController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentInController;
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\PushController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StaffOrderController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SupplierController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/push/public-key', [PushController::class, 'publicKey']);

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
Route::middleware('role:admin')->prefix('admin')->group(function () {
    Route::apiResource('customers', CustomerController::class)->except(['show']);
    Route::get('customers/{id}', [CustomerController::class, 'show']);
    Route::get('customers/{id}/balance', [CustomerController::class, 'balance']);

    Route::apiResource('employees', EmployeeController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

    Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::apiResource('suppliers', SupplierController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::apiResource('items', ItemController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::get('purchases', [PurchaseController::class, 'index']);
    Route::post('purchases', [PurchaseController::class, 'store']);
    Route::delete('purchases/{id}', [PurchaseController::class, 'destroy']);
    Route::get('purchases-next-receipt-no', [PurchaseController::class, 'nextReceiptNo']);

    Route::get('payments', [PaymentInController::class, 'index']);
    Route::post('payments', [PaymentInController::class, 'store']);
    Route::delete('payments/{id}', [PaymentInController::class, 'destroy']);

    Route::get('stats', [StatsController::class, 'index']);
    Route::get('reports', [ReportController::class, 'index']);
    Route::get('locations', [LocationController::class, 'index']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications', [NotificationController::class, 'markRead']);

    Route::post('push/subscribe', [PushController::class, 'subscribe']);
    Route::post('push/unsubscribe', [PushController::class, 'unsubscribe']);

    Route::get('geocode', [GeocodeController::class, 'geocode']);
    Route::get('reverse-geocode', [GeocodeController::class, 'reverseGeocode']);
});

// ---------------------------------------------------------------------------
// Staff (employee)
// ---------------------------------------------------------------------------
Route::middleware('role:employee')->prefix('staff')->group(function () {
    Route::get('orders', [StaffOrderController::class, 'index']);
    Route::patch('orders/{id}', [StaffOrderController::class, 'update']);

    Route::post('location', [LocationController::class, 'store']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications', [NotificationController::class, 'markRead']);

    Route::post('push/subscribe', [PushController::class, 'subscribe']);
    Route::post('push/unsubscribe', [PushController::class, 'unsubscribe']);

    Route::get('geocode', [GeocodeController::class, 'geocode']);
    Route::get('reverse-geocode', [GeocodeController::class, 'reverseGeocode']);
});

// ---------------------------------------------------------------------------
// Portal (customer)
// ---------------------------------------------------------------------------
Route::middleware('role:customer')->prefix('portal')->group(function () {
    Route::get('me', [PortalController::class, 'me']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications', [NotificationController::class, 'markRead']);

    Route::post('push/subscribe', [PushController::class, 'subscribe']);
    Route::post('push/unsubscribe', [PushController::class, 'unsubscribe']);
});
