'use client'

import PlaceCard from '@/components/PlaceCard';
import { Place } from '@/types/types';
import { supabase } from '@/utils/supabase/supabaseClient';
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import { PDFDocument, rgb } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import fontkit from '@pdf-lib/fontkit'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

export default function PlaceDetails() {
    const { user } = useAuth();
    const router = useRouter()
    const params = useParams();
    const id = params.id as string;
    const [place, setPlace] = useState<Place | null>(null);
    const [loading, setLoading] = useState(true);
    const isAdmin = user?.role === 'admin'

    useEffect(() => {
        const fetchPlace = async () => {
            if(!id) return;

            setLoading(true);
            const { data, error } = await supabase
                .from('places')
                .select('*')
                .eq('id', id)
                .single()

            if(error) {
                toast(`error ${error.message}`)
                setPlace(null)
            } else {
                setPlace(data as Place)
            }
            setLoading(false)
        }    
        fetchPlace();
    }, [id])

    const handleDownloadPdf = async () => {
        if(!place) {
            toast(`Данные места не загружены`)
            return
        }

        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();

            const fontBytes = await fetch('/fonts/OpenSans-Regular.ttf').then(res => res.arrayBuffer())
            pdfDoc.registerFontkit(fontkit)
            const font = await pdfDoc.embedFont(fontBytes);

            page.drawText('Информация о месте:', {
                x:50,
                y:750,
                font,
                size:24,
                color: rgb(0.1,0.1,0.4)
            });

            page.drawText(`Название: ${place.name}`, {
                x: 50,
                y: 700,
                font,
                size: 18,
                color: rgb(0, 0, 0),
            });

            page.drawText(`Адрес: ${place.address}`, {
                x: 50,
                y: 670,
                font,
                size: 18,
                color: rgb(0, 0, 0),
            });

            page.drawText(`Вместительность: ${place.capacity} people`, {
                x: 50,
                y: 640,
                font,
                size: 18,
                color: rgb(0, 0, 0),
            });

            page.drawText(`Дата создания: ${new Date(place.created_at).toLocaleDateString()}`, {
                x: 50,
                y: 610,
                font,
                size: 18,
                color: rgb(0, 0, 0),
            });

            if(place.imageUrl) {
                try {
                    const imageResponce = await fetch(place.imageUrl)
                    const imageBytes = await imageResponce.arrayBuffer();

                    let embedImage;
                    const imageType = place.imageUrl.toLowerCase();

                    if (imageType.endsWith('.png')) {
                        embedImage = await pdfDoc.embedPng(imageBytes);
                    } else if (imageType.endsWith('.jpg') || imageType.endsWith('.jpeg')) {
                        embedImage = await pdfDoc.embedJpg(imageBytes);
                    } else if (imageType.endsWith('.webp')) {
                        toast.warning('Формат изображения не поддерживается для PDF (только PNG/JPG).');
                        console.warn('Unsupported image format for PDF:', place.imageUrl);
                    }
                    if (embedImage) {
                        const pageHeight = page.getHeight();
                        const pageWidth = page.getWidth();
                        const margin = 50; // Отступ по краям
                        const maxImageWidth = pageWidth - (2 * margin); // Максимальная ширина изображения
                        const maxImageHeight = 550 - margin; // Максимальная высота (от текущей позиции до нижнего отступа)

                        const originalWidth = embedImage.width;
                        const originalHeight = embedImage.height;

                        // Расчет масштабирования для вписывания в границы с сохранением пропорций
                        let scale = 1;
                        if (originalWidth > maxImageWidth) {
                            scale = maxImageWidth / originalWidth;
                        }
                        if (originalHeight * scale > maxImageHeight) {
                            scale = maxImageHeight / originalHeight;
                        }

                        const imgWidth = originalWidth * scale;
                        const imgHeight = originalHeight * scale;

                        // Центрирование изображения по горизонтали
                        const imageX = (pageWidth - imgWidth) / 2;
                        // Размещаем изображение ниже текущего текста
                        const imageY = 550 - imgHeight - 20; // 20 - небольшой отступ снизу от текста

                        page.drawImage(embedImage, {
                            x: imageX,
                            y: imageY,
                            width: imgWidth,
                            height: imgHeight,
                        });
                    }
                } catch (imageError) {
                    toast.error(`Не удалось добавить изображение в PDF: ${imageError.message || 'неизвестная ошибка'}`);
                    console.error('Ошибка при загрузке или встраивании изображения в PDF:', imageError);
                }
            }

            const pdfBytes = await pdfDoc.save();

            const blob = new Blob([pdfBytes], {type: 'application/pdf'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const placeName = (place.name).replace(' ', '_')
            link.href = url;
            link.download = `${placeName}_details.pdf`; // Filename for download
            document.body.appendChild(link); // Add link to DOM
            link.click(); // Simulate click on link
            document.body.removeChild(link); // Remove link from DOM
            URL.revokeObjectURL(url); // Revoke object URL

            toast(`Успешно создан и сохранен файл ${link.download}`)
        } catch(err: any) {
            toast(`Ошибка создания pdf ${err.message || 'неизвестная ошибка'}`)
        }
    }

    const handleEditClick = () => {
        router.push(`/places/${id}/edit`)
    }
  return (
    <div className='flex flex-col grow  items-center'>
        <Card className='w-150 p-0 pb-4 mt-4'>
            {place?.imageUrl && (
                <div className='relative  h-96'>
                          <Image 
                            src={place.imageUrl}
                            alt={place.name || 'Изображение Места'}
                            fill
                            style={{ objectFit: "cover" }}
                            className='rounded-t-md'
                            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'/>
                </div>
            )}

            {(!place?.imageUrl || place.imageUrl === '') && (
                <div className='w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500 rounded-t-mb'>
                    {place?.name}
                </div>
            )}
            <CardHeader>
                <CardTitle className='text-2xl'>
                    {place?.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>Адрес: {place?.address}</p>
                <p>Вместимость: {place?.capacity}</p>
            </CardContent>
            <Separator />
            <CardFooter className='flex justify-between'>
                {isAdmin ? (
                    <Button variant={'default'} size={'lg'} onClick={handleEditClick}>Редактировать</Button>
                ) : (
                    <Button variant={'default'} size={'lg'}>Забронировать</Button>
                )}
                <Button variant={'link'} onClick={handleDownloadPdf}>Скачать PDF</Button>
            </CardFooter>
        </Card>
    </div>
  )
}
