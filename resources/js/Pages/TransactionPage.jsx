import { Head, Link, router, usePage } from "@inertiajs/react";
import React from "react";
import DashboardLayout from "./DashboardLayout";
import Table from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Combobox from "@/components/ui/combobox";

export default function TransactionPage({ transactions: rawTransactions, status_options }) {
    const { props } = usePage()
    const flash = props?.flash

    const transactions = rawTransactions?.data
    const [selectedTx, setSelectedTx] = React.useState(null)
    const [selectedSt, setSelectedSt] = React.useState(null)

    const handleStatusChange = (val) => {
        setSelectedSt(val)

        router.get('/transactions', {
            status: val !== '' ? val : undefined
        }, {
            replace: true,
            preserveState: true,
            preserveScroll: true
        })
    }

    const formatDate = (rawDate) => {
        const date = new Date(rawDate)
        const formatted = new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
        }).format(date)

        return formatted
    }

    const [openReturnTxDialog, setOpenReturnTxDialog] = React.useState(false)

    React.useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success)
        }
        if (flash?.error) {
            toast.error(flash.error)
        }
    }, [flash])

    return (
        <>
            <Head title="Inventix - Transactions" />
            <DashboardLayout title={'Peminjaman'} description={'Berikut informasi data transaksi peminjaman'}>
                <Table
                    toolbar={
                        <div className="flex gap-4">
                            <Combobox
                                buttonLabel={'Status'}
                                data={status_options}
                                emptyMessage={'Status tidak ada'}
                                onChange={handleStatusChange}
                                placeholder={'Cari status...'}
                                value={selectedSt}
                            />
                            <Button
                                onClick={() => router.visit('transactions/request')}
                            >
                                Data Pengajuan
                            </Button>
                        </div>
                    }
                >
                    <thead className="bg-slate-100 text-left text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-medium">Kode</th>
                            <th className="px-6 py-4 font-medium">Peminjam</th>
                            <th className="px-6 py-4 font-medium">Barang Dipinjam</th>
                            <th className="px-6 py-4 font-medium text-center">Tgl Mulai</th>
                            <th className="px-6 py-4 font-medium text-center">Tgl Selesai</th>
                            <th className="px-6 py-4 font-medium text-center">Dikembalikan</th>
                            {
                                props.auth?.user_role !== 'guru' &&
                                <th className="px-6 py-4 text-right font-medium">Aksi</th>
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {transactions?.length > 0
                            ? (
                                transactions?.map((tx) => (
                                    <tr key={tx?.id} className="border-t border-slate-200 hover:bg-itxAccentTwo-100 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/transactions/${tx?.code}`} className="text-itxAccentTwo-500 hover:underline">
                                                {`#${tx?.code}`}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <h6 className="font-medium text-slate-800">{tx?.user?.fullname}</h6>
                                                <p className="text-sm text-itxAccentOne-500">{tx?.user?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <h6 className="font-medium text-slate-800">{tx?.unit?.inventaris?.name}</h6>
                                                <p className="text-sm text-slate-500">
                                                    {
                                                        tx?.unit?.label || 'Tidak berlabel'
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">{formatDate(tx?.start)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className=" flex flex-col justify-center items-center">
                                                {formatDate(tx?.end)}
                                                {tx?.late_message && (<p className="text-rose-400 text-sm">{tx?.late_message}</p>)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {
                                                tx?.updated_at !== tx?.created_at
                                                    ? formatDate(tx?.updated_at)
                                                    : '--'
                                            }
                                        </td>
                                        {
                                            props.auth?.user_role !== 'guru' &&
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    size={'sm'}
                                                    disabled={tx?.status === 1}
                                                    onClick={() => {
                                                        setSelectedTx(tx)
                                                        setOpenReturnTxDialog(true)
                                                    }}
                                                >
                                                    {tx?.status === 0 ? 'Kembalikan' : 'Telah Dikembalikan'}
                                                </Button>
                                            </td>
                                        }
                                    </tr>
                                )))
                            : (
                                <tr>
                                    <td colSpan={6} className="text-center py-6 text-slate-400">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )
                        }
                    </tbody>
                </Table>
                <ReturnTransactionAlertDialog
                    open={openReturnTxDialog}
                    transaction={selectedTx}
                    onOpenChange={setOpenReturnTxDialog}
                    onSucces={() => setOpenReturnTxDialog(false)}
                />
            </DashboardLayout >
        </>
    )
}

function ReturnTransactionAlertDialog({
    open,
    onOpenChange,
    transaction,
    onSucces
}) {
    const handleReturn = () => {
        router.post(`/transactions/${transaction?.id}/return`, {}, {
            onSuccess: onSucces,
            preserveScroll: true,
            preserveState: true,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Kembalikan Barang
                    </DialogTitle>
                    <DialogDescription>
                        {`Apakah anda yakin ingin menandai peminjaman ${transaction?.code} sebagai selesai?`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={'secondary'} >Batal</Button>
                    </DialogClose>
                    <Button variant={'accentOne'} onClick={handleReturn}>Kembalikan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}