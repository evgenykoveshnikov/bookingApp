'use client'

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/utils/supabase/supabaseClient'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const authSchema = z.object({
    email: z.string().email({ message: 'Введите правильный email'}),
    password: z.string().min(6, { message: 'Пароль как минимум 6 символов'})
})



export default function AuthForm() {
    const { register, handleSubmit, formState: { errors }} = useForm({
        resolver: zodResolver(authSchema)
    });
    const [loading, setLoading] = useState(false);
    const [isAdminCheckBox, setIsAdminCheckBox] = useState(false);
    const [isLogin, setIsLogin] = useState(true)
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace('/places');
            }
        };
        checkUser();
    }, [router]);

    const onSubmit = async (data: z.infer<typeof authSchema>) => {
        setLoading(true);
        const { email, password } = data;
        let authError = null;

        try {
            if(isLogin) {
                const {error: signInError} = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                authError = signInError
                
            } else {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password
                });
                authError = signUpError;

                if(!signUpError && signUpData.user) {
                    const roleToAssign = isAdminCheckBox ? 'admin' : 'user'

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                user_id: signUpData.user.id,
                                email: signUpData.user.email,
                                role: roleToAssign
                            }
                        ])
                    
                    if(profileError) {
                        console.error(profileError.message);
                        setLoading(false);
                        return
                    }
                    
                    await fetch('/api/send-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                to: data.email,
                                subject: `Аккаунт успешно создан`,
                                body: `Поздравляю, теперь вы можете смотреть места`
                            })
                    });
                    toast.success('Для потверждения аккаунта зайдите на почту(симуляция)')

                }
            }

            if(authError) {
                toast.error(`Ошибка`, {
                    description: authError.message,
                })
            } else {
                toast.success(isLogin ? 'Авторизация успешно прошла' : 'Аккаунт успешно создан')
                router.push('/places')
            }

            
            
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }
  return (
    <Card className='w-full max-w-sm'>
        <CardHeader className='text-center'>
            <CardTitle>
                {isLogin ? 'Войти' : 'Регистрация'}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
                <div className='flex flex-col gap-2'>
                    <Label htmlFor="email" className='block'>
                        Email:
                    </Label>
                    <Input 
                        type="email"
                        id='email'
                        {...register('email')}
                        placeholder='your@example.com'
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
                </div>
                <div className='flex flex-col gap-2'>
                    <Label htmlFor='password'>
                        Пароль:
                    </Label>
                    <Input 
                        type='password'
                        id='password'
                        {...register('password')}
                        placeholder='******'/>
                    {errors.password && <p className="text-red-500 text-xs  mt-1">{String(errors.password.message)}</p>}
                </div>
                {!isLogin && (
                    <div className='flex gap-2'>
                        <Checkbox id='isAdmin' checked={isAdminCheckBox} onCheckedChange={(check) => {
                            setIsAdminCheckBox(check === true)
                        }}/>
                        <Label>Стать хозяином, он же Админ</Label>
                    </div>
                )}
                <Button variant={'default'} className='w-full' type='submit'>{isLogin ? 'Войти' : 'Зарегистрироваться'}</Button>
            </form>
        </CardContent>
        {isLogin ? (
            <CardFooter className='flex flex-col gap-2'>
            <div className='flex items-center gap-2 justify-center'>
                <p className='text-sm'>Нет аккаунта? </p>
                <Button variant={'link'} className='text-sm p-0 cursor-pointer' onClick={() => setIsLogin(false)}>зарегистрироваться</Button>
            </div>
            </CardFooter>
        ) : ''}
    </Card>
  )
}
