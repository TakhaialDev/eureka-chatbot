import type { InputProps } from '@/utils/types&schemas/Form/Input'
import React from 'react'

export default function Input({
  register,
  errors,
  id,
  type = "text",
  placeholder = "Enter Text",
  name = "",
  icon,
  className = "",
  settings = {},
  isAuth = true,
  value,
  defaultValue
}: InputProps) {
  return (
    <div className={className}>
        {
          name &&
          <label htmlFor={id} className="block text-sm font-bold text-grayA1 mb-2 px-2 capitalize">
          {name}
          </label>
        }
        <div className="relative">
        {icon && 
        <label 
        htmlFor={id}
        className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none z-10"
        >
          {icon}
        </label>
        }
        <input
            id={id}
            type={type}
            {...settings}
            {...register(id)}
            value={value}
            defaultValue={defaultValue}
            className={`
            ${isAuth ? "":"text-neutral1 bg-primaryA1/5"}
            w-full ${!!icon ? "ps-12": "ps-4"}  pe-4 py-3 bg-cream-bg border border-grayA4/20 rounded-lg  
            placeholder-grayA2 focus:outline-none focus:ring-2 focus:ring-primaryA1
            focus:border-transparent transition-all duration-300 disabled:bg-grayA3/20 !disabled:text-white`}
            placeholder={placeholder}
        />
        </div>
        {errors?.[id] &&
        <div className='mt-1 capitalize text-sm'>
            <p className='text-statusError font-semibold'>{errors[id].message}</p>
        </div>
        }
    </div>
  )
}
