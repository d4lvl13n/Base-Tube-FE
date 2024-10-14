import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const SignUpPage: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <SignUp 
        routing="path" 
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gray-900 text-white",
          }
        }}
      />
    </div>
  );
};

export default SignUpPage;