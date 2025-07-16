<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventarisDResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = session('user');

        $actionStatus = 'ajukan';

        if ($user && $user['user_role'] === 'guru') {
            $userId = $user['user_id'];

            $hasPending = $this->transactions->contains(function ($transaction) use ($userId) {
                return $transaction->user_id === $userId && $transaction->transaction_status === 2;
            });

            $isBorrowed = $this->transactions->contains(function ($transaction){
                return $transaction->transaction_status === 0;
            });

            if ($hasPending) {
                $actionStatus = 'menunggu';
            } elseif ($isBorrowed) {
                $actionStatus = 'tidak_tersedia';
            }
        }

        return [
            'id' => $this->inventarisd_id,
            'code' => $this->inventarisd_code,
            'label' => $this->inventarisd_label,
            'description' => $this->inventarisd_desc,
            'status' => $this->inventarisd_status,
            'condition' => KondisiResource::make(
                $this->whenLoaded('kondisi')
            ),
            'inventaris' => InventarisResource::make(
                $this->whenLoaded('inventaris')
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ]  + ($user && $user['user_role'] === 'guru' ? ['action_status' => $actionStatus] : []);
    }
}
