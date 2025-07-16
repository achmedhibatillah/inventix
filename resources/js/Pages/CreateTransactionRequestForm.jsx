import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
    description: z.string().nullish(),
    unit_id: z.string().nonempty(),
    user_id: z.string().nonempty(),
    start: z.coerce.date({
        required_error: 'Tanggal mulai harus diisi',
        invalid_type_error: 'Tanggal mulai tidak valid',
    }),
    end: z.coerce.date({
        required_error: 'Tanggal selesai harus diisi',
        invalid_type_error: 'Tanggal selesai tidak valid',
    }),
}).refine((data) => data.end >= data.start, {
    message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai',
    path: ['end'],
}).refine((data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.start >= today;
}, {
    message: 'Tanggal mulai tidak boleh lebih awal dari tanggal sekarang',
    path: ['start'],
});

export default function CreateTransactionRequestForm({
    selectedUnit, user, onClose
}) {
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            description: undefined,
            user_id: user?.user_id,
            unit_id: selectedUnit?.id,
            start: Date.now(),
            end: Date.now()
        }
    })

    const onSubmit = (data) => {
        console.log(data)
        router.post('/transactions/request', {
            inventarisd_id: data.unit_id,
            user_id: data.user_id,
            transaction_desc: data.description,
            transaction_start: data.start,
            transaction_end: data.end
        }, {
            onSuccess: () => {
                onClose?.()
            },
            onError: (e) => console.log(e)
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full space-y-6">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Deskripsi</FormLabel>
                            <FormControl>
                                <Input placeholder='Masukkan deskripsi opsional' {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="start"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tanggal Mulai</FormLabel>
                            <FormControl>
                                <Input type={'date'} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="end"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tanggal Selesai</FormLabel>
                            <FormControl>
                                <Input type={'date'} placeholder='Pilih tanggal' {...field} />
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