'use client'

import PlaceForm from '@/components/PlaceForm'
import { useParams } from 'next/navigation'
import React from 'react'

export default function EditPlace() {
    const params = useParams();
    const id = params.id as string
  return (
    <div className='flex justify-center items-center w-full'>
        <PlaceForm placeId={id}/>
    </div>
  )
}
