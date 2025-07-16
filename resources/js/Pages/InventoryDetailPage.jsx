import { Head, router, usePage } from "@inertiajs/react";
import React from "react";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import Table from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Edit, Trash2 } from "lucide-react";
import Combobox from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CreateInventoryUnitForm from "./CreateIventoryUnitForm";
import UpdateInventoryUnitForm from "./UpdateInventoryUnitForm";
import CreateTransactionForm from "./CreateTransactionForm";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import UpdateInventoryForm from "./UpdateInventoryForm";
import CreateTransactionRequestForm from "./CreateTransactionRequestForm";

export default function IventoryDetailPage({
    inventaris, condition_options, status_options, categories_options, user_options
}) {
    const { props } = usePage()
    const flash = props.flash

    // Filtering-State
    const [filters, setFilters] = React.useState({
        status: '',
        condition: '',
    })
    const [selectedUnit, setSelectedUnit] = React.useState(null)

    // Dialog-State
    const [openDeleteUnitDialog, setOpenDeleteUnitDialog] = React.useState(false)
    const [openCreateUnitSheet, setOpenCreateUnitSheet] = React.useState(false)
    const [openUpdateUnitSheet, setOpenUpdateUnitSheet] = React.useState(false)
    const [openDeleteInventoryDialog, setOpenDeleteInventoryDialog] = React.useState(false)
    const [openUpdateInventorySheet, setOpenUpdateInventorySheet] = React.useState(false)
    const [openCreateTransactionSheet, setOpenCreateTransactionSheet] = React.useState(false)
    const [openCreateTransactionRequestSheet, setOpenCreateTransactionRequestSheet] = React.useState(false)

    // Data-State
    const inventory = inventaris?.data
    const units = inventory?.units
    const statuses = status_options?.map(i => ({ value: i?.name, label: i?.name }))
    const conditions = condition_options?.data?.map(i => ({ value: String(i?.id), label: i?.name }))

    const applyFilters = (newFilters = {}) => {
        const mergedFilters = {
            ...filters,
            ...newFilters,
        }

        setFilters(mergedFilters)

        router.get(`/inventaris/${inventory?.code}`, {
            status: mergedFilters.status !== '' ? mergedFilters.status : undefined,
            condition: mergedFilters.condition !== '' ? Number(mergedFilters.condition) : undefined,
        }, {
            replace: true,
            preserveScroll: true,
            preserveState: true,
        })
    }

    const handleStatusChange = (val) => {
        applyFilters({ status: val })
    }

    const handleConditionChange = (val) => {
        applyFilters({ condition: val })
    }

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
            <Head title="Inventix - Detail Barang" />
            <DashboardLayout
                title={'Detail Barang'}
                description={'Berikut informasi detail dan unit dari barang'}
            >
                <div className="flex w-full gap-6">
                    <div className="w-1/3">
                        <InventoryDetailCard
                            inventory={inventory}
                            onDelete={() => setOpenDeleteInventoryDialog(true)}
                            onUpdate={() => setOpenUpdateInventorySheet(true)}
                        />
                    </div>
                    <Table
                        toolbar={
                            <div className="flex gap-2 w-full justify-between">
                                <div className="flex gap-4">
                                    <Combobox
                                        buttonLabel={'Status'}
                                        emptyMessage={'Status tidak ada'}
                                        placeholder={'Cari status...'}
                                        data={statuses}
                                        value={filters.status}
                                        onChange={handleStatusChange}
                                        width='w-[150px]'
                                    />
                                    <Combobox
                                        buttonLabel={'Kondisi'}
                                        emptyMessage={'Kondisi tidak ada'}
                                        placeholder={'Cari kondisi...'}
                                        data={conditions}
                                        value={filters.condition}
                                        onChange={handleConditionChange}
                                        width='w-[150px]'
                                    />
                                </div>
                                {
                                    props.auth?.user_role !== 'guru' &&
                                    <CreateUnitRightSheet
                                        inventory_id={inventory?.id}
                                        conditions={condition_options?.data}
                                        open={openCreateUnitSheet}
                                        onOpenChange={setOpenCreateUnitSheet}
                                        trigger={(
                                            <Button variant="accentTwo" onClick={() => setOpenCreateUnitSheet(true)}>
                                                Tambah Unit
                                            </Button>
                                        )}
                                    />
                                }
                            </div>
                        }
                    >
                        <thead className="bg-slate-100 text-left text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Kode</th>
                                <th className="px-6 py-4 font-medium min-w-[250px]">Label</th>
                                <th className="px-6 py-4 font-medium min-w-[250px]">Deksripsi</th>
                                <th className="px-6 py-4 font-medium">Kondisi</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units?.length > 0
                                ? (
                                    units?.map((unit) => (
                                        <tr key={unit?.id} className="border-t border-slate-200 hover:bg-itxAccentTwo-100 transition-colors">
                                            <td className="px-6 py-4">{`#${unit?.code}`}</td>
                                            <td className="px-6 py-4">{unit?.label || 'Tidak berlabel'}</td>
                                            <td className="px-6 py-4">{unit?.description || '--'}</td>
                                            <td className="px-6 py-4">{unit?.condition?.name?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</td>
                                            <td className="px-6 py-4"> {unit?.status?.charAt(0).toUpperCase() + unit?.status?.slice(1)}</td>
                                            {
                                                props.auth?.user_role !== 'guru' &&
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">

                                                        <Button
                                                            size="sm"
                                                            variant="accentOne"
                                                            onClick={() => {
                                                                setSelectedUnit(unit)
                                                                setOpenUpdateUnitSheet(true)
                                                            }}
                                                        >
                                                            <Edit />
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                setSelectedUnit(unit)
                                                                setOpenDeleteUnitDialog(true)
                                                            }}
                                                        >
                                                            <Trash2 />
                                                        </Button>

                                                        {props?.auth?.user_role === 'admin' &&
                                                            <Button
                                                                disabled={unit?.status === 'terpinjam'}
                                                                size="sm"
                                                                variant="primary"
                                                                onClick={() => {
                                                                    setSelectedUnit(unit)
                                                                    setOpenCreateTransactionSheet(true)
                                                                }}
                                                            >
                                                                Pinjamkan
                                                            </Button>
                                                        }
                                                    </div>
                                                </td>
                                            }
                                            {
                                                props?.auth?.user_role === 'guru' &&
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                            <Button
                                                                disabled={unit?.action_status === 'menunggu' || unit?.action_status === 'tidak_tersedia'}
                                                                size="sm"
                                                                variant="primary"
                                                                onClick={() => {
                                                                    setSelectedUnit(unit)
                                                                    setOpenCreateTransactionRequestSheet(true)
                                                                }}
                                                            >
                                                                {unit?.action_status === 'menunggu'
                                                                    ? 'Menunggu Konfirmasi'
                                                                    : unit?.action_status === 'tidak_tersedia'
                                                                    ? 'Ajukan'
                                                                    : 'Ajukan'}
                                                            </Button>
                                                    </div>
                                                </td>
                                            }
                                        </tr>
                                    )))
                                : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-6 text-slate-400">
                                            Tidak ada data ditemukan.
                                        </td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </Table>
                    <DeleteUnitAlertDialog
                        open={openDeleteUnitDialog}
                        onOpenChange={setOpenDeleteUnitDialog}
                        deletedUnit={selectedUnit}
                        onSucces={() => setOpenDeleteUnitDialog(false)}
                    />
                    <DeleteInventoryAlertDialog
                        open={openDeleteInventoryDialog}
                        onOpenChange={setOpenDeleteInventoryDialog}
                        deletedInventory={inventory}
                        onSucces={() => setOpenDeleteInventoryDialog(false)}
                    />
                    <UpdateUnitRightSheet
                        updatedUnit={selectedUnit}
                        conditions={condition_options?.data}
                        open={openUpdateUnitSheet}
                        onOpenChange={setOpenUpdateUnitSheet}
                        trigger={(
                            <Button
                                size="sm"
                                variant="accentOne"
                                className={'hidden'}
                                onClick={() => setOpenUpdateUnitSheet(true)}
                            >
                                <Edit />
                            </Button>
                        )}
                    />
                    <UpdateInventoryRightSheet
                        updatedInventory={inventory}
                        categories={categories_options?.data}
                        open={openUpdateInventorySheet}
                        onOpenChange={setOpenUpdateInventorySheet}
                        trigger={(
                            <Button
                                size="sm"
                                variant="accentOne"
                                className={'hidden'}
                                onClick={() => setOpenUpdateUnitSheet(true)}
                            >
                                <Edit />
                            </Button>
                        )}
                    />
                    <CreateTransactionRightSheet
                        selectedUnit={selectedUnit}
                        users={user_options}
                        open={openCreateTransactionSheet}
                        onOpenChange={setOpenCreateTransactionSheet}
                        trigger={(
                            <Button size="sm" variant="primary" className={'hidden'} onClick={() => setOpenCreateTransactionSheet(true)}>
                                Pinjamkan
                            </Button>
                        )}
                    />
                    <CreateTransactionRequestRightSheet
                        selectedUnit={selectedUnit}
                        user={props?.auth}
                        open={openCreateTransactionRequestSheet}
                        onOpenChange={setOpenCreateTransactionRequestSheet}
                        trigger={(
                            <Button size="sm" variant="primary" className={'hidden'} onClick={() => setOpenCreateTransactionRequestSheet(true)}>
                                Pinjam
                            </Button>
                        )}
                    />
                </div>
            </DashboardLayout>
        </>
    )
}

