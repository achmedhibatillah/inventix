<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Str;

class Transaction extends Model
{
    use HasFactory;
    protected $table = 'transaction';
    protected $primaryKey = 'transaction_id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'transaction_id',
        'transaction_code',
        'transaction_desc',
        'transaction_start',
        'transaction_end',
        'transaction_status',
        'user_id',
        'inventarisd_id',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->transaction_id = (string) Str::uuid();
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function inventarisd()
    {
        return $this->belongsTo(Inventarisd::class, 'inventarisd_id', 'inventarisd_id');
    }

    public static function getAllRiwayatByMonth($month)
    {
        $startOfMonth = Carbon::parse($month . '-01')->startOfMonth();
        $endOfMonth = Carbon::parse($month . '-01')->endOfMonth();
    
        $query = self::where(function ($q) use ($startOfMonth, $endOfMonth) {
                $q->whereBetween('transaction_start', [$startOfMonth, $endOfMonth])
                  ->orWhereBetween('transaction_end', [$startOfMonth, $endOfMonth]);
            })
            ->whereNotIn('transaction_status', [2, 3])
            ->orderBy('created_at', 'desc')
            ->with(['user', 'inventarisd.inventaris.category']);
    
        $rawData = $query->get();
    
        $data = $rawData->map(function ($item) {
            return [
                'inventaris_code' => optional($item->inventarisd->inventaris->category)->category_code
                    . '-' . optional($item->inventarisd->inventaris)->inventaris_code
                    . '-' . optional($item->inventarisd)->inventarisd_code,
                'kategori' => optional($item->inventarisd->inventaris->category)->category_name,
                'barang' => optional($item->inventarisd->inventaris)->inventaris_name,
                'label' => optional($item->inventarisd)->inventarisd_label !== null || optional($item->inventarisd)->inventarisd_label !== '' ? optional($item->inventarisd)->inventarisd_label : 'Tidak berlabel',
                'peminjam_fullname' => optional($item->user)->user_fullname,
                'peminjam_email' => optional($item->user)->user_email,
                'mulai' => $item->transaction_start,
                'berakhir' => $item->transaction_end,
                'kembali' => $item->transaction_status == 0 ? '-' : $item->updated_at->format('Y-m-d'),
                'status' => $item->transaction_status == 0
                    ? 'Belum Kembali'
                    : ($item->updated_at->lessThanOrEqualTo($item->transaction_end)
                        ? 'Kembali'
                        : 'Kembali (telat)'),
            ];
        });
    
        return [
            'total' => [
                'all' => $rawData->count(),
                'kembali' => $rawData->filter(function ($item) {
                    return $item->transaction_status != 0 &&
                        $item->updated_at->lessThanOrEqualTo($item->transaction_end);
                })->count(),
                'kembali_telat' => $rawData->filter(function ($item) {
                    return $item->transaction_status != 0 &&
                        $item->updated_at->greaterThan($item->transaction_end);
                })->count(),
                'belum_kembali' => $rawData->filter(function ($item) {
                    return $item->transaction_status == 0;
                })->count(),
            ],
            'data' => $data,
        ];
    }    

    public static function getAllRiwayatByUser($user_id, $status = null)
    {
        $query = self::where('user_id', $user_id)
            ->orderBy('created_at', 'desc')
            ->with(['user', 'inventarisd.inventaris.category']);

        // Sub-menu filter
        if ($status === 'sedang') {
            // Barang belum melewati batas waktu
            $query->where('transaction_status', 0)
                ->where('transaction_end', '>=', Carbon::now());
        } elseif ($status === 'terlambat') {
            // Barang melewati batas waktu
            $query->where('transaction_status', 0)
                ->where('transaction_end', '<', Carbon::now());
        } elseif ($status === 'selesai') {
            // Barang sudah dikembalikan
            $query->where('transaction_status', 1);
        }

        return $query->get()->map(function ($item) {
            return [
                'code' => $item->transaction_code,
                'description' => $item->transaction_desc,
                'start' => $item->transaction_start,
                'end' => $item->transaction_end,
                'status' => $item->transaction_status,
                'due' => self::checkDue($item->transaction_end),
                'barang' => [
                    'category_code' => optional($item->inventarisd->inventaris->category)->category_code,
                    'category_name' => optional($item->inventarisd->inventaris->category)->category_name,
                    'inventaris_code' => optional($item->inventarisd->inventaris)->inventaris_code,
                    'inventaris_name' => optional($item->inventarisd->inventaris)->inventaris_name,
                    'inventarisd_code' => optional($item->inventarisd)->inventarisd_code,
                    'inventarisd_label' => optional($item->inventarisd)->inventarisd_label,
                ],
            ];
        });
    }


    private static function checkDue($transaction_end)
    {
        $now = Carbon::now();
        $end = Carbon::parse($transaction_end);

        return [
            'status' => $now->greaterThan($end),
            'range' => $now->diffInMinutes($end),
        ];
    }


    public function getLateMessageAttribute(): ?string
    {
        $now = Carbon::now()->startOfDay();
        $end = Carbon::parse($this->transaction_end)->startOfDay();

        $diffInDays = $now->diffInDays($end, false);

        if ($diffInDays <= 0) {
            $daysLate = abs($diffInDays);
            if ($daysLate === 0) {
                return "Terlambat hari ini";
            }
            return "Terlambat $daysLate hari";
        }

        return null;
    }
}
