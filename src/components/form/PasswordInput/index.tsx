import type { InputProps } from '@/utils/types&schemas/Form/Input';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { FaLock } from 'react-icons/fa';



export default function PasswordInput({
    name,
    register,
    errors,
    id="password",
    placeholder="Enter Password",
    icon,
    className,
    isAuth = true,
}:InputProps
){
    const [showPassword, setShowPassword] = useState(false);
  return (
    <div className={`${className}`}>
        <label htmlFor={id} className="block text-sm font-medium capitalize text-gray-700 mb-2">
        {name}
        </label>
        <div className="relative">
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none z-10">
            <span className="text-gray-400">{icon? icon :<FaLock className='text-purple-600' size={22} />}</span>
        </div>
        <input
            id={id}
            type={showPassword ? 'text' : 'password'}
            {...register(id)}
            className={`
                ${isAuth ? "":"text-neutral1 bg-primaryA1/5"}
              w-full ps-12 pe-4 py-3 bg-cream-bg border border-grayA4/20 rounded-lg  
             placeholder-grayA2 focus:outline-none focus:ring-2 focus:ring-primaryA1
              focus:border-transparent transition-all duration-300`}
            placeholder={placeholder}
        />
        <button
            type="button"
            className="absolute inset-y-0 end-0 pe-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
        >
            <span className=" cursor-pointer text-gray-400">
            {showPassword ? 
            <EyeOff className="w-5 h-5" />
             : 
            <Eye className="w-5 h-5" />
             }
            </span>
        </button>
        </div>
        <div className='mt-1 capitalize text-sm'>
            {errors?.[id] && 
            <p className='text-statusError font-semibold'>{errors[id].message}</p>
            }
        </div>
    </div>
  )
}