function InventoryDetailCard({
    inventory,
    onDelete,
    onUpdate
}) {
    const { props } = usePage()
    return (
        /* sof-Container */
        <div className="w-full rounded-4xl overflow-hidden bg-white border border-slate-300">

            {/* sof-Image-Container */}
            <div className="relative aspect-square">
                <img
                    src={inventory?.image_url}
                    alt="Inventaris"
                    className="h-full w-full object-cover"
                />
                <Badge className="absolute top-6 right-6  py-2 px-4 text-base bg-itxPrimary-500 text-itxSurface">
                    {`#${inventory?.code}`}
                </Badge>
            </div>
            {/* eof-Image-Container */}

            {/* sof-Information-Container */}
            <div className="flex flex-col gap-4 p-6 border-t border-slate-300">
                <Badge className="py-2 px-4 text-base text-slate-500 bg-slate-200">
                    {inventory?.category?.name}
                </Badge>
                <h4 className="text-3xl font-medium text-slate-800">{inventory?.name}</h4>
                <div >
                    <p className="text-base text-slate-400 truncate">
                        {inventory?.desc}
                    </p>
                </div>
            </div>
            {/* eof-Information-Container */}

            {/* sof-Summary-Container */}
            <div className="grid grid-cols-3 text-center text-sm border-t border-slate-300">
                <div className="py-6 text-itxAccentTwo-500">
                    <p className="font-medium text-lg">{inventory?.summary?.count_tersedia ?? 0}</p>
                    <p className="font-base">Tersedia</p>
                </div>
                <div className="py-6 text-itxAccentOne-500">
                    <p className="font-medium text-lg">{inventory?.summary?.count_terpinjam ?? 0}</p>
                    <p className="font-base">Dipinjam</p>
                </div>
                <div className="py-6 text-itxPrimary-500">
                    <p className="font-medium text-lg">{inventory?.summary?.count_tiada ?? 0}</p>
                    <p className="font-base">Tiada</p>
                </div>
            </div>
            {/* eof-Summary-Container */}

            {
                props.auth?.user_role !== 'guru' &&
                <div className="flex gap-2 p-6 items-center justify-center">
                    <Button
                        key={1}
                        variant={'accentOne'}
                        className={'flex-1'}
                        onClick={onUpdate}
                    >
                        Edit
                    </Button>
                    <Button
                        key={2}
                        variant={'destructive'}
                        className={'flex-1'}
                        onClick={onDelete}
                    >
                        Hapus
                    </Button>
                </div>
            }
        </div>
    )
}

