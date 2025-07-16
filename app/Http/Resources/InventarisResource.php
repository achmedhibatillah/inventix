<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class InventarisResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->inventaris_id,
            'code' => $this->inventaris_code,
            'name' => $this->inventaris_name,
            'desc' => $this->inventaris_desc,
            'category' => CategoryResource::make(
                $this->whenLoaded(relationship: 'category'),
            ),
            'summary' => $this->when(
                condition: $this->count_tersedia !== 0 || $this->count_tiada !== 0 || $this->count_terpinjam !== 0,
                value: [
                    'count_tersedia' => $this->count_tersedia,
                    'count_terpinjam' => $this->count_terpinjam,
                    'count_tiada' => $this->count_tiada,
                ],
            ),
            'units' => InventarisDResource::collection(
                $this->whenLoaded(relationship: 'inventarisd'),
            ),
            'image_url' => $this->image_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
