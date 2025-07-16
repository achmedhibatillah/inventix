<?php

use App\Http\Controllers\ClientAdminController;
use App\Http\Controllers\ClientAuthController;
use App\Http\Controllers\ClientGuruController;
use App\Http\Controllers\ClientHomeController;
use App\Http\Controllers\ClientPetugasController;
use App\Http\Controllers\Inventix\CategoryController;
use App\Http\Controllers\Inventix\InventarisController;
use App\Http\Controllers\Inventix\TransactionController;
use App\Http\Controllers\Inventix\UserController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\ServerAuthController;
use App\Http\Middleware\AuthAdminMiddleware;
use App\Http\Middleware\AuthGuruMiddleware;
use App\Http\Middleware\AuthMiddleware;
use App\Http\Middleware\AuthPetugasMiddleware;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('inventaris')->middleware([AuthMiddleware::class])->group(function () {
    Route::get('/', [InventarisController::class, 'index']);
    Route::post('/', [InventarisController::class, 'store']);
    Route::get('/{code}', [InventarisController::class, 'show']);
    Route::put('/{code}', [InventarisController::class, 'update']);
    Route::delete('/{code}', [InventarisController::class, 'destroy']);
    Route::post('/storeUnit', [InventarisController::class, 'storeUnit']);
    Route::delete('/destroyUnit/{id}', [InventarisController::class, 'destroyUnit']);
    Route::put('/updateUnit/{id}', [InventarisController::class, 'updateUnit']);
});

Route::prefix('categories')->middleware([AuthMiddleware::class])->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::put('/{id}', [CategoryController::class, 'update']);
    Route::delete('/{id}', [CategoryController::class, 'destroy']);
});

Route::prefix('users')->middleware([AuthMiddleware::class])->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::post('/', [UserController::class, 'store']);
    Route::put('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
});

Route::prefix('transactions')->middleware([AuthMiddleware::class])->group(function () {
    Route::get('/', [TransactionController::class, 'index']);
    Route::get('/request', [TransactionController::class, 'indexRequest']);
    Route::post('/', [TransactionController::class, 'store']);
    Route::post('/request', [TransactionController::class, 'storeRequest']);
    Route::post('/{id}/return', [TransactionController::class, 'returnTransaction']);
    Route::post('/{id}/accept', [TransactionController::class, 'accept']);
    Route::post('/{id}/reject', [TransactionController::class, 'reject']);
    Route::get('/{id}', [TransactionController::class, 'show']);
});

Route::get('/dashboard', function () {
    $now = Carbon::now();

    $auth = session()->get('user');
    $role = $auth['user_role'];
    $userId = $auth['user_id'];

    $query = Transaction::query();

    if ($role === 'guru') {
        $query->where('user_id', $userId);
    }

    $total = (clone $query)->whereIn('transaction_status', [0,1])->count();
    $dipinjam = (clone $query)->where('transaction_status', 0)->count();
    $terlambat = (clone $query)->where('transaction_status', 0)->where('transaction_end', '<', $now)->count();

    $transactions = Transaction::query()
        ->with('user')
        ->with('inventarisd.inventaris')
        ->when($role === 'guru', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
        ->whereIn('transaction_status', [0,1])
        ->orderBy('created_at', 'desc')
        ->take(5)
        ->get();

    return Inertia::render('DashboardPage', [
        'stat' => [
            'total' => $total,
            'dipinjam' => $dipinjam,
            'terlambat' => $terlambat,
        ],
        'transaction_history' => TransactionResource::collection($transactions),
    ]);

})->middleware([AuthMiddleware::class]);

Route::get('/', function () {
    return Inertia::render('LandingPage');
});

Route::get('/auth', function () {
    return Inertia::render('Auth/AuthPage');
});

Route::post('/auth', [ServerAuthController::class, 'submit']);
Route::get('logout', function () {
    session()->flush();
});

Route::get('s', function () {
    return session()->all();
});
Route::get('d', function () {
    session()->flush();
    return redirect()->back();
});

Route::get('download-laporan', [LaporanController::class, 'download']);