function DeleteInventoryAlertDialog({
    open,
    onOpenChange,
    deletedInventory,
    onSucces
}) {
    const handleDelete = () => {
        router.delete(`/inventaris/${deletedInventory?.id}`, {
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
                        Hapus Barang
                    </DialogTitle>
                    <DialogDescription>
                        {`Apakah anda yakin ingin menghapus barang ${deletedInventory?.code}?`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={'secondary'} >Batal</Button>
                    </DialogClose>
                    <Button variant={'destructive'} onClick={handleDelete}>Hapus</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteUnitAlertDialog({
    open,
    onOpenChange,
    deletedUnit,
    onSucces,
}) {
    const handleDelete = () => {
        router.delete(`/inventaris/destroyUnit/${deletedUnit?.id}`, {
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
                        Hapus Unit
                    </DialogTitle>
                    <DialogDescription>
                        {`Apakah anda yakin ingin menghapus unit barang ${deletedUnit?.code}?`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={'secondary'} >Batal</Button>
                    </DialogClose>
                    <Button variant={'destructive'} onClick={handleDelete}>Hapus</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CreateUnitRightSheet({
    trigger,
    inventory_id,
    conditions,
    open,
    onOpenChange,
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Tambah Unit</SheetTitle>
                    <SheetDescription>
                        Isi form dibawah ini untuk menambahkan data unit
                    </SheetDescription>
                </SheetHeader>
                <CreateInventoryUnitForm
                    inventaris_id={inventory_id}
                    conditions={conditions}
                    onClose={onOpenChange}
                />
            </SheetContent>
        </Sheet>
    )
}

function UpdateUnitRightSheet({
    trigger,
    updatedUnit,
    conditions,
    open,
    onOpenChange
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Unit</SheetTitle>
                    <SheetDescription>
                        Isi form dibawah ini untuk memperbarui data unit
                    </SheetDescription>
                </SheetHeader>
                <UpdateInventoryUnitForm
                    updatedUnit={updatedUnit}
                    conditions={conditions}
                    onClose={onOpenChange}
                />
            </SheetContent>
        </Sheet>
    )
}

function CreateTransactionRightSheet({
    trigger,
    users,
    selectedUnit,
    open,
    onOpenChange
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Buat Peminjaman</SheetTitle>
                    <SheetDescription>
                        Isi form dibawah ini untuk membuat data peminjaman pada unit {selectedUnit?.code}
                    </SheetDescription>
                </SheetHeader>
                <CreateTransactionForm selectedUnit={selectedUnit} users={users} onClose={onOpenChange} />
            </SheetContent>
        </Sheet>
    )
}

function CreateTransactionRequestRightSheet({
    trigger,
    user,
    selectedUnit,
    open,
    onOpenChange
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Buat Peminjaman</SheetTitle>
                    <SheetDescription>
                        Isi form dibawah ini untuk membuat data pengajuan peminjaman pada unit {selectedUnit?.code}
                    </SheetDescription>
                </SheetHeader>
                <CreateTransactionRequestForm selectedUnit={selectedUnit} user={user} onClose={onOpenChange} />
            </SheetContent>
        </Sheet>
    )
}

function UpdateInventoryRightSheet({
    trigger,
    updatedInventory,
    categories,
    open,
    onOpenChange,
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Barang</SheetTitle>
                    <SheetDescription>
                        Isi form dibawah ini untuk memperbarui data barang
                    </SheetDescription>
                </SheetHeader>
                <UpdateInventoryForm
                    updatedInventory={updatedInventory}
                    categories={categories}
                    onClose={onOpenChange}
                />
            </SheetContent>
        </Sheet>
    )
}