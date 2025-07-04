import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
    email: z.string().nonempty({
        message: 'Email wajib diisi'
    }),
    pass: z.string().nonempty({
        message: 'Password wajib diisi'
    }),
    name: z.string().nonempty({
        message: 'Nama lengkap wajib diisi'
    }),
    role: z.enum(['petugas', 'guru'])
})

export default function CreateUserForm({ onClose }) {
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
            pass: '',
            name: '',
            role: 'guru'
        }
    })

    const onSubmit = (data) => {
        router.post('/users', {
            user_email: data.email,
            user_pass: data.pass,
            user_fullname: data.name,
            user_role: data.role
        }, {
            onSuccess: () => {
                onClose?.()
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Lengkap</FormLabel>
                            <FormControl>
                                <Input  {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input  {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='pass'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input  {...field} type={'password'} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value ? String(field.value) : undefined}
                                defaultValue={field.value ? String(field.value) : undefined}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih role..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem key={1} value={'guru'}>
                                        Guru
                                    </SelectItem>
                                    <SelectItem key={2} value={'petugas'}>
                                        Petugas
                                    </SelectItem>
                                    <SelectItem key={3} value={'admin'}>
                                        Admin
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" variant={'accentOne'} className={'w-full mt-6'}>
                    Simpan
                </Button>
            </form>
        </Form>
    )
}