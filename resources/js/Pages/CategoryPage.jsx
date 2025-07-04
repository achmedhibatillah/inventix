import { Head, router, usePage } from "@inertiajs/react";
import React from "react";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CategoryPage({ categories: raw }) {
    const { props } = usePage()
    const flash = props?.flash

    const categories = raw?.data

    const [isEditing, setIsEditing] = React.useState(false)
    const [selectedCategory, setSelectedCategory] = React.useState(null)
    const [openAlertDelete, setOpenAlertDelete] = React.useState(false)

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
            <Head title="Inventix - Kategori" />
            <DashboardLayout
                title={'Kategori'}
                description={'Kelola informasi data kategori'}
            >
                <div className="flex gap-6 h-screen w-full">
                    <div className="flex-1 bg-white border border-slate-300 rounded-3xl p-6 overflow-auto">
                        <div className="flex flex-col gap2">
                            <h3 className="text-xl text-slate-800 font-medium">Daftar Kategori</h3>
                            <p className="text-sm text-slate-500">Berikut daftar data kategori yang tersedia.</p>
                        </div>
                        <div className="flex flex-col gap-6 mt-12">
                            {
                                categories?.map((c) => (
                                    <CategoryCard
                                        key={c?.id}
                                        category={c}
                                        onUpdate={() => {
                                            setSelectedCategory(c)
                                            setIsEditing(true)
                                        }}
                                        onDelete={() => {
                                            setSelectedCategory(c)
                                            setOpenAlertDelete(true)
                                        }} />
                                ))
                            }
                        </div>
                    </div>
                    <div className="flex-1 bg-white border border-slate-300 rounded-3xl p-6">
                        {
                            isEditing
                                ? <div className="flex flex-col gap-14">
                                    <UpdateFormHeader />
                                    <UpdateForm
                                        selectedCategory={selectedCategory}
                                        onCancel={() => setIsEditing(false)}
                                        onSuccess={() => setIsEditing(false)}
                                    />
                                </div>
                                : <div className="flex flex-col gap-14">
                                    <CreateFormHeader />
                                    <CreateForm />
                                </div>
                        }
                    </div>
                </div>
                <DeleteAlertDialog
                    open={openAlertDelete}
                    onOpenChange={setOpenAlertDelete}
                    selectedCategory={selectedCategory}
                    onSucces={() => setOpenAlertDelete(false)}
                />
            </DashboardLayout>
        </>
    )
}

function CategoryCard({ category, onUpdate, onDelete }) {
    return (
        <div className="p-6 rounded-2xl bg-itxSurface border border-slate-300">
            <div className="flex flex-col gap-2">
                <h3 className="text-lg text-itxPrimary-500 font-medium">{category?.name}</h3>
                <p className="text-sm text-slate-500">{category?.desc || '--'}</p>
            </div>
            {category?.name.toLowerCase() !== 'tidak ada' &&
                (
                    <div className="flex flex-row gap-2 justify-end">
                        <Button
                            size={'sm'}
                            variant={'accentOne'}
                            onClick={onUpdate}
                        >Edit</Button>
                        <Button
                            size={'sm'}
                            variant={'destructive'}
                            onClick={onDelete}
                        >Hapus</Button>
                    </div>
                )
            }
        </div>
    )
}

function UpdateFormHeader() {
    return (
        <div className="flex flex-col gap-2">
            <h4 className="text-lg font-medium text-slate-800">Edit Kategori</h4>
            <p className="text-sm text-slate-500">Isi form dibawah ini untuk memperbarui kategori</p>
        </div>
    )
}

function CreateFormHeader() {
    return (
        <div className="flex flex-col gap-2">
            <h4 className="text-lg font-medium text-slate-800">Tambah Kategori</h4>
            <p className="text-sm text-slate-500">Isi form dibawah ini untuk menambah kategori</p>
        </div>
    )
}

const CreateShcema = z.object({
    name: z.string().nonempty({
        message: 'Nama kategori wajib dipilih'
    }),
    description: z.string().nullable()
})

function CreateForm() {
    const form = useForm({
        resolver: zodResolver(CreateShcema),
        defaultValues: {
            name: '',
            description: ''
        }
    })

    const onSubmit = (data) => {
        router.post('/categories', {
            category_name: data.name,
            category_desc: data.description
        }, {
            onSuccess: () => form.reset()
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full space-y-6">
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama</FormLabel>
                            <FormControl>
                                <Input placeholder='Masukkan nama kategori' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Deskripsi</FormLabel>
                            <FormControl>
                                <Input placeholder='Masukkan deskripsi (opsional)' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button variant={'accentOne'} type={'submit'}>Simpan</Button>
            </form>
        </Form>
    )
}


function UpdateForm({ selectedCategory, onCancel, onSuccess }) {
    const form = useForm({
        resolver: zodResolver(UpdateShcema),
        defaultValues: {
            name: '',
            description: ''
        }
    })

    React.useEffect(() => {
        console.log(selectedCategory)
        if (selectedCategory) {
            form.reset({
                name: selectedCategory.name || '',
                description: selectedCategory.desc || '',
            })
        }
    }, [selectedCategory])

    const onSubmit = (data) => {
        router.put(`/categories/${selectedCategory?.id}`, {
            category_name: data.name,
            category_desc: data.description
        }, {
            onSuccess: () => {
                onSuccess?.()
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full space-y-6">
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama</FormLabel>
                            <FormControl>
                                <Input placeholder='Masukkan nama kategori' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Deskripsi</FormLabel>
                            <FormControl>
                                <Input placeholder='Masukkan deskripsi (opsional)' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button variant={'accentOne'} type={'submit'}>Simpan</Button>
                <Button variant={'secondary'} onClick={onCancel} className={'mt-6'}>Batal</Button>
            </form>
        </Form>
    )
}

const UpdateShcema = z.object({
    name: z.string().nonempty({
        message: 'Nama kategori wajib dipilih'
    }),
    description: z.string().nullable()
})

function DeleteAlertDialog({
    open,
    onOpenChange,
    selectedCategory,
    onSucces,
}) {
    const handleDelete = () => {
        router.delete(`/categories/${selectedCategory?.id}`, {
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
                        {`Apakah anda yakin ingin menghapus unit barang ${selectedCategory?.code}?`}
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