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
          <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-2 px-1 capitalize">
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
            w-full ${!!icon ? "ps-12": "ps-4"} pe-4 py-3 bg-input border border-border/50 rounded-xl
            text-foreground placeholder-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
            transition-all duration-300 disabled:opacity-50`}
            placeholder={placeholder}
        />
        </div>
        {errors?.[id] &&
        <div className='mt-1 capitalize text-sm'>
            <p className='text-destructive font-semibold'>{errors[id].message}</p>
        </div>
        }
    </div>
  )
}
