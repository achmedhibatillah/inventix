<?php

namespace App\Http\Controllers\Inventix;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\InventarisResource;
use App\Http\Resources\KondisiResource;
use App\Models\Category;
use App\Models\Inventaris;
use App\Models\Inventarisd;
use App\Models\Kondisi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Str;
use Symfony\Component\HttpFoundation\RedirectResponse;

class InventarisController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventaris::with(relations: 'category')
            ->withSummary();

        if ($request->filled(key: 'category')) {
            $query->whereHas(relation: 'category', callback: function ($query) use ($request): void {
                $query->where(column: 'category_code', operator: $request->category);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('inventaris_name', 'like', "%{$search}%");
        }

        $inventariss = $query->orderBy(column: 'created_at')
            ->get();

        $categories = Category::all();

        $auth = session()->get('user');

        return Inertia::render('InventoryPage', [
            'inventariss' => InventarisResource::collection(resource: $inventariss),
            'category_options' => CategoryResource::collection(resource: $categories),
        ]);
    }

    public function show(Request $request, string $code)
    {
        $query = Inventaris::where(column: 'inventaris_code', operator: $code)
            ->with(relations: 'category')
            ->with(relations: [
                'inventarisd' => function ($query) use ($request): void {
                    $query->orderBy('created_at')->with([
                        'kondisi',
                        'transactions' => function ($q) {
                            $q->whereIn('transaction_status', [0,2]);
                        }
                    ]);

                    if ($request->filled(key: 'condition')) {
                        $query->where(column: 'kondisi_id', operator: $request->condition);
                    }

                    if ($request->filled(key: 'status')) {
                        $query->where(column: 'inventarisd_status', operator: $request->status);
                    }
                }
            ])
            ->withSummary();

        $inventaris = $query->first();
        $conditions = Kondisi::all();
        $categories = Category::all();
        $users = User::select('user_id', 'user_fullname', 'user_email')
            ->where('user_role', 'guru')
            ->get();
        $statuses = [
            [
                'id' => 1,
                'name' => 'tersedia',
            ],
            [
                'id' => 2,
                'name' => 'terpinjam',
            ],
            [
                'id' => 3,
                'name' => 'tiada',
            ],
        ];

        return Inertia::render('InventoryDetailPage', [
            'inventaris' => InventarisResource::make(resource: $inventaris),
            'condition_options' => KondisiResource::collection(resource: $conditions),
            'status_options' => $statuses,
            'categories_options' => CategoryResource::collection($categories),
            'user_options' => $users,
        ]);
    }

    public function storeUnit(Request $request)
    {
        $validated = $request->validate([
            'inventaris_id' => 'required|uuid|exists:inventaris,inventaris_id',
            'inventarisd_label' => 'nullable|string|max:255',
            'inventarisd_desc' => 'nullable|string|max:500',
            'inventarisd_status' => 'required|string|in:tersedia,terpinjam,tiada',
            'kondisi_id' => 'required|integer|exists:kondisi,kondisi_id',
        ]);

        Inventarisd::create([
            'inventarisd_code' => fake()->unique()->numberBetween(10000, 99999),
            'inventarisd_label' => $validated['inventarisd_label'],
            'inventarisd_desc' => $validated['inventarisd_desc'],
            'inventarisd_status' => $validated['inventarisd_status'],
            'inventaris_id' => $validated['inventaris_id'],
            'kondisi_id' => $validated['kondisi_id'],
        ]);

        return redirect()->back()->with('success', 'Unit barang berhasil ditambahkan.');
    }

    public function updateUnit(Request $request, string $id)
    {
        $validated = $request->validate([
            'inventarisd_label' => 'nullable|string|max:255',
            'inventarisd_desc' => 'nullable|string|max:500',
            'inventarisd_status' => 'required|string|in:tersedia,terpinjam,tiada',
            'kondisi_id' => 'required|integer|exists:kondisi,kondisi_id',
        ]);

        Inventarisd::where('inventarisd_id', $id)->update([
            'inventarisd_label' => $validated['inventarisd_label'],
            'inventarisd_desc' => $validated['inventarisd_desc'],
            'inventarisd_status' => $validated['inventarisd_status'],
            'kondisi_id' => $validated['kondisi_id'],
        ]);

        return redirect()->back()->with('success', 'Unit barang berhasil diperbarui.');
    }

    public function destroyUnit($id)
    {
        $unit = Inventarisd::findOrFail($id);
        $unit->delete();

        return redirect()->back()->with('success', 'Unit barang berhasil dihapus.');
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'inventaris_name' => 'nullable|string|max:255',
            'inventaris_desc' => 'nullable|string|max:500',
            'category_id' => 'required|string|exists:category,category_id',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $inventaris = Inventaris::where('inventaris_id', $id)->first();

        $dataToUpdate = [
            'inventaris_name' => $validated['inventaris_name'],
            'inventaris_desc' => $validated['inventaris_desc'],
            'category_id' => $validated['category_id'],
        ];

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $filename = time() . '-' . $inventaris->inventaris_code . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('inventaris', $filename, 'public');

            if ($path) {
                if ($inventaris->image_url) {
                    $oldPath = str_replace('/storage/', '', $inventaris->image_url);

                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                }

                $dataToUpdate['image_url'] = Storage::url($path);
            }
        }

        $inventaris->update($dataToUpdate);

        return redirect()->back()->with('success', 'Barang berhasil diperbarui.');
    }


    public function destroy($id)
    {
        $inventory = Inventaris::findOrFail($id);

        if ($inventory->image_url) {
            $relativePath = str_replace('/storage/', '', $inventory->image_url);

            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }

        $inventory->delete();

        return redirect('/inventaris')->with('success', 'Barang berhasil dihapus.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'inventaris_name' => 'nullable|string|max:255',
            'inventaris_desc' => 'nullable|string|max:500',
            'category_id' => 'required|string|exists:category,category_id',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $path = null;
        $imageUrl = null;
        $inventaris_code = fake()->unique()->numberBetween(100, 999);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $filename = time() . '-' . $inventaris_code . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('inventaris', $filename, 'public');

            if ($path) {
                $imageUrl = Storage::url($path);
            }
        }

        Inventaris::create([
            'inventaris_code' => $inventaris_code,
            'inventaris_name' => $validated['inventaris_name'],
            'inventaris_desc' => $validated['inventaris_desc'],
            'category_id' => $validated['category_id'],
            'image_url' => $imageUrl,
        ]);

        return redirect()->back()->with('success', 'Barang berhasil ditambahkan.');
    }
}