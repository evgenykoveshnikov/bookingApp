// components/PlaceForm.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { supabase } from '@/utils/supabase/supabaseClient';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Схема валидации формы (можно использовать ту же, что и для создания)
const placeFormSchema = z.object({
    name: z.string().min(1, { message: 'Название обязательно' }),
    address: z.string().min(1, { message: 'Адрес обязателен' }),
    capacity: z.coerce.number()
        .min(1, { message: 'Вместительность должна быть как минимум 1' })
        .refine(val => !isNaN(val), { message: 'Вместительность должна быть числом' }),
    image: z.custom<FileList>()
        .optional() // Изображение опционально для формы, т.к. при редактировании может быть сохранено старое
        .refine((files) => {
            if (!files || files.length === 0) {
                return true;
            }
            return files[0].size <= 5 * 1024 * 1024;
        }, {
            message: 'Размер изображения не должен превышать 5MB'
        })
        .refine((files) => {
            if (!files || files.length === 0) {
                return true;
            }
            return ['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type);
        }, {
            message: 'Только .jpg, .png, .webp форматы разрешены'
        }),
});

interface PlaceFormProps {
    placeId?: string; // Опциональный ID места, если мы в режиме редактирования
}

export default function PlaceForm({ placeId }: PlaceFormProps) {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<z.infer<typeof placeFormSchema>>({
        resolver: zodResolver(placeFormSchema),
    });
    const [loading, setLoading] = useState(false);
    const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null); // Для отображения текущего изображения при редактировании
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const isEditMode = !!placeId; // Определяем, находимся ли мы в режиме редактирования

    // Загрузка данных места для заполнения формы при редактировании
    useEffect(() => {
        const fetchPlaceData = async () => {
            if (!isEditMode || !placeId) return;

            setLoading(true);
            const { data, error } = await supabase
                .from('places')
                .select('*')
                .eq('id', placeId)
                .single();

            if (error) {
                toast.error(`Ошибка загрузки данных места: ${error.message}`);
                router.push('/places'); // Перенаправить, если ошибка или место не найдено
            } else if (data) {
                // Заполняем форму данными из базы
                setValue('name', data.name);
                setValue('address', data.address);
                setValue('capacity', data.capacity);
                setInitialImageUrl(data.imageUrl); // Сохраняем текущий URL изображения
            }
            setLoading(false);
        };

        // Проверяем роль пользователя перед загрузкой данных или редиректом
        if (!authLoading && user && user.role === 'admin') {
            fetchPlaceData();
        } else if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/places'); // Перенаправляем, если пользователь не админ
        }
    }, [placeId, isEditMode, authLoading, user, router, setValue]); // Добавляем setValue в зависимости

    const onSubmit = async (data: z.infer<typeof placeFormSchema>) => {
        setLoading(true);
        const { name, address, capacity, image } = data;
        let newImageUrl: string | null = initialImageUrl; // Начинаем с текущего изображения

        try {
            // Обработка нового изображения
            if (image && image.length > 0) {
                const imageFile = image[0];
                const fileName = `${Date.now()}-${imageFile.name}`;

                // В режиме редактирования, если есть старое изображение, удаляем его
                if (isEditMode && initialImageUrl) {
                    const oldFileName = initialImageUrl.split('/').pop();
                    if (oldFileName) {
                        const { error: deleteError } = await supabase.storage
                            .from('image-place')
                            .remove([`places/${oldFileName}`]); // Убедитесь, что путь правильный

                        if (deleteError) {
                            console.error('Ошибка удаления старого изображения:', deleteError.message);
                            // Можно не выбрасывать ошибку, чтобы не прерывать обновление места
                        }
                    }
                }

                // Загружаем новое изображение
                const { data: imageData, error: uploadError } = await supabase.storage
                    .from('image-place')
                    .upload(`/places/${fileName}`, imageFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    throw new Error(`Ошибка загрузки изображения: ${uploadError.message}`);
                }
                newImageUrl = supabase.storage.from('image-place').getPublicUrl(imageData.path).data.publicUrl;
            } else if (isEditMode && initialImageUrl && !image) {
                // Если в режиме редактирования нет нового изображения, но было старое, сохраняем старое.
                // (Если нужно явно удалить изображение, потребуется отдельная кнопка или чекбокс)
                newImageUrl = initialImageUrl;
            } else if (!isEditMode && !image) {
                // В режиме создания, если изображение не выбрано, оно будет null
                newImageUrl = null;
            }

            // Выполнение операции insert или update
            if (isEditMode && placeId) {
                // Режим редактирования: UPDATE
                const { error: updateError } = await supabase
                    .from('places')
                    .update({
                        name,
                        address,
                        capacity,
                        imageUrl: newImageUrl // Используем новый или старый URL изображения
                    })
                    .eq('id', placeId)
                    .select() // Важно, чтобы получить обновленные данные
                    .single();

                if (updateError) {
                    console.log(updateError )
                    toast.error(`Ошибка обновления объекта: ${updateError.message}`);
                } else {
                    toast.success('Объект успешно обновлен!');
                    router.push(`/places/${placeId}`); // Перенаправить на страницу деталей
                }
            } else {
                // Режим создания: INSERT
                const { data: newPlace, error: insertError } = await supabase
                    .from('places')
                    .insert([
                        {
                            name,
                            address,
                            capacity,
                            owner_user_id: user?.id,
                            imageUrl: newImageUrl
                        }
                    ])
                    .select()
                    .single();

                if (insertError) {
                    toast.error(`Ошибка создания объекта: ${insertError.message}`);
                } else {
                    toast.success('Объект успешно создан!');
                    router.push('/places');
                    // reset(); // Очистить форму после создания
                    

                    // Опционально: Отправить email (симуляция)
                    if (newPlace && user?.email) {
                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                to: user.email,
                                subject: `Новое место ${newPlace.name} успешно создано`,
                                body: `Поздравляю! Вы успешно добавили новое место: ${newPlace.name} по адресу ${newPlace.address}`
                            })
                        });
                        toast.success('Информация отправлена на почту(симуляция)')
                    }

                     // Перенаправить на список мест
                }
            }
        } catch (err) {
            if(err instanceof Error) {
                toast.error(`Произошла непредвиденная ошибка: ${err.message}`);
            }
            
        } 
    };

    // Отображение спиннера, если данные пользователя еще загружаются или не админ
    if (authLoading || !user || user.role !== 'admin' || loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500'></div>
            </div>
        );
    }

    return (
        <Card className='w-full max-w-sm'>
            <CardHeader>
                <CardTitle className='text-2xl'>
                    {isEditMode ? 'Редактирование объекта' : 'Создание нового объекта'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='name'>Название:</Label>
                        <Input
                            type='text'
                            id='name'
                            {...register('name')}
                            placeholder='Домик в лесу'
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='address'>Адрес:</Label>
                        <Input
                            type='text'
                            id='address'
                            {...register('address')}
                            placeholder='Савхозная 10'
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='capacity'>Вместительность:</Label>
                        <Input
                            type='number'
                            id='capacity'
                            {...register('capacity')}
                            placeholder='1-50'
                        />
                        {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity.message}</p>}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='image'>Изображение:</Label>
                        <Input
                            type='file'
                            id='image'
                            accept='image/jpeg,image/png,image/webp'
                            {...register('image')}
                        />
                        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image.message}</p>}
                        {isEditMode && initialImageUrl && (
                             <p className="text-sm text-gray-500 mt-1">Оставьте пустым, чтобы сохранить текущее изображение.</p>
                        )}
                    </div>
                    <Button variant={'default'} type='submit' disabled={loading}>
                        {loading ? (isEditMode ? 'Обновление...' : 'Создание...') : (isEditMode ? 'Сохранить изменения' : 'Создать')}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}