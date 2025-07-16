<?php

namespace App\Http\Controllers\Inventix;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Inventarisd;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Response;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $auth = session()->get('user');
        $role = $auth['user_role'];

        $filter = $request->query('status'); // 'aktif', 'terlambat', 'selesai'
        $now = Carbon::now();

        $query = Transaction::with('user')
            ->with('inventarisd.inventaris');

        if ($role === 'guru') {
            $query->where('user_id', $auth['user_id']);
        }

        if ($filter) {
            if ($filter === 'aktif') {
                $query->where('transaction_status', 0)->where('transaction_end', '>=', $now);
            } elseif ($filter === 'terlambat') {
                $query->where('transaction_status', 0)->where('transaction_end', '<', $now);
            } elseif ($filter === 'selesai') {
                $query->where('transaction_status', 1);
            } 
        }  else {
            $query->whereIn('transaction_status', [0, 1]);
        }

        $transactions = $query
            ->orderBy('created_at', 'desc')
            ->orderBy('transaction_start', 'desc')
            ->get();

        return Inertia::render(
            'TransactionPage',
            [
                'transactions' => TransactionResource::collection($transactions),
                'status_options' => [
                    [
                        'label' => 'Aktif',
                        'value' => 'aktif',
                    ],
                    [
                        'label' => 'Terlambat',
                        'value' => 'terlambat',
                    ],
                    [
                        'label' => 'Selesai',
                        'value' => 'selesai',
                    ],
                ],
            ],
        );
    }

    public function indexRequest(Request $request)
    {
        $auth = session()->get('user');
        $role = $auth['user_role'];

        $query = Transaction::with('user')
            ->with('inventarisd.inventaris');

        if ($role === 'guru') {
            $query->where('user_id', $auth['user_id']);
        }

        $transactions = $query
            ->whereIn('transaction_status', [2, 3])
            ->orderBy('created_at', 'desc')
            ->orderBy('transaction_start', 'desc')
            ->get();

        return Inertia::render(
            'TransactionRequestPage',
            [
                'transactions' => TransactionResource::collection($transactions),
            ],
        );
    }

    public function show(string $id)
    {
        $transaction = Transaction::where('transaction_code', $id)
            ->with('user')
            ->with('inventarisd.inventaris')
            ->first();

        return Inertia::render('TransactionDetailPage', [
            'transaction' => TransactionResource::make($transaction),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_desc' => 'nullable|string|max:500',
            'transaction_start' => 'required|date',
            'transaction_end' => 'required|date|after_or_equal:transaction_start',
            'user_id' => 'required|exists:users,user_id',
            'inventarisd_id' => 'required|exists:inventarisd,inventarisd_id',
        ]);

        $peminjam = User::where('user_id', $validated['user_id'])->first();

        if ($peminjam->user_role !== 'guru') {
            return redirect()->back()->with('error', 'Peminjam harus user dengan tipe role guru');
        }

        $alreadyTx = Transaction::where('user_id', $peminjam->user_id)
            ->where('inventarisd_id', $validated['inventarisd_id'])
            ->where('transaction_status', 2)
            ->exists();

        if ($alreadyTx) {
            return redirect()->back()->with('error', $peminjam->user_fullname . ' ' . 'sudah mengajukan peminjaman');
        }

        $validated['transaction_start'] = Carbon::parse($validated['transaction_start'])->format('Y-m-d');
        $validated['transaction_end'] = Carbon::parse($validated['transaction_end'])->format('Y-m-d');

        DB::beginTransaction();

        try {
            Transaction::where('inventarisd_id', $validated['inventarisd_id'])
                ->where('transaction_status', 2)
                ->update(['transaction_status' => 3]);

            do {
                $code = random_int(100000, 999999);
            } while (Transaction::where('transaction_code', $code)->exists());

            $transaction = Transaction::create([
                'transaction_code' => $code,
                'transaction_desc' => $validated['transaction_desc'] ?? null,
                'transaction_start' => $validated['transaction_start'],
                'transaction_end' => $validated['transaction_end'],
                'transaction_status' => 0,
                'user_id' => $validated['user_id'],
                'inventarisd_id' => $validated['inventarisd_id'],
            ]);

            Inventarisd::where('inventarisd_id', $validated['inventarisd_id'])
                ->update(['inventarisd_status' => 'terpinjam']);

            DB::commit();
            return redirect()->back()->with('success', 'Transaksi peminjaman berhasil ditambahkan.');

        } catch (\Throwable $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menambahkan transaksi. Silakan coba lagi.');
        }
    }

    public function storeRequest(Request $request)
    {
        $validated = $request->validate([
            'transaction_desc' => 'nullable|string|max:500',
            'transaction_start' => 'required|date',
            'transaction_end' => 'required|date|after_or_equal:transaction_start',
            'user_id' => 'required|exists:users,user_id',
            'inventarisd_id' => 'required|exists:inventarisd,inventarisd_id',
        ]);

        $peminjam = User::where('user_id', $validated['user_id'])->first();

        if ($peminjam->user_role !== 'guru') {
            return redirect()->back()->with('error', 'Peminjam harus user dengan tipe role guru');
        }

        do {
            $code = random_int(100000, 999999);
        } while (Transaction::where('transaction_code', $code)->exists());

        $validated['transaction_start'] = Carbon::parse($validated['transaction_start'])->format('Y-m-d');
        $validated['transaction_end'] = Carbon::parse($validated['transaction_end'])->format('Y-m-d');

        $transaction = Transaction::create([
            'transaction_code' => $code,
            'transaction_desc' => $validated['transaction_desc'] ?? null,
            'transaction_start' => $validated['transaction_start'],
            'transaction_end' => $validated['transaction_end'],
            'transaction_status' => 2,
            'user_id' => $validated['user_id'],
            'inventarisd_id' => $validated['inventarisd_id'],
        ]);

        return redirect()->back()->with('success', 'Pengajuan peminjaman berhasil dibuat.');
    }

    public function returnTransaction(string $id)
    {
        $tx = Transaction::where('transaction_id', $id)
            ->first();

        $tx->update([
            'transaction_status' => 1,
        ]);

        Inventarisd::where('inventarisd_id', $tx->inventarisd->inventarisd_id)
            ->update(
                [
                    'inventarisd_status' => 'tersedia',
                ],
            );

        return redirect()->back()->with('success', 'Transaksi peminjaman berhasil dikembalikan.');
    }

    public function accept(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);

        if ($transaction->transaction_status !== 2) {
            return back()->with('error', 'Transaksi peminjaman tidak dalam status menunggu.');
        }

        if ($transaction->inventarisd->inventarisd_status === 'terpinjam') {
            return back()->with('error', 'Unit sudah dipinjam.');
        }

        DB::transaction(function () use ($transaction) {
            $transaction->transaction_status = 0;
            $transaction->save();

            $transaction->inventarisd->inventarisd_status = 'terpinjam';
            $transaction->inventarisd->save();

            Transaction::where('inventarisd_id', $transaction->inventarisd_id)
                ->where('transaction_status', 2)
                ->where('transaction_id', '!=', $transaction->transaction_id)
                ->update(['transaction_status' => 3]);
        });

        return back()->with('success', 'Transaksi peminjaman berhasil diterima.');
    }
    public function reject(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);

        if ($transaction->transaction_status !== 2) {
            return back()->with('error', 'Transaksi peminjaman tidak dalam status menunggu.');
        }

        $transaction->transaction_status = 3;
        $transaction->save();

        return back()->with('success', 'Transaksi peminjaman berhasil ditolak.');
    }
}
