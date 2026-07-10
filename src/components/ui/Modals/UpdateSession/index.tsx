import { useForm } from 'react-hook-form';
import Modal from '../Modal';

import Input from '@/components/form/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateSessionProps, UpdateSessionSchema } from '@/utils/types&schemas/Generic/Chat';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import useUpdateSessions from '@/lib/tanstack/Sessions/useUpdate';

type Props = {
    isOpen:boolean;
    setIsOpen:(isExpanded: boolean) => void;
    data:{
        session_id:string;
        title:string;
    }
}

export default function UpdateSessionModal({
    isOpen,
    setIsOpen,
    data
}:Props) {
    const router = useRouter();
    const {register,handleSubmit,formState:{errors}} = useForm<UpdateSessionProps>({
        resolver:zodResolver(UpdateSessionSchema),
        defaultValues:{
            session_id:data?.session_id || "",
            title:data?.title || "",
        }
    });
    const onSuccess = (data:any)=>{
        setIsOpen(false);
        console.log(data);
        router.push(`/?id=${data?.data?.session_id}`)
    }
    const onError = (e:any)=>{
        toast.error("Error Occurred");

    }

    const updateSession = useUpdateSessions({onSuccess,onError});
    const onSubmit = (data:UpdateSessionProps)=>{
        updateSession.mutate(data);
    }
  return (
    <Modal 
    isOpen={isOpen}
    onClose={()=>setIsOpen(false)}
    >
        <div className='w-full flex flex-col items-center py-4 px-10 gap-4'> 
            <form className='space-y-7' onSubmit={handleSubmit(onSubmit)}>
                <p className='text-center font-semibold text-lg capitalize'>
                    Update Session Title
                </p>
                <Input 
                register={register}
                errors={errors}
                id='title'
                placeholder='Enter Chat Title'
                name="Title"
                />
                <div className='flex items-center justify-center gap-5'>
                    <button 
                    className='btn btn-primary px-6! capitalize'
                    type='submit'
                    >
                        Submit
                    </button>
                    <button 
                    className='btn btn-secondary px-6! capitalize'
                    type='button'
                    onClick={()=>setIsOpen(false)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </Modal>
  )
}
