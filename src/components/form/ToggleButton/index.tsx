import React, { useState } from "react";

type ToggleProps = {
    handleToggle: (id:string|number)=>any;
    status:boolean;
    id:string|number;
}

const ToggleButton = ({handleToggle,status,id}:ToggleProps) => {
   
    
    return (
        <div
            onClick={()=>handleToggle(id)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                status ? "bg-gradient-primary" : "bg-gray-300"
            }`}
            dir="ltr"
            title="Toggle Button"
        >
            <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform duration-300 ${
                    status ? "translate-x-6" : "translate-x-0"
                }`}
            ></div>
        </div>
    );
};

export default ToggleButton;
