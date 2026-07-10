"use client";
import React from 'react';
import Spinner from '@/components/ui/Spinner';

type ErrorProps = {
    children:React.ReactNode;
    isLoading:boolean | null;
    isError:boolean | null;
    error:any;
    isSuccess:boolean | null;
    silent?: boolean;
}

const ErrorBoundary = React.memo(({children,isLoading,isError,error,isSuccess,silent}:ErrorProps) => {
    if(isLoading){
        return silent ? null : <Spinner />;
    }
    if(isError){
        return <div className='text-center my-10 font-bold capitalize'>{error?.response?.data?.message}</div>
    }
    if(isSuccess){
        return <>{children}</>;
    }
})

ErrorBoundary.displayName = 'ErrorBoundary';

export default ErrorBoundary;
