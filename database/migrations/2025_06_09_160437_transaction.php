<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transaction', function (Blueprint $table) {
            $table->uuid('transaction_id')->primary();
            $table->integer('transaction_code')->unique(); // 6 digit
            $table->string('transaction_desc', 500)->nullable();
            $table->date('transaction_start');
            $table->date('transaction_end');
            $table->integer('transaction_status'); // 0: belum terkembalikan (terima) 1: terkembalikan 2: pending 3: rejected (tolak)
            $table->uuid('user_id');
            $table->uuid('inventarisd_id');
            $table->timestamps();

            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('inventarisd_id')->references('inventarisd_id')->on('inventarisd')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction');
    }
};
