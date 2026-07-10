export interface InputProps {
  register?: any;
  errors?: Record<string, { message?: string }>;
  id: string;
  type?: string;
  placeholder?: string;
  name?: string | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  settings?: Record<string, any>;
  isAuth?:boolean;
  value?:string | boolean | number ;
  defaultValue?:string | boolean | number;
};
