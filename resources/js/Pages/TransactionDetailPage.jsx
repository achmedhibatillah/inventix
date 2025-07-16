import { Head, Link } from '@inertiajs/react'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import DashboardLayout from './DashboardLayout'
import { Archive, BookOpen, User } from 'lucide-react'

export default function TransactionDetailPage({ transaction: raw }) {
    const transaction = raw?.data
    const user = transaction?.user
    const unit = transaction?.unit
    const inventaris = unit?.inventaris

    return (
        <>
            <Head title="Inventix - Detail Peminjaman" />
            <DashboardLayout
                title="Detail Peminjaman"
                description="Berikut informasi detail tentang peminjaman"
            >
                {/* Full-height wrapper */}
                <div className="w-full flex flex-col gap-6 flex-grow py-6">
                    <div className="flex w-full gap-6">
                        {/* Card 3: Peminjaman */}
                        <div className="bg-white flex-1 rounded-3xl border border-slate-300 p-6">
                            <div className="flex gap-6">
                                <BookOpen />
                                <h2 className="text-xl font-medium text-slate-800 mb-4">Detail Peminjaman</h2>
                            </div>
                            <div className="flex flex-row gap-14 mt-6">
                                <div className='flex flex-col gap-4'>
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-xs font-normal text-slate-500">Tanggal Mulai</h6>
                                        <p className="text-base text-slate-800">
                                            {dayjs(transaction?.start).locale('id').format('D MMMM YYYY')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-xs font-normal text-slate-500">Tanggal Selesai</h6>
                                        <p className="text-base text-slate-800">
                                            {dayjs(transaction?.end).locale('id').format('D MMMM YYYY')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-xs font-normal text-slate-500">Dikembalikan pada</h6>
                                        <p className="text-base text-slate-800">
                                            {transaction?.updated_at === transaction?.created_at ? dayjs(transaction?.updated_at).locale('id').format('D MMMM YYYY') : '--'}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-4'>
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-xs font-normal text-slate-500">Status</h6>
                                        <p className="text-base text-slate-800">
                                            {renderStatus(transaction?.status)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-xs font-normal text-slate-500">Deskripsi</h6>
                                        <p className="text-base text-slate-800">{transaction?.desc || '--'}</p>
                                    </div>
                                </div>
                                {transaction?.late_message && (
                                    <p className="text-red-500 font-medium">{transaction.late_message}</p>
                                )}
                            </div>
                        </div>
                        {/* Card 1: Peminjam */}
                        <div className="bg-white flex-1 rounded-3xl border border-slate-300 p-6">
                            <div className="flex gap-6">
                                <User />
                                <h2 className="text-xl font-medium text-slate-800 mb-4">Detail Peminjam</h2>
                            </div>
                            <div className="space-y-4 mt-6">
                                <div className="flex flex-col gap-2">
                                    <h6 className="text-xs font-normal text-slate-500">Nama Lengkap</h6>
                                    <p className="text-base text-slate-800">{user?.fullname}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h6 className="text-xs font-normal text-slate-500">Email</h6>
                                    <Link href={`/users/${user?.id}`}>
                                        <p className="text-base text-itxAccentOne-500 hover:underline">{user?.email}</p>
                                    </Link>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h6 className="text-xs font-normal text-slate-500">Role</h6>
                                    <p className="text-base text-slate-800">{user?.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Card 2: Detail Barang */}
                    <div className="bg-white rounded-3xl border border-slate-300 p-6">
                        <div className="flex gap-6">
                            <Archive />
                            <h2 className="text-xl font-medium text-slate-800 mb-4">Detail Barang</h2>
                        </div>
                        <div className="flex gap-14 space-y-12 mt-6">

                            {/* Inventaris */}
                            <div>
                                <h3 className="font-medium text-slate-600 mb-2">Informasi Barang</h3>
                                <div className="flex gap-4 items-center">
                                    <img
                                        src={inventaris?.image_url}
                                        alt="Inventaris"
                                        className="w-[175px] object-cover rounded-xl border border-slate-300"
                                    />
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <h6 className="text-xs font-normal text-slate-500">Nama</h6>
                                            <p className="text-base text-slate-800">{inventaris?.name}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <h6 className="text-xs font-normal text-slate-500">Kode</h6>
                                            <Link href={`/inventaris/${inventaris?.code}`}>
                                                <p className="text-base text-itxAccentOne-500 hover:underline">{inventaris?.code}</p>
                                            </Link>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <h6 className="text-xs font-normal text-slate-500">Deskripsi</h6>
                                            <p className="text-base text-slate-800">{inventaris?.desc || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Unit */}
                            <div>
                                <h3 className="font-medium text-slate-600 mb-2">Informasi Unit</h3>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-xs font-normal text-slate-500">Label</h6>
                                        <p className="text-base text-slate-800">{unit?.label || 'Tidak berlabel'}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-xs font-normal text-slate-500">Kode</h6>
                                        <Link href={`/inventaris/${inventaris?.code}`}>
                                            <p className="text-base text-itxAccentOne-500 hover:underline">{unit?.code}</p>
                                        </Link>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h6 className="text-xs font-normal text-slate-500">Status</h6>
                                        <p className="text-base text-slate-800">{unit?.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </>
    )
}

function renderStatus(status) {
    switch (status) {
        case 0: return 'Aktif';
        case 1: return 'Selesai';
        case 2: return 'Menunggu Konfirmasi';
        case 3: return 'Ditolak';
        default: return 'Tidak diketahui';
    }
}