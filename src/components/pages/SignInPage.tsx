import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const SignInPage: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <SignIn 
        routing="path" 
        path="/sign-in"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-black text-white",
          }
        }}
      />
    </div>
  );
};

export default SignInPage;